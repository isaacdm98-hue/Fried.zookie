# SplitScreen specializes UIAgent embeds GUI, Input


function Initialize( world, camera )
	myWorld = world
	myTitle = ""
	myCameraSpec = camera
	local screenWidth, screenHeight = GUI.Area()
	GUI.SetParent()
	GUI.CreateObject( "resizer", 0, 0, screenWidth, screenHeight, false )
	if myCameraSpec.no_margin == nil then
		screenHeight = screenHeight - 32
	end
	local x1, y1, x2, y2
	myViews = {
		{	zook = Config.Get("camera1_zook", -1 ),
			target = Config.Get("camera1_target", Vector.New( 0,0,0 ) ),
			offset = Config.Get("camera1_offset", Vector.New( -200, 120, 200 ) ),
			verticalViewAngle = Config.Get("camera1_angle", 18 ),
			targetHeight = 0 },
		{	zook = Config.Get("camera2_zook", 0),
			target = Config.Get("camera2_target", Vector.New( 0,0,0 ) ),
			offset = Config.Get("camera2_offset", Vector.New( 16, 16, 60 ) ),
			verticalViewAngle = Config.Get("camera2_angle", 45 ),
			targetHeight = 0 },
		{	zook = Config.Get("camera3_zook", 1),
			target = Config.Get("camera3_target", Vector.New( 0,0,0 ) ),
			offset = Config.Get("camera3_offset", Vector.New( 2.5, 8, 25 ) ), 
			verticalViewAngle = Config.Get("camera3_angle", 45 ),
			targetHeight = 0 },
		{	zook = Config.Get("camera4_zook", 5),
			target = Config.Get("camera4_target", Vector.New( 0,0,0 ) ), 
			offset = Config.Get("camera4_offset", Vector.New( 2.5, 8, 25 ) ), 
			verticalViewAngle = Config.Get("camera4_angle", 45 ),
			targetHeight = 0 },
	}
	mySmallCameraCount = getn(myViews)
	myMinViewAngle = Config.Get("min_view_angle", 10)
	myMaxViewAngle = Config.Get("max_view_angle", 90)
	myMouseSensitivity = Config.Get("mouse_sensitivity", 0.6)
	
	myViews[ 0 ] = myViews[ 1 ]
	World.OpenAccess( world )
		mySmallCameras = {}
		myCameraSelectors = {}
		x1 = 0
		y1 = 0
		x2 = screenWidth
		y2 = screenHeight * mySmallCameraCount/(mySmallCameraCount+1) 
		myMainCamera = Agent.Create( "SplitCamera", x1, y1, x2, y2 )
		mySmallCameras[ 0 ] = myMainCamera
		Agent.SendMessage( "SetView", myMainCamera, myViews[0] )
		local cam = GUI.CreateObject( "cam0", x1, y1, x2, y2 )
		myCameraSelectors[ cam ] = 0
		y1 = y2
		y2 = screenHeight 
		for i = 1, mySmallCameraCount do
			x1 = (i-1)*screenWidth / mySmallCameraCount
			x2 = i*screenWidth / mySmallCameraCount
			mySmallCameras[ i ] = Agent.Create( "SplitCamera", x1+1, y1+1, x2-1, y2-1 )
			local cam = GUI.CreateObject( "cam"..i, x1, y1, x2, y2 )
			GUI.Show( cam, 1 )
			myCameraSelectors[ cam ] = i
			Agent.SendMessage( "SetView", mySmallCameras[ i ], myViews[i] )
		end
	World.CloseAccess()
	myLoop = false
	Input.RegisterMouse()
	Input.RegisterKey( Input.KEY_J )
end

function SystemKeyDown(key)
	if key == Input.KEY_J then
		Agent.SendMessage( "SaveScreen", myMainCamera )
	end
end

function MessageSetTitle(title)
	myTitle = title
	local width, height = GUI.MeasureText( title, "Fonts/Arial-32.met" )
	local margin = 4
	local screenWidth, screenHeight = GUI.Area()
	GUI.CreateObject( "title_parent", 0, 0, width + margin * 4, height + margin * 4 )
	AddPanel( margin, margin, width + margin*3, height + margin*3, false, false, false, 1, Segment.title_parent, Segment.title_parent )
	GUI.SetParent( Segment.title_parent )
	GUI.CreateText( "title", title, margin*2, margin*2, 0, 0, "Fonts/Arial-32.met" )
	GUI.SetParent(  )
end

function SystemUIResize( segment )
	if segment == Segment.resizer then
		MessageResize()
	--	Agent.PostMessage( "Resize", Agent.Me(), 0.2 )
	end
end

function MessageResize()
	local screenWidth, screenHeight = GUI.Area()
	if myCameraSpec.no_margin == nil then
		screenHeight = screenHeight - 32
	end
	local x1, y1, x2, y2
	x1 = 0
	y1 = 0
	x2 = screenWidth
	y2 = screenHeight * mySmallCameraCount/(mySmallCameraCount+1) 
	Agent.SendMessage( "Resize", myMainCamera, x1, y1, x2, y2 )
	GUI.Resize( Segment.cam0, x1, y1, x2, y2 )
	y1 = y2
	y2 = screenHeight 
	for i = 1, mySmallCameraCount do
		x1 = (i-1)*screenWidth / mySmallCameraCount
		x2 = i*screenWidth / mySmallCameraCount
		Agent.SendMessage( "Resize", mySmallCameras[ i ], x1+1, y1+1, x2-1, y2-1 )
		GUI.Resize( Segment.GetId( "cam"..i ), x1, y1, x2, y2 )
	end
	MessageSetTitle( myTitle )
end

function SystemUIChange( segment )
end

function SystemUIMouseLDown( segment )
	local cam = myCameraSelectors[ segment ]
	if cam ~= nil and cam > 0 then
		Agent.SendMessage( "SetView", myMainCamera, Agent.SendMessage( "GetView", mySmallCameras[cam] ) )
		myViews[0] = myViews[cam]
	end
end

function SystemUIMouseRDown( segment )
	Trace( "UI change segment: %", segment)
	mySelectedCam = myCameraSelectors[ segment ]
	if mySelectedCam ~= nil then
		Trace( "Setting camera: %", cam)
		myTimeDown = System.RealTime()
	end
end

function SystemUIMouseLUp( segment )
end

function SystemUIMouseRUp( segment )
	mySelectedCam = nil
end

function SystemMouse(xM, yM, wheel)
	if mySelectedCam ~= nil then
		myViews[ mySelectedCam ] = Agent.SendMessage( "GetView", mySmallCameras[mySelectedCam] )
		local x, y, z = Vector.GetXYZ( myViews[ mySelectedCam ].offset )
		
		local yaw = Number.atan2( x, z ) - xM * myMouseSensitivity
		local len = Number.sqrt( x * x + y * y + z * z )
		local flatLen = Number.sqrt( x * x + z * z )
		local pitch = Number.atan2( flatLen, y ) - yM * myMouseSensitivity
		if pitch < 1 then pitch = 1 end
		if pitch > 89 then pitch = 89 end
		flatLen = Number.sin( pitch ) * len
		y = Number.cos( pitch ) * len
		x = Number.sin( yaw ) * flatLen
		z = Number.cos( yaw ) * flatLen

		myViews[ mySelectedCam ].offset = Vector.New( x, y, z )
		Agent.SendMessage( "SetView", mySmallCameras[mySelectedCam], myViews[mySelectedCam] )
	end
	local cam = mySelectedCam
	if cam == nil then
		cam = 0
		myViews[0] = Agent.SendMessage( "GetView", mySmallCameras[0] )
	end
	local angle = myViews[ cam ].verticalViewAngle * ( 1 + wheel * 0.001 )
	if angle < myMinViewAngle then angle = myMinViewAngle end
	if angle > myMaxViewAngle then angle = myMaxViewAngle end
	myViews[ cam ].verticalViewAngle = angle
	Agent.SendMessage( "SetView", mySmallCameras[cam], myViews[cam] )
		
end

function MessageDestroy()
	for i = 0, mySmallCameraCount do
		Agent.SendMessage( "Destroy", mySmallCameras[ i ] )
	end
	Agent.Destroy()
end

function MessageRecordCamera( rec )
	Agent.SendMessage( "RecordPositions", myMainCamera, rec )
end

function MessageSaveCameraPositions( filename )
	Agent.SendMessage( "SavePositions", myMainCamera, filename )
end

function MessageGetCameraPositions( )
	return Agent.SendMessage( "GetPositions", myMainCamera )
end

function MessageGetCameraPosition( )
	return Agent.SendMessage( "GetPosition", myMainCamera )
end

function MessageShow( show )
	for i = 1, mySmallCameraCount do
		Agent.SendMessage( "Show", mySmallCameras[i], show )
	end
	Agent.SendMessage( "Show", myMainCamera, show )
	GUI.Show( Segment.title_parent, show )
end
