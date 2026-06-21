#SimplePhotographer specializes UIAgent embeds Camera, Input, Sound

IMAGE_SIZE = 256

function Initialize( world, transform, image, notifyAgent )
	myNotifyAgent = notifyAgent
	Input.SetFocus()
	Input.RegisterKey( Input.KEY_RETURN )
	Input.RegisterKey( Input.KEY_ESCAPE )
	--Sound.Play( "Sounds/Camera.wav" )

	local deskWidth, deskHeight = GUI.Area()
	local width = IMAGE_SIZE + 32
	local height = IMAGE_SIZE + 32 + 32 + 32
	if image ~= nil and image.image ~= nil then
		width = width + IMAGE_SIZE + 16
	end
	GUI.SetParent()
	GUI.CreateObject( "parent", 0, 0, deskWidth, deskHeight, 1 )
	local left = (deskWidth - width)/2
	local top = (deskHeight - height)/2
	AddPanel( left, top, deskWidth - left, deskHeight - top,
		1, 1, false, false, Segment.parent, Segment.parent )

	local x = left + 16
	local y = top + 16 

	if image ~= nil and image.image ~= nil then
		GUI.CreateText( "label1", "Current Passport Photo", x, y, x, y, "fonts/edit.met" )
		GUI.SetColour( Segment.label1, 0, 0, 0, 1 )
		GUI.CreatePicture( "original", "", x, y + 22, x + IMAGE_SIZE, y + 22 + IMAGE_SIZE )
		GUI.SetImageFromString( Segment.original, image.image )
		x = x + IMAGE_SIZE + 16
	end

	--Create a camera so that we can nab an image from it
	World.OpenAccess( world )
		Camera.Create( x, y + 22, x + IMAGE_SIZE, y + IMAGE_SIZE + 22 )
	World.CloseAccess()
	Camera.SetClipPlanes( 0.1, 200 )
	local rFog, gFog, bFog = Config.Get("sky_r", 1), Config.Get("sky_g", 1), Config.Get("sky_b", 1) 
	Camera.SetFog( Config.Get("fogging", 1), Config.Get("fog_start", 40), Config.Get("fog_end", 80) , 1, rFog, gFog, bFog )
	Camera.SetBackground( rFog, gFog, bFog )
	Camera.SetTransform( transform )
	GUI.CreateText( "label2", "New Passport Photo", x, y, x, y, "fonts/edit.met" )
	GUI.SetColour( Segment.label2, 0, 0, 0, 1 )
	GUI.CreatePicture( "new", "", x, y+22, x + IMAGE_SIZE, y + 22 + IMAGE_SIZE )
	myNewImage = Camera.GetImageAsString()
	myNewImage = Camera.GetImageAsString()
	GUI.SetImageFromString( Segment.new, myNewImage )

	y = y + 22 + IMAGE_SIZE + 8
	
	if image ~= nil and image.image ~= nil then
		AddPanelButton( "ok_button", "Replace", x, y, x + 80, y+23, Segment.parent)
	else
		AddPanelButton( "ok_button", "Use", x, y, x + 80, y+23, Segment.parent)
	end
	AddPanelButton( "cancel_button", "Cancel", x + 88, y, x + 168, y+23, Segment.parent)
end

function SystemKeyDown(key)
	if key == Input.KEY_RETURN then 
		Agent.SendMessage( "SimplePhotographer", myNotifyAgent,  myNewImage )
		Agent.Destroy()
	end
	if key == Input.KEY_ESCAPE then 
		Agent.Destroy()
	end
end

function SystemUIChange( segment )
	if segment == Segment.ok_button then
		Agent.SendMessage( "SimplePhotographer", myNotifyAgent,  myNewImage )
		Agent.Destroy()
	end
	if segment == Segment.cancel_button then
		Agent.Destroy()
	end
end

function MessageGetPicture()
	return myNewImage
end

function MessageDestroy()
	Agent.Destroy()
end
