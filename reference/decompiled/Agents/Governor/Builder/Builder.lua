# Builder specializes SuperCam embeds UI, Input, Visual, Sound


constEditMode = 1
constTestMode = 2
constAddMode = 4

constNoneSelected = 0
constPartSelected = 1
constRootSelected = 2

PI =  3.1415927 

-- Set if you want to only use local agents in preference to online ones; however, online ones are still downloaded.
--~ TEST_LOCAL_ZOOKHERDER = 1
--~ TEST_LOCAL_ONLINECONFIG = 1
--~ TEST_LOCAL_USERAUTH = 1
TEST_LOCAL_ZOOKHERDER = false
TEST_LOCAL_ONLINECONFIG = false
TEST_LOCAL_USERAUTH = false

function Initialize( world, frame )
	--Sound.Stream( "Sounds/bamzooki_theme.wav" )
	TEMP_ZOOK_FILE = Config.Get("product_directory", ".") .. "/tempBuilder.zook"


	floorSizeX = 130
	floorSizeZ = 130

	myModified = false

	myWorld = world
	myFrame = frame
	
	myLeftKeyDown = false
	myNewBodyPart = false

	-- edit camera position from camera position
	myLastEditAngle = myAngle
	myLastEditDistance = myDistance
	myLastEditYaw = myYaw
	
	myTypeSelected = constNoneSelected
	myMode = -1
	myX = 0
	mySelectedBodyPart = false
	myRootPosition = Vector.New( 0, 4, 0 )
	myPartPosition = Vector.New( 0, 4, 0 )
	myTransit = false
	myConnectMoving = false
	myEndMoving = false
	myScalingVector = false
	myCreatureName = "Untitled"
	myIKPoints = {}
	myCurrentIKPoint = 0
	myShownIKPoints = 128
	myTab = "shape"
	--myShowBackground = 1
	myLetterboxed = false
	myAnamorphic = Config.Get("builder_anamorphic", false )
	myShowSideLabels = false
	myLastAnon = 0
	myTestCameraMode = "Follow"
	myUIHidden = false
	myShowBackground = 1
	myIKToolDown = false
	--Config.Set( "stencil_shadows", 1 )
	myStopWatchElaspedTime = 0
	myCameraSmoothness = Config.Get("camera_smoothness", 0.9)

	myRightArrowKeyDown = false
	myLeftArrowKeyDown = false
	myForwardKeyDown = false
	myBackwardKeyDown = false
	myUpKeyDown = false
	myDownKeyDown = false
	myShiftsDown = 0

	myGravityMin = 0
	myGravityMax = 400
	myGravityHidden = false
	mySmoothFrameTime = 0.02
	myAutoCentre = 1
	
	myDoingTrial = false
	
	myShowingHelp = false

	World.OpenAccess(world)
		myBuilderParts = Agent.Create( "BuilderParts", myRootPosition, nil )
		myAttributes = Agent.SendMessage( "Attributes", myBuilderParts )

		--~ mySpotLight = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
		--~ Visual.SetLightColour( mySpotLight, 0, 0, 0 )
		--~ mySpotTransform = Matrix.New()
		--~ mySpotFrom = Vector.New( 0, 0, 0 )
		--~ mySpotTo = Vector.New( 0, 0, 0 )
		--~ mySpotTransit = 0
	
		--~ Matrix.SetTranslation( mySpotTransform, Vector.New( 0, 20, 0 ) )
		--~ Matrix.LookAt( mySpotTransform, mySpotTo, Vector.New( 1, 0, 0 ) )
		--~ Visual.SetLightTransform( mySpotLight, mySpotTransform )
		--~ Visual.SetLightRadius( mySpotLight, 50 )
		--~ Visual.SetLightConeAngle( mySpotLight, 10 )

		-- Precedes BoxEnv creation because BoxEnv repositions BuilderTarget 
		myTarget = Agent.Create("ClickableTarget", Vector.New(0, 0, -52), 0.5)
		Config.Set("BuilderTarget", myTarget)
		
		myEnvirons = Agent.Create("BoxEnv", nil, floorSizeX, floorSizeZ, Quatn.New())
		myGrids = Agent.Create("BuilderGrids")
		Agent.SendMessage( "SetFootGrid", myGrids, false, 0 )
		Agent.SendMessage( "SetFootSphere", myGrids, false, 0, 0 )

		Agent.SendMessage("SetVisible", myTarget, 1)
		Visual.CreateShadowSource( Vector.New( 0, -1, 0 ), 0.25 )
		--~ Visual.CreateShadowSource( Vector.New( 0, -1.5, 0 ), 0.25 )
		--~ Visual.CreateShadowSource( Vector.New( 0, -2, 0 ), 0.25 )
		--Agent.SendMessage("SetVisual", myTarget, "TargetArrow", Vector.New(1,1,1), Vector.New(0,1,0))
			
	World.CloseAccess()

	
	Input.RegisterKey(Input.KEY_ESCAPE)
	Input.RegisterKey(Input.KEY_F1)
	Input.RegisterKey(Input.KEY_F2)
	Input.RegisterKey(Input.KEY_B)
	Input.RegisterKey(Input.KEY_L)
	Input.RegisterKey(Input.KEY_U)
	--~ Input.RegisterKey(Input.KEY_G)
	Input.RegisterKey(Input.KEY_SPACE)


	Input.RegisterKey(Input.KEY_S)
	Input.RegisterKey(Input.KEY_C)
	Input.RegisterKey(Input.KEY_V)
	Input.RegisterKey(Input.KEY_X)
	Input.RegisterKey(Input.KEY_DELETE)
	
	local width, height = GUI.Area()
	
	-- dylans silly stuff with milo and finn
	local bg_image = Config.Get("camera_bg_image", "")
	if bg_image ~= "" then
		GUI.CreatePicture( "bg_image", bg_image, 0, 0, width, height )
	end

	Camera.ToFront()
	GUI.ToFront(Segment.click_layer)

	GUI.CreatePicture( "connect_point", "points2.png", 16, 16, 32, 32, 0, 0, .5, 1 )
	GUI.CreatePicture( "end_point", "points2.png", 116, 16, 132, 32, .5, 0, 1, 1 )

	for index = 1, 128 do
		if index == 1 then
			GUI.CreatePicture( "ik_point1", "ikpoint0.png", 0, 0, 16, 16 )
		else
			GUI.CreatePicture( "ik_point"..index, "ikpoint.png", 0, 0, 16, 16 )
		end
	end

	GUI.CreateObject( "glow_layer",  1, 0, width, height, false )
	GUI.SetParent( Segment.glow_layer )
	GUI.CreateObject( "add_glow_layer",  1, 0, width, height, false )
	GUI.CreateObject( "test_glow_layer",  1, 0, width, height, false )

	GUI.CreateObject( "panel_layer",  1, 0, width, height, false )
	GUI.SetParent( Segment.panel_layer )
	GUI.CreateObject( "add_layer",  1, 0, width, height, false )
	GUI.CreateObject( "test_layer",  1, 0, width, height, false )
	GUI.SetParent()
	

	local panelWidth = 148
	local panelLeft, panelRight, panelTop, smallWidth, smallRight = SetScreenAndPanelSize(panelWidth, myAnamorphic, myLetterboxed)


	local y = panelTop + 52
	local x = panelLeft
	local buttonWidth = panelWidth / 4
	local xMarg = ( buttonWidth - 32 ) / 2

	myAttributesLeft = panelLeft + 4
	myAttributesRight = panelRight - 4
	myAttributesTop = panelTop + 162
	myAttributeLabelsLeft = smallRight+4
	myAttributeLabelsRight = width - 12
	
	myEditLeft = panelLeft
	myEditRight = panelRight
	
	y = panelTop
	AddPanel( panelLeft, y, panelRight, y +26, false, false, 1, false, Segment.glow_layer, Segment.panel_layer )
	GUI.SetParent( Segment.panel_layer )
	GUI.CreateObject( "creature_name_parent", panelLeft + 8, y + 4, panelRight - 8, y + 32 )
	GUI.SetParent( Segment.creature_name_parent )
	GUI.CreateText( "creature_name", "", 0,0,0,0, "Fonts/edit.met" )
	GUI.SetParent( Segment.panel_layer )
	GUI.SetColour( Segment.creature_name, 0, .5, 0, 1 )
	y = y +30
	
	--Mode and action buttons
	myModeButtons = Agent.Create( "PropertyEdit", panelLeft, y, panelRight, Agent.Me(), "Mode", {top_round = 1},
		{{ name = "mode", default = constEditMode, button_enum = {{constEditMode, "EditObj", "Edit Tool"},{constAddMode, "AddObj", "Add Tool"}, {constTestMode, "Test", "Test tool"}}},
		{ name = "action", button_enum = {{"undo", "Undo", "Undo last action"},{"redo", "Redo", "Redo last action"}, {"file", "FileObj", "File and system operations"}, {"exit","Exit","Exit the Zook-Kit"}}}} )
	y = Agent.SendMessage( "GetBottom", myModeButtons )
	GUI.SetParent()

	CreateEditPanel( panelLeft+2, y, panelRight+2 )
	myAttributesTop = y+72+17
	CreateAddPanel( panelLeft, y, panelWidth )
	--CreateIKPanel( panelLeft, y, panelWidth )
	CreateTestPanel( panelLeft, y, panelWidth )

	GUI.CreateObject( "attribute_layer",  1, 0, width, height, false )

	--AddPanel( myAttributeLabelsLeft, panelTop, myAttributeLabelsRight, panelTop +26, false, false, false, false, Segment.glow_layer, Segment.panel_layer )
	GUI.SetParent()

	ReflectScale()
	UpdateIKUI()
	SetMode(constEditMode)
	
	LoadGenome(false)
	
	--ToggleGravity
	GUI.Show( Segment.gravity_control, myGravityHidden )
	myGravityHidden = not myGravityHidden
	
	if myAnamorphic then
		SetAnamorphic( 60 )
	else
		SetAspect( 60 )
	end
	
	myToolTips = Agent.Create( "ToolTips" )
	myCachedTextures = {}
	
	-- web server for online activity
	myServer = ""
	
	myPassport = Agent.Create("ZookPassport", nil, 500, 1 )
	UI.SingleFrame.CallOnExit( Agent.Me(), "SystemOnExit" )
	
end

function SystemOnExit()
	if Agent.IsValid(myZookSelector) ~= 1 and not Agent.IsValid( Input.GetFocus() ) then
		SaveChanges("exit")
	end
end

function Finalize()
	Agent.SendMessage( "Destroy", myPreview )
	Agent.SendMessage( "Destroy", myZookSelector )
	Agent.SendMessage("Destroy", myToolTips )
	Agent.SendMessage("Destroy", myPassport )
	if myZookList ~= nil then
		Agent.SendMessage("Destroy", myZookList)
	end
end


function MessageDestroy()
	Agent.Destroy()
end




-- CAMERA AND INPUT ------------------------------------------------------------------------------------------------------------------------------------------------------------


function SystemCamera( frametime )
	
	if Agent.IsValid(myPhotographer) == 1 then
		Agent.SendMessage("SetTargetPosition", myPhotographer, myTargetPosition)
	end

	-- calculate target position with smooth transitions
	mySmoothFrameTime = mySmoothFrameTime * 0.95 + frametime * 0.05
	local pos = myPartPosition
	if myMode == constTestMode then
		pos = Agent.SendMessage( "CreaturePosition", myBuilderParts )
		pos = myCameraSmoothness * myTargetPosition + (1-myCameraSmoothness) * pos	
	else
		if myTransit then
			myTransit = myTransit + mySmoothFrameTime * 8 --(System.RealTime() - myTransitStart)*2
			if myTransit > 1 then
				myTransit = false
				pos = myPartPosition
			else
				local w = ( 1 - Number.cos( myTransit * 180 ) ) / 2
				pos = (1 - w ) * myStartPosition + w * myPartPosition
			end
		end
	end
	myTargetPosition = pos

	-- set SuperCam mode
	if myMode ~=constTestMode then
		myCameraMode = "Edit"
	else
		myCameraMode = myTestCameraMode
	end
	
	-- CALL BASE CLASS
	SuperCam__SystemCamera( frametime )
	
	
	if mySelectedBodyPart  and myMode ~= constTestMode then
		myXConnect, myYConnect = Camera.GetScreenPoint( myConnectPoint )
		GUI.Resize( Segment.connect_point, myXConnect - 8, myYConnect - 8, myXConnect + 8, myYConnect + 8 )
		myXEnd, myYEnd = Camera.GetScreenPoint( myEndPoint )
		GUI.Resize( Segment.end_point, myXEnd - 8, myYEnd - 8, myXEnd + 8, myYEnd + 8 )
	else
		myXConnect, myYConnect = -32, -32
		GUI.Resize( Segment.connect_point, myXConnect - 8, myYConnect - 8, myXConnect + 8, myYConnect + 8 )
		myXEnd, myYEnd = -32, -32
		GUI.Resize( Segment.end_point, myXEnd - 8, myYEnd - 8, myXEnd + 8, myYEnd + 8 )
	end

	local nPoints = getn( myIKPoints )
	for index, value in myIKPoints do
		local x, y = Camera.GetScreenPoint( myIKOrigin + Vector.New(value.x+0, value.y+0, value.z+0 ) )
		GUI.Resize( Segment.GetId( "ik_point"..index ), x - 8, y - 8, x + 8, y + 8 )
	end
end


function SystemKeyDown(key)
	
	-- temp hack to focus issues
	if Agent.IsValid(myZookSelector) == 1 then
		return
	end

	-- CALL BASE CLASS
	SuperCam__SystemKeyDown( key )
	
	local controlDown = Input.IsKeyDown(Input.KEY_LCONTROL) or Input.IsKeyDown(Input.KEY_RCONTROL)
	
	
	--if key == Input.KEY_B and controlDown then
	--	myShowBackground = not myShowBackground
	--	Agent.SendMessage( "Show", myEnvirons, myShowBackground )
	--	MessageShowBackground(myShowBackground)
	--end

	if key == Input.KEY_B and controlDown then
		myShowBackground = not myShowBackground
		Agent.SendMessage("SetVisible", myTarget, myShowBackground)
	end

	if key == Input.KEY_U and controlDown then --and myMode == constTestMode then
		ToggleUI()
	end
	
	if key == Input.KEY_ESCAPE then
		ShowMenu()
	end
	
	--~ if key == Input.KEY_L and controlDown then
		--~ myLetterboxed = not myLetterboxed
		--~ GUI.Show( Segment.letterbox_top, myLetterboxed )
		--~ GUI.Show( Segment.letterbox_bottom, myLetterboxed )
	--~ end

	if key == Input.KEY_S and controlDown then
		Save()
	end


	if key == Input.KEY_Z then
		if myMode == constEditMode and controlDown then
			--undo
			Undo()
		end
	end
	
	if key == Input.KEY_X then
		if myMode == constEditMode and controlDown then
			--cut
			if CopyPart() == 1 then
				DeletePart()
				SelectPart( false, false )
				SetMode(constAddMode)
			end
		end
	end	
	if key == Input.KEY_C then
		if myMode == constEditMode and controlDown then
			--copy
			if CopyPart() == 1 then
				SelectPart( false, false )
				SetMode(constAddMode)
			end
		end
	end	
	if key == Input.KEY_V then
		if myMode == constEditMode and controlDown then
			--paste
			SelectPart( false, false )
			SetMode(constAddMode)
		end
	end
	
			
	if key == Input.KEY_DELETE then
		if getn( myIKPoints ) > 0 and myCurrentIKPoint > 0 then
			DeleteIkPoint()
		elseif myMode == 1 then
			DeletePart()
		end
	end
			
	if key == Input.KEY_SPACE then
		if myMode == constTestMode and not myDoingTrial then
			myPinnedZook = not myPinnedZook
			ExpressCreature(myPinnedZook)
			Agent.SendMessage("MoveTo", myTarget, Vector.New(0, 0, -52))
		end
	end
			
	if key == Input.KEY_F1 then
		if myShowingHelp == false then
			--local packagever = Config.Get("the_package_string","Unknown Package") .. "." .. System.BuildNumber() .. "   " .. System.BuildString()
			local packagever = Config.Get("full_package_string","Unknown Package")
			local screenwidth, screenheight = GUI.Area()
			local lx = 96
			GUI.CreatePicture("help", "help.png", 0, 0, screenwidth, screenheight)
			GUI.CreateText("builder_version1", packagever,  lx, screenheight-15, 100, 20, "Fonts/Edit.met")
			GUI.SetColour(Segment.builder_version1, 1, 1, 1, 1)
			GUI.CreateText("builder_version2", packagever,  lx+2, screenheight-15, 100, 20, "Fonts/Edit.met")
			GUI.SetColour(Segment.builder_version2, 1, 1, 1, 1)
			GUI.CreateText("builder_version3", packagever,  lx, screenheight-13, 100, 20, "Fonts/Edit.met")
			GUI.SetColour(Segment.builder_version3, 1, 1, 1, 1)
			GUI.CreateText("builder_version4", packagever,  lx+2, screenheight-13, 100, 20, "Fonts/Edit.met")
			GUI.SetColour(Segment.builder_version4, 1, 1, 1, 1)
			GUI.CreateText("builder_version5", packagever,  lx+1, screenheight-14, 100, 20, "Fonts/Edit.met")
			GUI.SetColour(Segment.builder_version5, 0, 0, 0, 1)
			myShowingHelp = 1
		else
			Segment.Destroy(Segment.builder_version1)
			Segment.Destroy(Segment.builder_version2)
			Segment.Destroy(Segment.builder_version3)
			Segment.Destroy(Segment.builder_version4)
			Segment.Destroy(Segment.builder_version5)
			Segment.Destroy(Segment.help)
			myShowingHelp = false
		end
	end
end


function SystemMouse(x, y, wheel)
	
	-- temp hack to focus issues
	if Agent.IsValid(myZookSelector) == 1 then
		return
	end
	
	-- CALL BASE CLASS
	SuperCam__SystemMouse(x, y, wheel)
	
	if myRightKeyDown  ==  false then -- if not a SuperCam operation
		if myLeftKeyDown then
			if myIKToolDown then
				IKToolMouseMove()
			else
				if myScalingVector then
					local xAbs, yAbs = Input.MousePosition()
					local sVector = Vector.New( xAbs - myXDown, yAbs - myYDown, 0 )
					local newScale = myScalingStart + ( Vector.Dot(  sVector, myScalingScreen ) * 0.01 ) * myScalingVector
					local x, y, z = Vector.GetXYZ( newScale )
					x = Number.max( Number.min( x, 3 ), 0.1 )
					y = Number.max( Number.min( y, 3 ), 0.1 )
					z = Number.max( Number.min( z, 3 ), 0.1 )
					World.OpenAccess( myWorld )
						Agent.SendMessage( "PartScale", myBuilderParts, mySelectedBodyPart, Vector.New( x, y, z ) )
						SelectPart( mySelectedBodyPart, false )
					World.CloseAccess()
				end
				if myConnectMoving then
					local parentSegment = Agent.SendMessage( "ParentSegment", myBuilderParts, mySelectedBodyPart )
					if parentSegment then
						local xAbs, yAbs = Input.MousePosition()
						local agent, segment, point = Camera.Pick( xAbs, yAbs, myBuilderParts, parentSegment )
						if Equals(  agent, myBuilderParts ) then
							World.OpenAccess( myWorld )
								Agent.SendMessage( "SetPartPosition", agent, mySelectedBodyPart, point )
								SelectPart( mySelectedBodyPart, false )
							World.CloseAccess()
						end
					end
				end
				if myEndMoving then
					local xAbs, yAbs = Input.MousePosition()
					local rayFrom, rayTo = Camera.GetRay( xAbs, yAbs  )
					local intersect = RaySphereIntersect( rayFrom, rayTo, myConnectPoint, Vector.GetLength( myEndPoint - myConnectPoint ) )
					if intersect then
						World.OpenAccess( myWorld )
							Agent.SendMessage( "SetPartRotation", myBuilderParts, mySelectedBodyPart, intersect )
							SelectPart( mySelectedBodyPart, false )
						World.CloseAccess()
					end
				end
			end
		end
	end
end


function SystemUIMouseLUp( segment )
	
	-- temp hack to focus issues
	if Agent.IsValid(myZookSelector) == 1 then
		return
	end
	
	if myIKToolDown == 1 then
		Agent.SendMessage( "SetIKPositions", myBuilderParts, mySelectedBodyPart, myIKPoints )
		Modify( "moved motion point" )
		myIKToolDown = false
	end
	if myEndMoving then
		Modify( "moved end position" )
		SelectPart( mySelectedBodyPart, myAutoCentre )
	end
	if myConnectMoving then
		Modify( "moved connect position" )
		SelectPart( mySelectedBodyPart, myAutoCentre )
	end
	if myScalingVector then
		Modify( "scaled part" )
		SelectPart( mySelectedBodyPart, myAutoCentre )
	end
	myLeftKeyDown = false
	myNewBodyPart = false
	myConnectMoving = false
	myEndMoving = false
	myScalingVector = false
end


function SystemUIMouseLDown(segment)
	
	-- temp hack to focus issues
	if Agent.IsValid(myZookSelector) == 1 then
		return
	end
	
	if segment  == Segment.click_layer then
		CameraMouseDown()
	end
end


function CameraMouseDown()
	myLeftKeyDown = 1
	myXDown, myYDown = Input.MousePosition() 

	World.OpenAccess( myWorld )

		if myMode == constAddMode then
			local agent, segment, point = Camera.Pick( myXDown, myYDown )
			if Equals(  agent, myBuilderParts ) then
				myParentBodyPart = Agent.SendMessage( "PartFromSegment", agent, segment )
				if myParentBodyPart then
					local table = Agent.SendMessage( "PartTable", myPreview, 0 )
					if table ~= nil then
						-- add mody part
						myNewBodyPart = Agent.SendMessage( "ClonePart", agent, table, myParentBodyPart )
						Agent.SendMessage( "SetPartPosition", agent, myNewBodyPart, point )
						Agent.SendMessage("RecordCreatedPart", agent, myNewBodyPart)
						SetMode(constEditMode)
						SelectPart( myNewBodyPart, not myAutoCentre )
						if myAutoCentre then
							myConnectMoving = 1
						end
						World.CloseAccess()
						return

						Modify( "added new part" )
					end
				end
			end
		end
		if myMode == constEditMode and not IKToolMouseDown() then
			Agent.SendMessage( "Show", myGrids, false )
			SelectTool()
			Agent.SendMessage( "Show", myGrids, 1 )
		end
		if myMode == constTestMode and not myDoingTrial then
			local agent, segment, point = Camera.Pick( Input.MousePosition() )
			local zook = Agent.SendMessage( "GetExpressedCreature", myBuilderParts)
			if Agent.IsValid( agent ) then
				if Equals( agent, zook ) then
					myPinnedZook = not myPinnedZook
					ExpressCreature(myPinnedZook)
					Agent.SendMessage("MoveTo", myTarget, Vector.New(0, 0, -52))
				else
					Agent.SendMessage("MoveTo", myTarget, point)
				end
				--Agent.SendMessage( "Shoot", agent,  segment, point, point - myCameraPosition )
			end
		end

	World.CloseAccess()
end


function IKToolMouseDown()
	--See if the click is near an IK point
	if myTab ~= "motion" or myMode ~= constEditMode then
		return false
	end
	
	myCurrentIKPoint = 0
	Agent.SendMessage( "EnableButton", myEditButtons, "edit", "delete_ik", false )
	local minDist2 = 10000000
	local nearest = false
	for index, value in myIKPoints do
		local x, y = Camera.GetScreenPoint( myIKOrigin + Vector.New(value.x+0, value.y+0, value.z+0 ) )
		local dist2 = (x - myXDown ) * (x - myXDown ) + (y - myYDown) * (y - myYDown)
		if dist2 < minDist2 then
			minDist2 = dist2
			nearest = index
			myIKOffX = myXDown - x
			myIKOffY = myYDown - y
		end
	end
	if minDist2 < 8 * 8 then
		myCurrentIKPoint = nearest
		myIKToolDown = 1
	else
		local minDist = 10000000
		for index, value in myIKPoints do
			local next = index + 1
			if index == getn( myIKPoints ) then
				next = 1
			end
			local x1, y1 = Camera.GetScreenPoint( myIKOrigin + Vector.New(value.x+0, value.y+0, value.z+0 ) )
			local x2, y2 = Camera.GetScreenPoint( myIKOrigin + Vector.New(myIKPoints[next].x+0, myIKPoints[next].y+0, myIKPoints[next].z+0 ) )
			local dist = PointToLineSegmentDistance(x1, y1, x2, y2, myXDown, myYDown)
			if dist < minDist then
				minDist = dist
				nearest = index
			end
		end
		if minDist < 8 then
			myCurrentIKPoint = nearest
			local rayFrom, rayTo = Camera.GetRay( myXDown, myYDown  )
			local newPoint
			if myIKMode == 1 then
				newPoint = RaySphereIntersect( rayFrom, rayTo, myIKOrigin, myIKRadius ) - myIKOrigin
			elseif myIKMode == 2 then
				newPoint = RayPlaneIntersect( rayFrom, rayTo, myIKOrigin, Vector.New( 1, 0, 0 ) ) - myIKOrigin
			end
	
			if getn( myIKPoints ) < 128 then
				for i = getn( myIKPoints ), myCurrentIKPoint+1, -1 do 
					myIKPoints[i+1] = Clone( myIKPoints[i] )
				end
				myCurrentIKPoint = myCurrentIKPoint + 1
				myIKPoints[myCurrentIKPoint] = {}
				myIKPoints[myCurrentIKPoint].element_type = "point"
				myIKPoints[myCurrentIKPoint].x = Vector.GetX( newPoint )
				myIKPoints[myCurrentIKPoint].y = Vector.GetY( newPoint )
				myIKPoints[myCurrentIKPoint].z = Vector.GetZ( newPoint )
				myIKPoints[myCurrentIKPoint].children = {}
				Agent.SendMessage( "SetIKPositions", myBuilderParts, mySelectedBodyPart, myIKPoints )
				Modify( "added motion target" )
			end
			myIKToolDown = 1
			myIKOffX = 0
			myIKOffY = 0
		else
			myIKOffX = 0
			myIKOffY = 0
			return false
		end
	end
	UpdateIKUI()
	return 1
end


function IKToolMouseMove()
	if myCurrentIKPoint > 0 then
		local xAbs, yAbs = Input.MousePosition()
		local rayFrom, rayTo = Camera.GetRay( xAbs - myIKOffX, yAbs -  myIKOffY )
		local newPoint
		if myIKMode == 1 then
			newPoint = RaySphereIntersect( rayFrom, rayTo, myIKOrigin, myIKRadius ) - myIKOrigin
		elseif myIKMode == 2 then
			newPoint = RayPlaneIntersect( rayFrom, rayTo, myIKOrigin, Vector.New( 1, 0, 0 ) ) - myIKOrigin
		end
		
		if myIKMode ~= 0 then
			myIKPoints[myCurrentIKPoint].x = Vector.GetX( newPoint )
			myIKPoints[myCurrentIKPoint].y = Vector.GetY( newPoint )
			myIKPoints[myCurrentIKPoint].z = Vector.GetZ( newPoint )
		end
		UpdateIKUI()
	end
end


function SelectTool()
	if mySelectedBodyPart and Number.sqrt( (myXDown - myXEnd) * (myXDown - myXEnd) + (myYDown - myYEnd) * (myYDown - myYEnd) ) < 8 then
		myEndMoving = 1
	else
		if mySelectedBodyPart and Number.sqrt( (myXDown - myXConnect) * (myXDown - myXConnect) + (myYDown - myYConnect) * (myYDown - myYConnect) ) < 8 then
			myConnectMoving = 1
		else
			local agent, segment, point = Camera.Pick( Input.MousePosition() )
			if Equals(  agent, myBuilderParts ) then
				if segment == Agent.SendMessage( "SelectorSegment", agent ) then
					myScalingVector, myScalingAbs = Agent.SendMessage( "ScalingVector", agent, point )
					myScalingPoint = point
					myScalingStart = Agent.SendMessage( "GetPartScale", agent, mySelectedBodyPart )
					local x1, y1 = Camera.GetScreenPoint( point )
					local x2, y2 = Camera.GetScreenPoint( point + myScalingAbs )
					myScalingScreen = Vector.Normalise( Vector.New( x2 - x1, y2 - y1, 0 ) )
					if Vector.Dot( Vector.New( -1, -1, -1 ), myScalingVector ) > 0 then
						myScalingVector = Vector.New( 0, 0, 0 ) - myScalingVector
					end
				else
					SelectPart( Agent.SendMessage( "PartFromSegment", agent, segment ), 1 )
				end
			else
				SelectPart( false, 1 )
			end
		end
	end
end




--- GENERAL UI -------------------------------------------------------------------------------------------------------------------------------------------------------


function ToggleUI()
	GUI.Show( Segment.glow_layer, myUIHidden )
	GUI.Show( Segment.panel_layer, myUIHidden )
	GUI.Show( Segment.test_glow_layer, myUIHidden )
	GUI.Show( Segment.test_layer, myUIHidden )
	Agent.SendMessage( "Show", myModeButtons, myUIHidden )
	Agent.SendMessage( "Show", myEditButtons, myUIHidden )
	myUIHidden = not myUIHidden
end


function SystemUIChange( segment )

	-- temp hack to focus issues
	if Agent.IsValid(myZookSelector) == 1 then
		return
	end
	
	if segment == Segment.photo_button  and not myDoingTrial then
		--Photographer()
		SimplePhotographer()
	elseif segment == Segment.start_button and not myDoingTrial then
		World.OpenAccess(myWorld)
		myStopWatchStart = World.SimTime() - myStopWatchElaspedTime
		World.CloseAccess()
		Agent.SetTimer("StopWatch", Agent.Me(), "stopwatch", 0.1)
	elseif segment == Segment.stop_button and not myDoingTrial then
		Agent.StopTimer(Agent.Me(), "stopwatch")
	elseif segment == Segment.reset_button and not myDoingTrial then
		World.OpenAccess(myWorld)
		myStopWatchStart = World.SimTime()
		World.CloseAccess()
		myStopWatchElaspedTime = 0
		TimerStopWatch()
	end
	
	-- turn off target whilst editing

	World.OpenAccess(myWorld)
	

		if segment == Segment.camera_combo then
			myTestCameraMode =GUI.GetText( segment )
		end
		if segment == Segment.environment_combo then
			GUI.SetText( Segment.trial_combo, "" )
			Agent.SendMessage( "Destroy", myEnvirons )
			myDoingTrial = false
			local land = GUI.GetText( segment )
			myEnvirons = Agent.Create(land, nil, floorSizeX, floorSizeZ, Quatn.New())
			ExpressCreature(myPinnedZook)
			Agent.SendMessage("MoveTo", myTarget, Vector.New(0, 0, -52))
		end
		if segment == Segment.trial_combo then
			Agent.SendMessage("MoveTo", myTarget, Vector.New(0, 0, -52))
			GUI.SetText( Segment.environment_combo, "" )
			Agent.SendMessage( "Destroy", myEnvirons )
			local trialAgents = {Sprint = "SprintEnv", BlockPush="BlockPush", Hurdles="Hurdles", HighJump="HighJump", Lap="Lap" }
			local land = trialAgents[GUI.GetText( segment )]
			--local land = GUI.GetText( segment )
			myEnvirons = Agent.Create(land, nil, floorSizeX, floorSizeZ, Quatn.New())
			local startPos = Agent.SendMessage( "StartPosition", myEnvirons )
			if startPos == nil then startPos = Vector.New( 0,0,0 ) end
			local countdown = Agent.SendMessage( "Countdown", myEnvirons )
			myPinnedZook = false
			ExpressCreaturePos(myPinnedZook, startPos, countdown ~= nil )
			if myCountdown ~= nil then
				Agent.SendMessage( "Destroy", myCountdown )
				myCountdown = nil
			end
				
			if countdown ~= nil then
				myCountdown = Agent.Create( "Countdown", Agent.Me() )
			else
				Agent.SendMessage( "Go", myEnvirons )
				TriggerStopWatchEvent()
			end
			myDoingTrial = 1
		end
		if segment == Segment.gravity_slider then
			local g = GUI.GetValue( segment ) * (myGravityMax - myGravityMin ) + myGravityMin
			Agent.SendMessage( "SetGravity", myBuilderParts,  g )
			GUI.SetHelpText( Segment.gravity_slider, String.format( "Gravity %.1f", g ) )
		end
		if mySelectedBodyPart then
			local modified  = false
		end
	World.CloseAccess()
end

function MessageCountFinished()
	myCountdown = nil
	Agent.SendMessage( "StartCreature", myBuilderParts )
	Agent.SendMessage( "Go", myEnvirons )
	TriggerStopWatchEvent()
end



-- MODE -------------------------------------------------------------------------------------------------------------------------------------------------------------------


function MessageModeNotify(name, value)
	if name == "mode" then
		SetMode( value )
	elseif name == "action" then
		if value == "undo" then
			Undo()
		elseif value == "redo" then
			Redo()
		elseif value == "file" then
			ShowMenu()
		elseif value == "exit" then
			SaveChanges("exit")
		end
	end
end


function MessageModeGet(name)
	if name == "mode" then
		return myMode
	end
end


function SetMode( mode )
	
	if myMode == mode then
		return
	end
	
	if myDoingTrial then
		myDoingTrial = false
		World.OpenAccess(myWorld)
			Agent.SendMessage( "Destroy", myEnvirons )
			myEnvirons = Agent.Create("BoxEnv", nil, floorSizeX, floorSizeZ, Quatn.New())
		World.CloseAccess()
	end
	
	Agent.SendMessage( "Show", myEditButtons, false )

	if myMode == constTestMode and mode ~= constTestMode then
		myAngle =myLastEditAngle
		myDistance = myLastEditDistance
		myYaw = myLastEditYaw
	elseif myMode ~= constTestMode and mode == constTestMode then
		myLastEditAngle = myAngle
		myLastEditDistance = myDistance
		myLastEditYaw = myYaw
	end

	Agent.SendMessage( "Show", myPreview, false )
	GUI.Show( Segment.add_glow_layer, false )
	GUI.Show( Segment.add_layer, false )
	GUI.Show( Segment.test_glow_layer, false )
	GUI.Show( Segment.test_layer, false )

	myMode = mode
	if myMode == constEditMode then
		Agent.SendMessage( "SetGenomeVisibility", myBuilderParts, 1 )
		Agent.SendMessage( "Show", myEditButtons, 1 )

		UpdateAttributes()
		SelectPart( mySelectedBodyPart, false )
	end
	if myMode == constTestMode then
		GUI.Show( Segment.test_glow_layer, 1 )
		GUI.Show( Segment.test_layer, 1 )
		myPinnedZook = false
		ExpressCreature(myPinnedZook)
		Agent.SendMessage("MoveTo", myTarget, Vector.New(0, 0, -52))
	end
	if myMode == constAddMode then
		Agent.SendMessage( "Show", myPreview, 1 )
		GUI.Show( Segment.add_glow_layer, 1 )
		GUI.Show( Segment.add_layer, 1 )

		Agent.SendMessage( "SetGenomeVisibility", myBuilderParts, 1 )
		SelectPart( false, false )
	end
	Agent.SendMessage( "UpdateAll", myModeButtons )
	UpdateIKUI()
	UpdateAttributes()
	ReflectScale()
end


function CreateEditPanel( left, top, right )
	myEditButtons = Agent.Create( "PropertyEdit", left, top, right, Agent.Me(), "Edit", {},
		{{ name = "edit", default = -1, button_enum = {{"copy", "CloneObj", "Copy body part"},
		 {"mirror", "FlipObj", "Mirror body part"}, {"delete_ik", "DeletePoint", "Remove IK point"},
		 {"delete", "DeleteObj", "Delete body part"}}}})
	myEditTop = top + Agent.SendMessage( "Height", myEditButtons )
	GUI.SetParent()
end




-- EDIT -------------------------------------------------------------------------------------------------------------------------------------------------------


function  MessageEditNotify( name, value )
	if value == "copy" then
		if CopyPart() == 1 then
			SelectPart( false, false )
			SetMode(constAddMode)
		end
	elseif value == "mirror" then
		local result = Agent.SendMessage( "MirrorPart", myBuilderParts, mySelectedBodyPart )
		if result == 1 then
			Agent.Create( "Alert", "Cannot mirror root part", 1, nil, nil )
			return
		elseif result == 2 then
			Agent.Create( "Alert", "Part already mirrored", 1, nil, nil )
			return
		else
			Modify( "mirrored part" )
		end
	elseif value == "delete_ik" then
		DeleteIkPoint()
	elseif value == "delete" then
		DeletePart()
	end
end


function RayPlaneIntersect(rayFrom, rayTo, point, normal )
	local s = Vector.Dot( normal, rayFrom )
	local e = Vector.Dot( normal, rayTo )
	local c = Vector.Dot( normal, point )
	return rayFrom + ( ( c - s ) / ( e - s ) ) * ( rayTo - rayFrom )
end


function PointToLineSegmentDistance( aX, aY, bX, bY, x, y )
	
	--     (Cx-Ax)(Bx-Ax) + (Cy-Ay)(By-Ay)
	--r = -------------------------------
	--                  L^2
	local r = ( (x-aX)*(bX-aX) + (y-aY)*(bY-aY) ) / ( (bX-aX)*(bX-aX) + (bY-aY)*(bY-aY) )
	local nX, nY
	if r < 0 then
		nX = aX
		nY = aY
	elseif r > 1 then
		nX = bX
		nY = bY
	else
		nX = aX + r * (bX - aX)
		nY = aY + r * (bY - aY)
	end
	return Number.sqrt( (x-nX)*(x-nX) + (y-nY)*(y-nY) )
end


function SelectPart( newPart, moveCamera )
	if not Agent.SendMessage( "PartExists", myBuilderParts, newPart ) then
		newPart = false
	end
	local changeControls = newPart ~= mySelectedBodyPart
	mySelectedBodyPart = newPart
	Agent.SendMessage( "SetSelected",  myBuilderParts, mySelectedBodyPart )
	if mySelectedBodyPart then
		if moveCamera then
			if not myTransit then
				myStartPosition = myPartPosition
				myTransitStart = System.RealTime() 
				myTransit = 0
			end
			myPartPosition = Agent.SendMessage( "PartPosition",  myBuilderParts, mySelectedBodyPart )
		end
		myConnectPoint = Agent.SendMessage( "PartConnect",  myBuilderParts, mySelectedBodyPart )
		myEndPoint = Agent.SendMessage( "PartEnd",  myBuilderParts, mySelectedBodyPart )
	end
	if changeControls then
		UpdateAttributes()
	end
	local enable = false
	if mySelectedBodyPart then
		if not Agent.SendMessage( "PartIsRoot",myBuilderParts, mySelectedBodyPart ) then
			enable = 1
		end
	end

	Agent.SendMessage( "EnableButton", myEditButtons, "edit", "copy", enable )
	Agent.SendMessage( "EnableButton", myEditButtons, "edit", "mirror", enable )
	Agent.SendMessage( "EnableButton", myEditButtons, "edit", "delete", enable )
	ReflectScale()
	UpdateIKUI()
end


function CopyPart()
	if mySelectedBodyPart then
		if Agent.SendMessage( "PartIsRoot",myBuilderParts, mySelectedBodyPart ) then
			Agent.Create( "Alert", "Cannot copy root part", 1, nil, nil )
		else
			local table = Agent.SendMessage( "PartTable",myBuilderParts, mySelectedBodyPart )
			if table.leg_type == "2" then
				table.leg_type = nil
			end
			Agent.SendMessage( "ClonePart", myPreview, table, 0 )
			return 1
		end
	end
	return 0
end


function DeletePart()
	if mySelectedBodyPart then
		if Agent.SendMessage( "PartIsRoot",myBuilderParts, mySelectedBodyPart ) then
			Agent.Create( "Alert", "Cannot delete root part", 1, nil, nil )
		else
			Agent.SendMessage( "DeletePart", myBuilderParts, mySelectedBodyPart )
			SelectPart( false, false )
			Modify( "deleted part" )
		end	
	end
end




--- PROPERTY EDIT --------------------------------------------------------------------------------------------------------------------------------------------------------


function MessagePropertyEditGet( name )
	return GetAttribute( name )
end


function MessagePropertyEditNotify( name, value )
	Agent.SendMessage( "SetAttribute", myBuilderParts, mySelectedBodyPart, name, value )
	Modify( "set part"..name)
	SelectPart( mySelectedBodyPart, myAutoCentre )
	--ReflectScale()
end


function MessagePropertyEditNotifySlide( name, value )
	Agent.SendMessage( "SetAttribute", myBuilderParts, mySelectedBodyPart, name, value )
	SelectPart( mySelectedBodyPart, false )
end


function MessagePropertyEditTabChange( tab )
	myTab = tab
	SetIKMode()
end


function GetAttribute(name)
	local n = name
	local attr = Agent.SendMessage( "Attribute", myBuilderParts, mySelectedBodyPart, name) 
	return attr
end


function UpdateAttributes()
	local typeSelected = constNoneSelected
	if mySelectedBodyPart and myMode == constEditMode then
		if Agent.SendMessage( "PartIsRoot", myBuilderParts, mySelectedBodyPart ) then
			typeSelected = constRootSelected
		else
			typeSelected = constPartSelected
		end
	end
	
	if typeSelected ~= myTypeSelected then
		if myPropertyEdit ~= nil then
			Agent.SendMessage( "Destroy", myPropertyEdit )
			myPropertyEdit = nil
		end
		if mySelectedBodyPart and myMode == constEditMode then
			myAttributeGroups = Agent.SendMessage( "PartAttributes", myBuilderParts,  mySelectedBodyPart)
			local index = 0
			local properties = {}
			local panes = {"shape", "motion", "colour" }
			for iAttributeGroup, attributeGroup in myAttributeGroups do
				for iAttribute, attribute in attributeGroup.attributes do
					index = index + 1
					if attribute.name == "texture" then
						attribute.path = theTeams..myTeam.."/Textures"
					end
					properties[index] =attribute
					properties[index].tab = panes[ attributeGroup.pane ]
				end
			end
			World.CloseAccess()
			local panelWidth = 148
			local panelLeft, panelRight, panelTop, smallWidth, smallRight = SetScreenAndPanelSize(panelWidth, myAnamorphic, myLetterboxed)
			myPropertyEdit = Agent.Create( "PropertyEdit", panelLeft+2, myEditTop, panelRight+2,
				Agent.Me(), "PropertyEdit", {no_labels = 1, initalize_all= false}, properties )
			Agent.SendMessage( "ShowTab", myPropertyEdit, myTab )
		end
		myTypeSelected = typeSelected
	end
	if mySelectedBodyPart and myMode == constEditMode then
		Agent.SendMessage( "EnableButton", myPropertyEdit, "leg_type", "Ik1",
			Agent.SendMessage( "CanBeIK1", myBuilderParts, mySelectedBodyPart ) )
		Agent.SendMessage( "EnableButton", myPropertyEdit, "leg_type", "Ik2",
			Agent.SendMessage( "CanBeIK2", myBuilderParts, mySelectedBodyPart ) )
	end
	
end


function CacheTextures()
	DestroySegments( myCachedTextures )
	myTextureButtons = {}

	local texturePath = theTeams..myTeam.."/Textures"
	local files = System.GetDirectoryContents( texturePath,  "*.bmp", 1)
	GUI.SetParent()
	for index, value in files do
		local segment = GUI.CreatePicture( "texture_picture"..index, texturePath.."/"..value, 0, 0, 1, 1 )
		GUI.Show( segment, false )
		myCachedTextures[ segment ] = 1
	end
end


function DestroySegments( table )
	for index, value in table do
		Segment.Destroy( index )
	end
end




-- ADD -----------------------------------------------------------------------------------------------------------------------------------------------------


function CreateAddPanel( left, top, width )
	AddPanel( left, top, left + width, top + 32 + width  + 32, false, false, false, false, Segment.add_glow_layer, Segment.add_layer )
	AddPanel( left+8, top + 64+8,  left+width-8, top + 64 + width-8, false, false, false, false, Segment.add_layer, Segment.add_layer )
	myPreview = Agent.Create( "BuilderPreview", left+16, top + 64+16,  left+width-16, top + 64 + width-16,
		left + 4, top + 32, left+width )
	Agent.SendMessage( "Show", myPreview, false )
end





-- TEST ---------------------------------------------------------------------------------------------------------------------------------------------------


function CreateTestPanel( left, top, width )
	AddPanel( left, top, left + width, top+ 32 + 5 *  32 + 8, false, false, false, false, Segment.test_glow_layer, Segment.test_layer )
	local y = top + 32 
	
	GUI.SetParent( Segment.test_layer )
	local buttonWidth = width/5
	AddButton( "start_button", myAttributesLeft , y, "StartTimer", "Start timer" )
	AddButton( "stop_button", myAttributesLeft  + buttonWidth , y, "StopTimer", "Stop timer" )
	AddButton( "reset_button", myAttributesLeft + (buttonWidth * 2), y, "ResetTimer", "Reset timer" )
	GUI.CreateText( "time", "", myAttributesLeft  + (buttonWidth * 3), y+8, myAttributesRight - 8, y + 32, "Fonts/Edit.met" )
	GUI.SetText( Segment.time, String.format( "%4.1f", 0 ) )
	y = y + 32 + 8
	AddButton( "photo_button", myAttributesLeft , y, "CameraStill", "Take Passport Photo" )
	
	y = y + 32 + 8
	AddPanel( myAttributesLeft, y, myAttributesRight, y +26, 1, false, false, false, Segment.test_layer, Segment.test_layer )
	GUI.SetParent( Segment.test_layer )
	GUI.CreateCombo( "environment_combo", "BoxEnv",myAttributesLeft + 8, y+3, myAttributesRight - 32, y+23, "Fonts/Edit.met" )
	GUI.SetListText(  Segment.environment_combo, {"BoxEnv", "RamEnv", "StrongEnv", "ZigZagEnv", "SlopeEnv", "SloppyEnv", "StepEnv", "ShiftEnv", "HurdleEnv" } )
	GUI.SetText(  Segment.environment_combo, "Box" )
	GUI.CreatePicture( "environment_icon", "Environment.png", myAttributesRight - 32, y - 4, myAttributesRight, y + 32 - 4)
	y = y + 32

	AddPanel( myAttributesLeft, y, myAttributesRight, y +26, 1, false, false, false, Segment.test_layer, Segment.test_layer )
	GUI.SetParent( Segment.test_layer )
	GUI.CreateCombo( "trial_combo", "BoxEnv",myAttributesLeft + 8, y+3, myAttributesRight - 32, y+23, "Fonts/Edit.met" )
	GUI.SetListText(  Segment.trial_combo, {"Sprint", "BlockPush", "Hurdles", "HighJump", "Lap" } )
	GUI.SetText(  Segment.trial_combo, "" )
	GUI.CreatePicture( "trial_icon", "Trials.png", myAttributesRight - 32, y - 4, myAttributesRight, y + 32 - 4)
	y = y + 32


	AddPanel( myAttributesLeft, y, myAttributesRight, y +26, false, false, 1, false, Segment.test_layer, Segment.test_layer )
	GUI.SetParent( Segment.test_layer )
	GUI.CreateCombo( "camera_combo", "Free",myAttributesLeft + 8, y+3, myAttributesRight - 32, y+23, "Fonts/Edit.met" )
	GUI.SetListText(  Segment.camera_combo, {"Follow", "Cool", "Free" } )
	GUI.SetText(  Segment.camera_combo, "Follow" )
	GUI.CreatePicture( "camera_icon", "Camera.png", myAttributesRight - 32, y - 4, myAttributesRight, y + 32 - 4)
	
	
	y = y + 36
	local screenWidth, screenHeight = GUI.Area()
	GUI.CreateObject( "gravity_control", 1, 0, screenWidth, screenHeight, false )
	GUI.SetParent( Segment.gravity_control )
	AddPanel( left, y, left + width, y + 40, false, false, false, false, Segment.gravity_control, Segment.gravity_control )
	y = y + 6
	--AddPanel( myAttributesLeft, y, myAttributesRight, y +26, 1, false, false, false, Segment.gravity_control, Segment.gravity_control )
	--AddPanel( myAttributesRight, y+5, myAttributeLabelsLeft, y + 21, false, false, false, false, Segment.gravity_control, Segment.gravity_control  )
	--AddPanel( myAttributeLabelsLeft, y, myAttributeLabelsRight, y +26, false, 1, false, false, Segment.gravity_control, Segment.gravity_control  )

	GUI.SetParent( Segment.gravity_control )
	GUI.CreatePicture( "gravity_icon", "./UI/Buttons/UI_Gravity_Up.png", 
		myAttributesRight - 32, y - 4, myAttributesRight, y + 32 - 4)
	--GUI.CreateText( "gravity_label", "Gravity", myAttributeLabelsLeft+8, y+4, 10, y, "Fonts/Edit.met" )
	--GUI.SetColour( Segment.gravity_label, 0, 0, 0, 1 )
	GUI.CreateSlider( "gravity_slider", myAttributesLeft+4, y+6, myAttributesRight - 32, y + 22 )
	local g = Agent.SendMessage( "Gravity", myBuilderParts )
	--GUI.CreateTextEdit( "gravity_text", "",  myAttributeLabelsRight - 48, y+3, myAttributeLabelsRight - 8, y + 23, "Fonts/Edit.met" )
	--GUI.SetText( Segment.gravity_text, String.format( "%.1f", g ) )
	GUI.SetValue( Segment.gravity_slider, ( g - myGravityMin ) / (myGravityMax - myGravityMin ) )
	GUI.SetHelpText( Segment.gravity_slider, String.format( "Gravity %.1f", g ) )

	GUI.SetParent()

end


function ExpressCreature(fixed)
	ExpressCreaturePos( fixed, Vector.New( 0,0,0 ), false )
end

function ExpressCreaturePos(fixed, position, dontStart)
	Agent.SendMessage( "SetGenomeVisibility", myBuilderParts, false )
	Agent.SendMessage( "Express", myBuilderParts, fixed, position, dontStart )
	Agent.SendMessage( "SetSelected",  myBuilderParts, false )

	-- set target for newly expressed creature
	Agent.SendMessage("SetCreatureTarget", myBuilderParts, myTarget)
	--Agent.SendMessage("SetMoveKey", myTarget, "KEY_MOUSE0")

	local minx, miny, minz, maxx, maxy, maxz = Agent.SendMessage( "BoundingBox", myBuilderParts )

	TriggerStopWatchEvent()
end


function AddButton( name, x, y, iconRoot, helpText )
	iconRoot = "UI\\Buttons\\UI_"..iconRoot
	--GUI.CreateButtonEx( name, x, y, x + 32, y + 32, iconRoot.."_Up", iconRoot.."_Dn", iconRoot.."_Ov" )
	GUI.CreateButtonEx( name, x, y, x + 32, y + 32, iconRoot.."_Up.png", iconRoot.."_Ov.png", iconRoot.."_Dn.png" )
	GUI.SetHelpText( Segment.GetId( name ), helpText )
end


function TimerStopWatch()
	World.OpenAccess( myWorld )
	myStopWatchElaspedTime = World.SimTime()-myStopWatchStart
	World.CloseAccess()
	GUI.SetText( Segment.time, String.format( "%4.1f", myStopWatchElaspedTime) )	
	GUI.SetColour( Segment.time, 0, 0, 0, 1 )
end	


function TriggerStopWatchEvent()

	Agent.StopTimer(Agent.Me(), "stopwatch")
	World.OpenAccess( myWorld )
	myStopWatchStart = World.SimTime()
	World.CloseAccess()
	myStopWatchElaspedTime = 0
	TimerStopWatch()
	
	local creature = Agent.SendMessage("GetExpressedCreature", myBuilderParts)
	Agent.SendMessage("ReportEvent", myEnvirons, creature, "StopWatch")
	Agent.SetTimer("StopWatch", Agent.Me(), "stopwatch", 0.1)
	
	
end
	

function MessageStopWatch()
	Agent.StopTimer(Agent.Me(), "stopwatch")
	return myStopWatchElaspedTime
end

function SimplePhotographer()
	if myAllowSave == false then
		Agent.Create("Alert", {"You can not take photographs of example","Zooks."}, nil, nil, nil)
		return
	end
	local image = Agent.SendMessage("GetPassportImage", myBuilderParts)
	Agent.Create( "SimplePhotographer", myWorld, Camera.GetTransform(), image, Agent.Me() )
end

function MessageSimplePhotographer( image )
	Agent.SendMessage("SetPassportImage", myBuilderParts, image)
	Modify( "Took photo", 1 )
end

function Photographer()
	if myAllowSave == false then
		Agent.Create("Alert", "You can not take photographs of example Zooks.", nil, nil, nil)
		return
	end
	local photo_path = Config.Get("product", "BAMZOOKi") .. "/Teams/"..myTeam.."/Creatures/"..myCreature.."/".."PhotoAlbum"
	local full_path = System.CreateHomeDirectory(photo_path)
	local passport_pick_image_file = "passport_image.bmi"
	local image = Agent.SendMessage("GetPassportImage", myBuilderParts)
	if System.IsValidPath(full_path.."/"..passport_pick_image_file) == false and image ~= nil then
		if image ~= nil and image.image ~= nil then
			System.WriteArchiveTable(full_path.."/"..passport_pick_image_file, "", "Image Version 1.0", image )
		end
	elseif System.IsValidPath(full_path.."/"..passport_pick_image_file) == 1 and image == nil then
		System.DeleteFile(full_path.."/"..passport_pick_image_file)
	end
	local noAlbumPictures = 1
	myPhotographer = Agent.Create("Photographer", myWorld, Agent.Me(), "Photographer", myCameraPosition, myTargetPosition, 256, 
		myCameraMode, full_path, passport_pick_image_file, "Passport", noAlbumPictures, myAnamorphic, myLetterboxed)
	
end


function MessagePhotographer(path, pick_image_file, cameraPosition, targetPosition, angle, yaw, distance, cameraMode)
	myCameraPosition = cameraPosition
	myTargetPosition = targetPosition
	myAngle =  angle
	myYaw = yaw
	myDistance =  distance
	myTestCameraMode = cameraMode -- need to update gui so corrent camera is displayed
	if System.IsValidPath(path.."/"..pick_image_file) then
		-- set ass passport photo
		local image = System.ReadArchiveTable(path.."/"..pick_image_file, "")
		--System.DeleteFile(path.."/"..pick_image_file)
		Agent.SendMessage("SetPassportImage", myBuilderParts, image)
	end
end




-- FILE MENU ------------------------------------------------------------------------------------------------------------------------------------------------------------------


function ShowMenu()
	if myMenuShowing == nil then
		local options = { "New", "Open", "Save", "Save As", "Export", "Send to CBBC", "Passport", "Website", "Online Update", "Exit", "Cancel" }
		Agent.Create("Options", options, 100, Agent.Me(), "FileOption" )
		myMenuShowing = 1
	end
end


function SaveChanges(mode)
	mySaveChangesMode = mode
	if myModified and myAllowSave ~= false then
		Agent.Create("YesNoCancel", "Save changes?", Agent.Me(), "SaveChanges")
	else 
		MessageSaveChanges(false)
	end
end	


function MessageFileOption(option)
	myMenuShowing = nil
	if option == 1 then
		-- new creature
		SaveChanges("new")
	elseif option == 2 then
		-- open creature
		SaveChanges("open")
	elseif option ==  3 then 
		-- save
		Save()
	elseif option == 4  then
		-- save as
		if myAllowSave ~= false then
			Agent.Create("TextEntry", Agent.Me(), "Save as Zook name:", "", "TextEntrySaveAs", 1 )
		else
			Agent.Create("Alert", "This Zook is read-only.", nil, nil, nil)
		end
	elseif option == 5 then
		-- export
		if myAllowSave ~= false then
			if String.strlen(myCreature) > 25 then
				Agent.Create("Alert", {"Zook names cannot contain more than", "25 characters.","Save your zook with a shorter name", "using 'Save As' then try again." }, nil, nil, nil)
				return
			end
			local image = Agent.SendMessage("GetPassportImage", myBuilderParts)
			if image == nil then
				Agent.Create("Alert", "Take a passport picture before exporting.", nil, nil, nil)
				return
			end
			UserAuthentification(Export)
		else
			Agent.Create("Alert", "This Zook is read-only.", nil, nil, nil)
		end
	elseif option == 6 then
		if myAllowSave == false then
			Agent.Create("Alert", "This Zook can not be uploaded.", nil, nil, nil)
			return
		end
		if String.strlen(myCreature) > 25 then
			Agent.Create("Alert", {"Zook names cannot contain more than", "25 characters.","Save your zook with a shorter name", "using 'Save As' then try again." }, nil, nil, nil)
			return
		end
		local image = Agent.SendMessage("GetPassportImage", myBuilderParts)
		if image == nil then
			Agent.Create("Alert", "Take a passport picture before uploading.", nil, nil, nil)
			return
		end
		UserAuthentification(Upload)
	elseif option == 7 then
		ShowPassport()
	elseif option == 8 then
		ConfigureWeb()
		myWebFunctionCall = Browser
	elseif option == 9 then
		myConfigureWebOptions = { update = 1 }
		ConfigureWeb()
	elseif option == 10 then
		-- exit
		SaveChanges("exit")
	end
	
end


function MessageNewCreature( team, sender )
	if Agent.IsValid(myZookSelector) then
		myLastZookSelectorTab = Agent.SendMessage("GetTab", myZookSelector)
	end
	myNewCreatureTeam  = team
	myNewCreatureRequester = sender
	Agent.Create( "TextEntry", Agent.Me(), "New Zook name", "", "TextEntryNewCreature", 1 )
end


function MessageTextEntryNewCreature(text)
	text = FixFileName( text )
	local teams = Config.Get("default_teams_directory", "") 
	Config.Set("current_teams_directory", teams) 
	LoadNewCreature(text)				
end


function LoadNewCreature(name)

	local teamsDir = Config.Get("current_teams_directory", "") 

	if name == "" then
		 Agent.Create("Alert", "Invalid Zook name.", Agent.Me(), "AlertAcknowledgeNewCreature", nil)
	elseif System.IsValidPath(teamsDir..myNewCreatureTeam.."/Creatures/"..name) then
		Agent.Create("Alert", "Zook " .. name .. " already exists.", Agent.Me(), "AlertAcknowledgeNewCreature", nil)
	elseif FilenameOk(name) == false then
		Agent.Create("Alert", {"Zook name cannot contain the following", "characters:  " .. myIllegalChars}, Agent.Me(), "AlertAcknowledgeNewCreature", nil)
	elseif String.strlen(name) > 25 then
		Agent.Create("Alert", {"Zook name cannot contain", "more than 25 characters"}, Agent.Me(), "AlertAcknowledgeNewCreature", nil)
	else
		local product = Config.Get("product_directory", ".");
		local root = System.GetLabeledPath("ROOT")
		System.CopyDirectory( root.."/NewCreature", product .. "/Teams/"..myNewCreatureTeam.."\\Creatures\\"..name, 0 )
		Agent.SendMessage("LoadingNewCreature", myBuilderParts) -- inform of new creature loading so can do differant upgrade operations that do not flag genome as stray zook
		MessageLoadCreature( myNewCreatureTeam, name, "1.0", "1.0" )
		if  Equals( Agent.Me(), myNewCreatureRequester) == false then
			Agent.SendMessage("NewCreatureCreated", myNewCreatureRequester, name)
		else
			local zookList = Agent.Create( "ZookList", "myZooks" )
			Agent.SendMessage( "ModifyEntry", zookList, name )
			Agent.SendMessage( "Destroy", zookList )
		end
		myNewCreatureTeam = nil
		myNewCreatureRequester = nil
	end

end


function MessageAlertAcknowledgeNewCreature()
	Agent.Create("TextEntry", Agent.Me(), "New Zook name:", "", "TextEntryNewCreature", 1 )
end


function MessageOKLoadCreature(  team, creature, version )
	
	local file_version = Agent.SendMessage("Version",  myBuilderParts, Config.Get("current_teams_directory", "") , team, creature, version )
	if file_version == false then
		Agent.Create("Alert", "The Zook file appears corrupt.", nil, nil, nil)
		return false
	end
	
	return MessageOKVersion(file_version)

end


function MessageOKVersion(file_version)
	local min = Config.Get("genome_min_version", 1)
	local max = Config.Get("genome_current_version", 1)	
	if file_version < min or file_version > max then
		Agent.Create("Alert", "The Zook file is version " .. file_version .. ", this Zook Kit can only load versions " .. min .. " to " .. max .. ".", nil, nil, 500)
		return false
	end
	return 1
end


function MessageLoadCreature(  team, creature, version, maxVersion )
	
	if Agent.IsValid(myZookSelector) then
		myLastZookSelectorTab = Agent.SendMessage("GetTab", myZookSelector)
	end
	
	theTeams = Config.Get("current_teams_directory", "") 
	if theTeams == Config.Get("default_teams_directory", "") then
		myAllowSave = 1
	else
		myAllowSave = false
		local text = {"This Zook can be edited but cannot", "be saved, exported or have component", "parts saved to the component library."}
		Agent.Create("Alert", text, 1, nil, nil)
	end
	
	--GUI.SetText( Segment.team_name, team )
	GUI.SetText( Segment.creature_name, creature )
	myTeam = team
	myCreature = creature
	myMaxVersion = Number.floor(tonumber(maxVersion))
	
	-- create agent for managing the entry in the zook list
	if myZookList ~= nil then
		Agent.SendMessage("Destroy", myZookList)
	end
	World.CloseAccess()
	myZookList = Agent.Create("ZookList", myTeam)
		
	
	LoadCreature(version)
	CacheTextures()
end


function LoadCreature(version)
	myVersion  = version
	local invalid = Agent.SendMessage( "Load", myBuilderParts, theTeams..myTeam.."/Creatures/"..myCreature.."/"..myVersion..".zook",
		theTeams..myTeam.."/Textures", myCreature, 1)
	if invalid then
		Agent.Create( "Alert", "Zook contained errors that have been corrected.", 1, nil, 400 )
	end
	--Set name in case it has been "saved as" with a previous version and has a bad passport
	Agent.SendMessage( "SetName", myBuilderParts, myCreature )
	myModified = false
	Agent.SendMessage( "SetDirectory", myPreview, theTeams..myTeam.."/Components", theTeams..myTeam.."/Textures" )

	SelectPart( false, false )
	FixRootPosition()
	myPartPosition = myRootPosition
	SetMode(constEditMode)
	return GreyUndoRedo()

end


function LoadGenome(allowCancel)
	myZookSelector = Agent.Create( "ZookSelector", myTeam, myCreature, Agent.Me(), 1, allowCancel, 1, nil, 1, false )
	if myLastZookSelectorTab ~= nil then
		Agent.SendMessage("SetTab", myZookSelector, myLastZookSelectorTab)
	end
end


function Save()
	if myAllowSave ~= false then
		Agent.SendMessage("SetPhysicalProperties", myBuilderParts)
		Agent.SendMessage("Save", myBuilderParts, theTeams..myTeam.."/Creatures/"..myCreature.."/"..myVersion..".zook" )
		myModified = false
		
		local zookList = Agent.Create( "ZookList", "myZooks" )
		Agent.SendMessage( "ModifyEntry", zookList, myCreature )
		Agent.SendMessage( "Destroy", zookList )
		
	else
		Agent.Create("Alert", "This Zook is read-only.", nil, nil, nil)
	end
end
 

function HardSave(name)
	if name ~= myCreature then
		if name == "" then
			Agent.Create("Alert", "Invalid Zook name.", Agent.Me(), "AlertAcknowledgeSave", nil)
		elseif System.IsValidPath(theTeams..myTeam.."/Creatures/"..name) then
			Agent.Create("Alert", "Zook " .. name .. " already exists.", Agent.Me(), "AlertAcknowledgeSave", nil)
		elseif FilenameOk(name) == false then
			Agent.Create("Alert", {"Zook name cannot contain the following", "characters:  " .. myIllegalChars}, Agent.Me(), "AlertAcknowledgeSave", nil)
		elseif String.strlen(name) > 25 then
			Agent.Create("Alert", {"Zook name cannot contain", "more than 25 characters"}, Agent.Me(), "AlertAcknowledgeSave", nil)
		else
			myCreature = name
			myMaxVersion = 0
			myVersion = "1.0"
			local product = Config.Get("product", "BAMZOOKi");
			System.CreateHomeDirectory( product .. "/Teams/"..myTeam.."/Creatures/"..myCreature)
			--~ Trace( "myTeam before %", myTeam )
			Save()
			--~ Trace( "myTeam after %", myTeam )
			MessageLoadCreature(  myTeam, myCreature, myVersion, myMaxVersion )
		end
	end
end


function MessageTextEntrySaveAs(text)
	text = FixFileName( text )
	Agent.SendMessage( "SetName", myBuilderParts, text )
	HardSave(text)

	--~ local zookList = Agent.Create( "ZookList", "myZooks" )
	--~ Agent.SendMessage( "ModifyEntry", zookList, text )
	--~ Agent.SendMessage( "Destroy", zookList )
	
	if  myAmImporting == 1 then
		-- was an import if message came from not zookselector (i.e. import list) else was a download
		Agent.SendMessage("DestroyOnSelect", myZookSelector)
		myAmImporting = nil
	end
end


function MessageAlertAcknowledgeSave()
	local allowCancel = 1
	if myCreature == "" then
		-- not already loaded - must be import
		allowCancel = false
	end
	Agent.Create("TextEntry", Agent.Me(), "Save as Zook name:", "", "TextEntrySaveAs", false )
end
	

function MessageSaveChanges(saveLatestChanges)
	if saveLatestChanges ~= false then
		myModified = false
		Agent.SendMessage( "Save", myBuilderParts, theTeams..myTeam.."/Creatures/"..myCreature.."/"..myVersion..".zook" )
	end
	
	if mySaveChangesMode == "exit" then
		Agent.SendMessage( "ExitMainLoop", myFrame )
	elseif mySaveChangesMode == "new" then
		-- new creature
		MessageNewCreature("myZooks", Agent.Me() )
	elseif mySaveChangesMode == "open" then
		-- open creature
		Agent.SendMessage( "SetGenomeVisibility", myBuilderParts, 1 )
		Agent.SendMessage( "SetFootGrid", myGrids, false, 0 )
		SetMode(constEditMode)
		SelectPart( false, false )
		LoadGenome(1)
	end	
end


function Export()
	if Agent.IsValid(myHttp) == 1 then
		Agent.SendMessage("Destroy", myHttp)
	end
	local export = System.GetLabeledPath("EXPORT")
	local export_subdir = Config.Get("export_subdir", "")
	local text
	if export_subdir ~= "" then
		text = {"Zook: "..myCreature, "Exported to Desktop/"..export_subdir}
		export_subdir = export_subdir.."/"
	else
		text = {"Zook: "..myCreature, "Has been exported to your Desktop"}
	end
	Save()
	UpdateUserDetailsToFile( export.."/"..export_subdir..myCreature..".zook")
	Agent.Create("Alert", text, nil, nil, nil)
end


function Upload()
	if Agent.IsValid(myHttp) == false then
		myWebFunctionCall = Upload
		ConfigureWeb()
	else
		TheAlert = Agent.Create("Alert", "Contacting BAMZOOKi server, please wait...", false, nil, nil)
		local object = Config.Get("web_agent_path", "") .. Config.Get("web_zookherder_agent", "") .. ".sax"
		Agent.SendMessage("Get", myHttp, object, Agent.Me(), "DownloadZookUploadComplete")
	end
end


function MessageDownloadZookUploadComplete(recieved, error)
	Agent.SendMessage("Destroy", TheAlert)
	if error ~= 0 then
		Agent.Create("Alert", {"Failed to access BAMZOOKi server files.", "Please check your Internet connection","and try again.", "", "Return error " .. error, "whilst looking for " .. Config.Get("web_zookherder_agent", "<no zookherder>")}, 1, nil, nil)
		return
	end	
	Save()
	UpdateUserDetailsToFile(TEMP_ZOOK_FILE)
	if TEST_LOCAL_ZOOKHERDER == false then
		Agent.DestroyClass(Config.Get("web_zookherder_agent", ""))
		Agent.CreateClassFromString(Bin.DecryptScript(recieved))
	end
	myUploadAgent = Agent.Create(Config.Get("web_zookherder_agent", ""))
	Agent.SendMessage("Upload", myUploadAgent,  {http = myHttp, username = myUsername, password = myPassword, creature = myCreature, file = TEMP_ZOOK_FILE, notify_message = "UploadComplete"})
end

function MessageUploadComplete(data)
	if Agent.IsValid(myUploadAgent) == 1 then
		Agent.SendMessage("Destroy", myUploadAgent)
	end
end

	
function ShowPassport()
	Agent.SendMessage("SetPhysicalProperties", myBuilderParts)
	Agent.SendMessage("Export", myBuilderParts, TEMP_ZOOK_FILE )
	local passport = Agent.SendMessage("Passport", myBuilderParts)
	local image = Agent.SendMessage("GetPassportImage", myBuilderParts)
	Agent.SendMessage("Load", myPassport, nil, "tempBuilder.zook", myCreature, passport, image)
end


function Browser()
	System.LaunchBrowser( Config.Get("web_site_url","http://www.bbc.co.uk/cbbc/bamzooki" ), 1 )
end


function FilenameOk(name)
	myIllegalChars = "/ \\ : < > | * ? \" '"
	for i=1, String.strlen(myIllegalChars), 2 do
		if String.strfind(name, String.strsub(myIllegalChars,i,i)) ~= nil then
			return false
		end
	end
	return 1
end
 
	
function FixFileName( name )
	while String.strlen( name ) > 0 and String.strsub( name, -1 ) == " " do
		name = String.strsub( name, 1, String.strlen( name ) - 1 )
	end
	while String.strlen( name ) > 0 and ( String.strsub( name, 1, 1 ) == "." or String.strsub( name, 1, 1 ) == " " ) do
		name = String.strsub( name, 2 )
	end
	return name
end




-- MODIFY / UNDO / REDO ----------------------------------------------------------------------------------------------------------------------------------------------------------------


function Modify( action, dontFixRoot )
	Agent.SendMessage( "Modify", myBuilderParts )
	GreyUndoRedo()
	myModified = 1
	if dontFixRoot == nil then
		FixRootPosition()
	end
end

function FixRootPosition()
	xMin, yMin, zMin, xMax, yMax, zMax = Agent.SendMessage( "BoundingBox", myBuilderParts )
	myRootPosition = Vector.New( 0, Vector.GetY( myRootPosition ) - yMin + 3, 0 )
	Agent.SendMessage( "SetRootPosition", myBuilderParts, myRootPosition )
	if mySelectedBodyPart then
		myPartPosition = Agent.SendMessage( "PartPosition",  myBuilderParts, mySelectedBodyPart )
	end
end

function GreyUndoRedo()
	Agent.SendMessage( "EnableButton", myModeButtons, "action", "undo", 
		Agent.SendMessage( "CanUndo", myBuilderParts) )
	Agent.SendMessage( "EnableButton", myModeButtons, "action", "redo",
		Agent.SendMessage( "CanRedo", myBuilderParts) )
end

function Undo()
	Agent.SendMessage( "Undo", myBuilderParts)
	SelectPart( mySelectedBodyPart, 1 )
	GreyUndoRedo()
end

function Redo()
	Agent.SendMessage( "Redo", myBuilderParts)
	SelectPart( mySelectedBodyPart, 1 )
	GreyUndoRedo()
end

function ParentVersion( version )
	local parentString = String.gsub( version, "(%d+)%.", "" )
	return tonumber( parentString )
end



-- IK -------------------------------------------------------------------------------------------------------------------------------------------------------------

function DeleteIkPoint()
	if getn(myIKPoints) > 2 then
		for i=myCurrentIKPoint, getn(myIKPoints)-1 do
			myIKPoints[i] = Clone( myIKPoints[i+1] )
		end
		myIKPoints[ getn(myIKPoints) ] = nil
		--t.n = n-1
	
		myCurrentIKPoint = myCurrentIKPoint - 1
		if myCurrentIKPoint < 1 then
			myCurrentIKPoint = getn( myIKPoints ) 
		end
		Agent.SendMessage( "SetIKPositions", myBuilderParts, mySelectedBodyPart, myIKPoints )
		Modify( "removed motion target" )
		UpdateIKUI()
	end
end


function UpdateIKUI()
	local nPoints = getn( myIKPoints )
	for i = 1, nPoints do
		GUI.Show( Segment.GetId( "ik_point"..i ), 1 )
		if i == myCurrentIKPoint then
			GUI.SetColour( Segment.GetId( "ik_point"..i ), 1, 0, 0, 1 )
		else
			GUI.SetColour( Segment.GetId( "ik_point"..i ), 1, 1, 1, 1 )
		end
	end
	for i = nPoints+1,  myShownIKPoints do
		GUI.Show( Segment.GetId( "ik_point"..i ), false )
	end
	myShownIKPoints = nPoints
	Camera.ClearLines()
	local normal = Vector.New( 1,0,0 )
	for index, value in myIKPoints do
		local	startP = myIKOrigin + Vector.New( value.x+0, value.y+0, value.z+0 )
		local endP
		if index == nPoints then
			endP = myIKOrigin + Vector.New( myIKPoints[1].x+0, myIKPoints[1].y+0, myIKPoints[1].z+0 )
		else
			endP = myIKOrigin + Vector.New( myIKPoints[index + 1].x+0, myIKPoints[index + 1].y+0, myIKPoints[index + 1].z+0 )
		end
		Camera.AddLine( startP, endP, 1, 1, 1, 1, 2 )
		--Add arrow head
		local arrowStart = 0.6
		local arrowEnd = 0.8
		local p1 = arrowStart * endP + (1-arrowStart) * startP
		local p2 = arrowEnd * endP + (1-arrowEnd) * startP
		if myIKMode == 1 then
			normal = p1 - myIKOrigin
		end
		local cross = Vector.Cross( endP - startP, normal )
		cross = ( 0.6 * Vector.GetLength( p2 - p1 ) / Vector.GetLength( cross ) ) * cross
		Camera.AddLine( p1 + cross, p2, 1, 1, 1, 1, 2 )
		Camera.AddLine( p1 - cross, p2, 1, 1, 1, 1, 2 )
	end
	
	Agent.SendMessage( "EnableButton", myEditButtons, "edit", "delete_ik", myCurrentIKPoint > 0 )
end


function SetIKMode()
	local leg_type = "0"
	
	if mySelectedBodyPart then
		leg_type = Agent.SendMessage( "Attribute",  myBuilderParts, mySelectedBodyPart, "leg_type" )
	end
	
	if leg_type == "1" then
		myIKMode = 1
	elseif leg_type == "2" then
		myIKMode = 2
	else
		myIKMode = 0
		--~ if myMode ==5 then
			--~ SetMode( 1 )
		--~ end
		--~ return
	end
	Agent.SendMessage( "SetFootGrid", myGrids, false, 0 )
	Agent.SendMessage( "SetFootSphere", myGrids, false, 0, 0 )

	myIKPoints = {}
	if myMode == constEditMode and myTab == "motion" then
		if myIKMode ~= 0 then
			myIKPoints = Agent.SendMessage( "IKPositions", myBuilderParts, mySelectedBodyPart )
		end
		
		if myIKMode == 1 then
			myIKOrigin = Agent.SendMessage( "PartConnect",  myBuilderParts, mySelectedBodyPart )
			myIKRadius = Agent.SendMessage( "Attribute",  myBuilderParts, mySelectedBodyPart, "scalez" )
			local transform = Agent.SendMessage( "PartTransform",  myBuilderParts, mySelectedBodyPart )
			Matrix.SetTranslation( transform, myIKOrigin )
			Agent.SendMessage( "SetFootSphere", myGrids, 1,  myIKRadius , transform )
			for index, p in myIKPoints do
				local l = Number.sqrt( p.x * p.x + p.y * p.y + p.z * p.z )
				p.x = p.x * myIKRadius / l
				p.y = p.y * myIKRadius / l
				p.z = p.z * myIKRadius / l
			end
		elseif myIKMode == 2 then
			myIKOrigin = Agent.SendMessage( "PartEnd",  myBuilderParts, mySelectedBodyPart )
			Agent.SendMessage( "SetFootGrid", myGrids, 1,  myIKOrigin )
		end
	end
	
	--myCurrentIKPoint = getn( myIKPoints ) * 2
	UpdateIKUI()
end


function MessageAngles( relativePoint )
	hor = Number.atan2( Vector.GetX( relativePoint ), Vector.GetZ( relativePoint ) ) * PI / 180
	return hor
end


function ReflectScale()
	if myPropertyEdit ~= nil then
		Agent.SendMessage( "UpdateAll", myPropertyEdit )
	end
	SetIKMode()
end


function RaySphereIntersect( from, to, centre, radius )
	--~ Trace ("From %  To %  centre %  radius %",  from, to, centre, radius )
	local ray = to - from
	local a = Vector.GetLengthSquared( ray )
	local diff = from - centre
        local b = 2 * Vector.Dot( ray, diff )
        local c = Vector.GetLengthSquared( diff ) - radius * radius;
	local det = b * b - 4 * a * c 
	if det > 0 then
		local t = (-b -Number.sqrt(det)) / (2 * a )
		return from + t * ray
	else
		--Find nearest point on sphere to line
		ray = Vector.Normalise( ray )
		local t = Vector.Dot( ray, centre - from )
		return t * ray + from
	end
		
end



-- GENERAL SUPPORT FUNCTIONS -----------------------------------------------------------------------------------------------------------

function UpdateUserDetailsToFile(file)
	-- load in again updating user details and save to temp file
	World.OpenAccess(myWorld)
	local service = Execute("WebConfiguration", 2)
	local loader = Agent.Create( "BuilderParts", myRootPosition, service.."::"..myUsername )
	World.CloseAccess()
	Agent.SendMessage( "Load", loader, theTeams..myTeam.."/Creatures/"..myCreature.."/"..myVersion..".zook", theTeams..myTeam.."/Textures", myCreature, 1)
	Agent.SendMessage( "AddMoniker", loader )
	Agent.SendMessage("Save", loader, file )
	Agent.SendMessage("Destroy", loader)
end


function AccessRegistry(mode, key, value)
	local path = Config.Get("product_directory", ".")
	local encryptionKey = Config.Get("registry_key", "")
	return Execute("AccessCodedTableKey", path, "Registry.sdx", encryptionKey, mode, key, value)
end


-- GENERAL ONLINE --------------------------------------------------------------------------------------------------------------------------

function ConfigureWeb()
	Execute("WebConfiguration", 1)
	ReconfigureMyHttp()
	
	local object = Config.Get("web_agent_path", "") .. Config.Get("web_online_configuration_agent", "") .. ".sax"
	TheAlert = Agent.Create("Alert", "Online configuration, please wait...", false, nil, nil)
	Agent.SendMessage("Get", myHttp, object, Agent.Me(), "DownloadWebConfigComplete")
end

function MessageDownloadWebConfigComplete(recieved, error)
	Agent.SendMessage("Destroy", TheAlert)
	if error ~= 0 then
		Agent.Create("Alert", {"Failed to access BAMZOOKi server files.", "Please check your Internet connection","and try again.", "", "Return error " .. error, "whilst looking for " .. Config.Get("web_online_configuration_agent", "<onlineconf>")}, 1, nil, nil)
		return
	end	
	
	if TEST_LOCAL_ONLINECONFIG == false then
		Agent.DestroyClass(Config.Get("web_online_configuration_agent", ""))
		Agent.CreateClassFromString(Bin.DecryptScript(recieved))
	end
	
	if myConfigureWebOptions == nil then
		myConfigureWebOptions = {}
	end
	myOnlineConfigAgent = Agent.Create(Config.Get("web_online_configuration_agent", ""), myConfigureWebOptions)
	Agent.SendMessage("Configure", myOnlineConfigAgent)
	myConfigureWebOptions = nil
end


function MessageExecuteWebConfigComplete(data)
	if Agent.IsValid(myOnlineConfigAgent) == 1 then
		Agent.SendMessage("Destroy", myOnlineConfigAgent)
		-- We have completed online configuration. HTTP server may have changed.
		ReconfigureMyHttp()
	end
	local call = myWebFunctionCall
	myWebFunctionCall = nil
	if data.webConfigured == 1 then
		if call ~= nil then
			call()
		end
	end
end

-- Called after the web server (Config "web_server") may have changed
function ReconfigureMyHttp()
	if Agent.IsValid(myHttp) ~= false then
		-- a live HTTP connection
		local server = Agent.SendMessage("GetServer", myHttp)
		if server ~= Config.Get("web_server", "") then
			-- change server
			Agent.SendMessage("Destroy",myHttp)
			myHttp = Agent.Create("Http", Config.Get("web_server", ""))
		end
	else
		-- new HTTP connection
		local server = Config.Get("web_server", "")
		myHttp = Agent.Create("Http", server)
	end
end

function UserAuthentification(postFunction)
	myAfterAuthentificaton = postFunction
	local onlineMsg1=""
	local onlineMsg2=""
	if postFunction==Export then
		onlineMsg1="Only NEW memberships will need to be"
		onlineMsg2="validated online when you Export a Zook."
	elseif postFunction==Upload then
		onlineMsg1="The Zook Kit will now need to go online"
		onlineMsg2="to validate membership & upload the Zook."
	end
	local service = Execute("WebConfiguration", 1)
	local username = AccessRegistry("read", service.."_username", nil)
	local password = AccessRegistry("read", service.."_password", nil)
	Agent.Create("Logon", Agent.Me(), "Authentificaton", {
		"Enter a " .. service .. " member name & ", 
		"password to Export or Upload Zooks.",
		"Get membership at: ",
		Config.Get("web_registration_site", ""),
		onlineMsg1,
		onlineMsg2}, 
		username, 	password,
		"member name", "password")
end


function MessageAuthentificaton(username, password)
	myUsername = username
	myPassword = password
	
	local service = Execute("WebConfiguration", 2)
	local lastUsername = AccessRegistry("read", service.."_username", nil)
	local lastPassword = AccessRegistry("read", service.."_password", nil)
	
	if lastUsername ~= myUsername or lastPassword ~= myPassword then
		ConfigureWeb()
		myWebFunctionCall = WebAuthentification
	else	
		myAfterAuthentificaton()
	end
end


function WebAuthentification()
	local object = Config.Get("web_agent_path", "") .. Config.Get("web_user_authentification_agent", "") .. ".sax"
	TheAlert = Agent.Create("Alert", "Authenticating member online, please wait...", false, nil, nil)
	Agent.SendMessage("Get", myHttp, object, Agent.Me(), "DownloadAuthentificationComplete")
end

	
function MessageDownloadAuthentificationComplete(recieved, error)
	Agent.SendMessage("Destroy", TheAlert)
	if error ~= 0 then
		Agent.Create("Alert", {"Failed to access BAMZOOKi server files.", "Please check your Internet connection","and try again.", "", "Return error " .. error, "whilst looking for " .. Config.Get("web_user_authentification_agent", "<userauth>")}, 1, nil, nil)
		return
	end	
	
	if TEST_LOCAL_USERAUTH == false then
		Agent.DestroyClass(Config.Get("web_user_authentification_agent", ""))
		Agent.CreateClassFromString(Bin.DecryptScript(recieved))
	end
	
	myOnlineAuthentificationAgent = Agent.Create(Config.Get("web_user_authentification_agent", ""), {http = myHttp, username = myUsername, password = myPassword })
end

		
function MessageAuthentificationComplete(data)
	if Agent.IsValid(myOnlineAuthentificationAgent) == 1 then
		Agent.SendMessage("Destroy", myOnlineAuthentificationAgent)
	end
	if data.authentificatonOk == 1 then
		myAfterAuthentificaton()
	end
end


-- EXTERNAL MESSAGES -----------------------------------------------------------------------------------------------------------------------

	

function MessageCreatureName()
	return myCreature
end
	
function MessageLoadedDetails()
	return myTeam,	myCreature 
end


function MessageAddDetail(category, name, data, comment, volatileModTable)
	Agent.Create( "Alert", name.." trial completed. Score: "..data.." "..comment, 1, nil, 400 )
	Agent.SendMessage("AddDetail", myBuilderParts, category, name, data,  comment, volatileModTable)
	Modify( "Completed trial", 1 )
end
	

function MessageImport( fullPath, name )
	Trace( "In MessageImport fullPath, name = %, %", fullPath, name )
	if name then
		myTeam = "myZooks"
		theTeams = Config.Get("default_teams_directory", "")
		Config.Set("current_teams_directory", theTeams) 
		myAllowSave = 1
		local invalid = Agent.SendMessage( "Load", myBuilderParts, fullPath, theTeams..myTeam.."/Textures", name, 1 )
		if invalid then
			Agent.Create( "Alert", "Zook contained errors that have been corrected.", 1, nil, 400 )
		end
		FixRootPosition()
		myPartPosition = myRootPosition
		myCreature = ""
		Agent.Create("TextEntry", Agent.Me(), "Save as Zook name:", String.strsub(name,1,String.strlen(name)-5), "TextEntrySaveAs", false )
		CacheTextures()
		--All imported zooks are now added to the zook list
		if  Agent.IsValid(myZookSelector) == 1 and Equals(Agent.From(), myZookSelector) == false then
			-- was an import if message came from not zookselector (i.e. import list) else was a download (we dont add them to lists
			myAmImporting = 1
		end
	end
end


function MessageParts()
	return myBuilderParts
end


function MessageDetails()
	return theTeams, myTeam, myCreature, myVersion
end
