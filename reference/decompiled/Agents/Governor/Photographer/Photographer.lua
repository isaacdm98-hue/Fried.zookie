#Photographer specializes SuperCam embeds Sound

STATE_INIT = -1
STATE_TRANSIT_IN = 1
STATE_TRANSIT_OUT = 2
STATE_OK = 3

RECENT_FILE = "0_recent.bmi"	-- 0 so first file in list

function Initialize(world, notifyAgent, nofityMessage, cameraPosition, targetPosition, photoSize, cameraMode, path, pickImage, pickImageTitle, numAlbumPics, anamorphic, letterboxed)

	myState = STATE_INIT
	
	myNotifyAgent = notifyAgent
	myNofityMessage = nofityMessage
	myCameraPosition = cameraPosition
	myTargetPosition = targetPosition
	myCameraMode = cameraMode
	myPickImage = pickImage
	myPickImageTitle = pickImageTitle
	myNumAlbumPics = numAlbumPics
	myPath =  path
	myPhotoSize = photoSize
	myAnamorphic = anamorphic
	myLetterboxed = letterboxed
	

	local diff = myTargetPosition-myCameraPosition
	myDistance = Vector.GetLength(diff)
	local hDiff = Vector.New(Vector.GetX(diff), 0, Vector.GetZ(diff))
	local dot = Vector.Dot(hDiff/Vector.GetLength(hDiff), Vector.New(1,0,0))
	myYaw = Number.acos(dot) -90
	local vDiff = Vector.New(Vector.GetLength(hDiff), 0, Vector.GetY(diff))
	local dot = Vector.Dot(vDiff/Vector.GetLength(vDiff), Vector.New(1,0,0))
	myAngle = Number.acos(dot) 
	
	Agent.PostMessage("CreateProperties", Agent.Me(), 0.1)
	myAlert = Agent.Create("Alert","Loading images, please wait...", false, nil, nil)
	Camera.Show(false)
	
end


function MessageCreateProperties()
	
	if myState ~= STATE_INIT then
		return
	end
	
	width, height = Camera.Area()
	
	local marg = 8
	local camWidth = myPhotoSize
	local camHeight = camWidth
	local panelWidth = camWidth+(marg*4)
	local panelLeft, panelRight, panelTop, smallWidth, smallRight = SetScreenAndPanelSize(panelWidth, myAnamorphic, myLetterboxed)
	myGUIWidth = width-panelLeft

	local y = panelTop
	local bottom = y+camHeight+(marg*4)

--	GUI.CreateObject( "panel_layer",  1, 0, width, height, false )
--	GUI.CreateObject( "glow_layer",  1, 0, width, height, false )
	AddPanel( panelLeft, y, panelRight, y+(camHeight+(marg*4)), 1, 1, false, false, Segment.glow_layer, Segment.panel_layer )

	-- create preview camera
	World.OpenAccess(myWorld)
		myPreview = Agent.Create("BaseCamera", myCameraPosition, Quatn.New(), panelLeft+(marg*2), y+(marg*2), panelRight-(marg*2), bottom-(marg*2))
	World.CloseAccess()
	local rFog, gFog, bFog = Config.Get("sky_r", 1), Config.Get("sky_g", 1), Config.Get("sky_b", 1) 
	Agent.SendMessage("SetClipPlanes", myPreview, 0.1, 200 )
	Agent.SendMessage("Fog", myPreview, Config.Get("fogging", 1), Config.Get("fog_start", 40), Config.Get("fog_end", 80) , 1, rFog, gFog, bFog )
	Agent.SendMessage("Background", myPreview, rFog, gFog, bFog )
	Agent.SendMessage("SetTarget", myPreview, myTargetPosition, Vector.New( 0, 1, 0 ) )
	
	local guiRatio = myGUIWidth/width
	local cameraViewRatio = 1-guiRatio
	Agent.SendMessage("SetViewOffset", myPreview, guiRatio, 0)
	Agent.SendMessage("HorizontalViewAngle", myPreview, myHorizontalViewAngle*cameraViewRatio)

	myPicture = GUI.CreatePicture( "picture", "", panelLeft+(marg*2), y+(marg*2), panelRight-(marg*2), bottom-(marg*2))
	GUI.Show(Segment.picture, false)
	mySelectedImage = nil
	GUI.CreateBorder( "tv",  panelLeft+marg, y+marg, panelRight-marg, bottom-marg, 64, 0, 128,64, 1 )
	GUI.CreateObject( "camera_click_layer",  panelLeft+(marg*2), y+(marg*2), panelRight-(marg*2), bottom-(marg*2), 1)
	
	y = bottom

	local displayedRowsOnAlbum = 2
	local nosliderOnAlbum = nil
	local albumTitle = "Album"
	local imagesize = 38
	local pick_image_size = imagesize*2
	if myNumAlbumPics == 1 then
		-- only have one album photo labeled most recent photo
		nosliderOnAlbum = 1
		displayedRowsOnAlbum = 1
		albumTitle = "Most recently taken image"
		imagesize = imagesize * 2
	else
		-- only have gallery pics to load up
		System.DeleteFile(myPath.."/"..RECENT_FILE)
	end

	
	local propertyDefs = 
	{
		{ name = "set_pick_image", button = "Set as "..myPickImageTitle.." Image"},
		{ name = "delete", button = "Delete Image"},
		{ name = "view_camera", button = "View Camera" },
		{ name = "camera_mode", label = "Camera Mode", enum = { "Follow", "Cool", "Free" }, default =  myCameraMode},
		{ name = "album", label = albumTitle, texturesize = imagesize, displayedrows = displayedRowsOnAlbum, path = myPath, filespec = "*.bmi", exclude = myPickImage, noslider = nosliderOnAlbum, maxphotos = myNumAlbumPics },
		{ name = "pick_image", label = myPickImageTitle.." Image", texturesize = pick_image_size, displayedrows = 1, path = myPath, filespec = myPickImage, noslider = 1 },
		{ name = "close", button = "Close"}
	}
	
	
	myProperties = Agent.Create( "PropertyEdit", panelLeft,y, panelRight, Agent.Me(), "PropertyEdit", {}, propertyDefs )
	Agent.SendMessage("UpdateAll", myProperties)
	
	local files = System.GetDirectoryContents( myPath,  "*.bmi", 1)
	myTotalPics = getn(files)

	myClosing = false
	Transit(STATE_TRANSIT_IN)
	
	Camera.Show(1)
	Agent.SendMessage("Destroy", myAlert)
	Agent.SendMessage("Show", myNotifyAgent, false)
	
end


function Finalize()
	Agent.SendMessage("Destroy", myProperties)
	Agent.SendMessage("Destroy", myPreview)
end

function MessageDestroy()
	Agent.Destroy()
end


function Transit(t)
	myState = t
	myTransit = 0
	mySmoothTransit = 15
end



function MessagePropertyEditNotify( field, value )
	if myClosing == 1 then
		return
	end
	if field == "album" or field == "pick_image" then
		
		local table = System.ReadArchiveTable(myPath.."/"..value, "")
		GUI.SetImageFromString(Segment.picture, table.image)
		mySelectedImage = value
		GUI.Show(Segment.picture, 1)
	elseif field == "view_camera" then
		mySelectedImage = nil
		GUI.Show(Segment.picture, false)
	elseif field == "camera_mode" then
		myCameraMode = value
	elseif field == "set_pick_image" then
		if mySelectedImage ~= nil and mySelectedImage ~= myPickImage then
			System.DeleteFile(myPath.."/"..myPickImage)
			System.Copy(myPath.."/"..mySelectedImage, myPath.."/"..myPickImage, 0)
			Agent.SendMessage("UpdateTexturePane", myProperties, "pick_image")
		else
			Agent.Create("Alert", "Please select an image to set.", nil, nil, nil)
		end
	elseif field == "delete" then
		if mySelectedImage == nil then
			Agent.Create("Alert", "Please select an image to delete.", nil, nil, nil)
		elseif mySelectedImage  == myPickImage then
			Agent.Create("Alert", "You can not delete the "..myPickImageTitle.." image.", nil, nil, nil)
		else
			System.DeleteFile(myPath.."/"..mySelectedImage)
			myTotalPics = myTotalPics - 1
			mySelectedImage = nil
			GUI.Show(Segment.picture, false)
			Agent.SendMessage("UpdateTexturePane", myProperties, "album")
		end
	elseif field == "close" then
		Agent.SendMessage(myNofityMessage, myNotifyAgent, myPath, myPickImage, myCameraPosition, myTargetPosition, myAngle, myYaw, myDistance, myCameraMode)
		Transit(STATE_TRANSIT_OUT)
		myClosing = 1
	end
end

function MessagePropertyEditGet( field )
	if field == "camera_mode" then
		return myCameraMode
	elseif field == "pick_image" then
		return myPickImage
	elseif field == "album" then
		return "*.bmi"
	end
	return nil
end




function SystemCamera( frametime )
	
	if myState == STATE_INIT then
		return
	end
	
	SuperCam__SystemCamera(frametime)

	
	local otherAngle = 180-((myHorizontalViewAngle/2)+90)
	local hypo = myDistance/Number.sin(otherAngle)
	local viewDistance = Number.sqrt((hypo*hypo)-(myDistance*myDistance)) 
	local r = (viewDistance / width)*myGUIWidth

	local cameraPosition = myCameraPosition
	local targetPosition = myTargetPosition
	
	if myCameraMode  == "Free" then
		-- free camera
		local q = Quatn.New( Vector.New( 0, 0, 1 ), -myAngle ) *
				Quatn.New( Vector.New( 0, 1, 0 ), myYaw+90 )
		targetPosition = cameraPosition + (Vector.New(myDistance,0,0) * q)
	end
	
	local x = r * Number.cos( myYaw )
	local z = r * Number.sin( myYaw )
	local vec = Vector.New(x,0,-z)
	
	if myState == STATE_OK then
		cameraPosition = cameraPosition + vec	
		targetPosition = targetPosition + vec
	elseif myState == STATE_TRANSIT_IN then
		local inc = vec/mySmoothTransit
		local pos = inc * myTransit
		cameraPosition = cameraPosition + pos	
		targetPosition = targetPosition + pos
		myTransit = myTransit + 1
		if myTransit > mySmoothTransit then
			myState = STATE_OK
		end
	elseif myState == STATE_TRANSIT_OUT then
		local inc = vec/mySmoothTransit
		local pos = inc * myTransit
		cameraPosition = cameraPosition + vec - pos	
		targetPosition = targetPosition + vec - pos
		myTransit = myTransit + 1
		if myTransit > mySmoothTransit then
			Agent.SendMessage("Show", myNotifyAgent, 1)
			Agent.PostMessage("Destroy", Agent.Me(), 0.01)
			return
		end
	end
	Camera.SetPosition( cameraPosition )
	Camera.SetTarget( targetPosition, Vector.New( 0, 1, 0 ) )	
	Agent.SendMessage("SetPosition", myPreview, cameraPosition)	
	Agent.SendMessage("SetTarget", myPreview, targetPosition, Vector.New( 0, 1, 0 ))

end


function SystemUIMouseLDown(segment)
	if segment == Segment.camera_click_layer  or segment == Segment.click_layer then
		Sound.Play( "Sounds/Camera.wav" )
		local image = Agent.SendMessage("GetImageAsString", myPreview)
		local filename = "none"
		if myNumAlbumPics ~= nil and myNumAlbumPics == 1 then
			filename = RECENT_FILE	-- overwrites last
		elseif myNumAlbumPics == nil or myTotalPics < myNumAlbumPics then
			-- have as many as you like
			filename = System.GMDateTimeString().." (GMT).bmi"
			filename = String.gsub(filename, ":", ";")
			myTotalPics = myTotalPics + 1
		elseif  myNumAlbumPics ~= 1 then
			Agent.Create("Alert", {"The photo album is full, make some space","for new photographs by deleting some","existing ones."}, nil, nil, nil) 
			return
		end
	
		System.WriteArchiveTable(myPath.."/"..filename, "", "Image Version 1.0", { image = image,  date = System.GMDateTimeString().." (GMT)" } )
		Agent.SendMessage("UpdateTexturePane", myProperties, "album")
		MessagePropertyEditNotify( "album", filename )
	end
end
				
	
function SystemUIMouseRDown(segment)
	if segment == Segment.camera_click_layer or segment == Segment.click_layer then
		-- allow movement click over camera window
		SuperCam__SystemUIMouseRDown( Segment.click_layer )
	end	
end

	
function SystemUIMouseRUp(segment)
	if segment == Segment.camera_click_layer or segment == Segment.click_layer then
		-- allow movement click over camera window
		SuperCam__SystemUIMouseRUp( Segment.click_layer )
	end
end
		