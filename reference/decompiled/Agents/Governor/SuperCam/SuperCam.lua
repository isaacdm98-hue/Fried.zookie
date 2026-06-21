#SuperCam specializes UIAgent embeds Camera, Input, GUI


function Initialize( world )

	myWorld = world

	Config.Set("theCamera",Agent.Me())

	myCameraMode = "Edit"
	myCameraPosition = Vector.New( 0, 0, -2 )
	myTargetPosition = Vector.New()

	myDefaultAngle =30
	myDefaultDistance = 5
	myDefaultYaw = 20
	myAngle = myDefaultAngle
	myDistance = myDefaultDistance
	myYaw = myDefaultYaw
	
	myRightKeyDown = false
	myRightArrowKeyDown = false
	myLeftArrowKeyDown = false
	myForwardKeyDown = false
	myBackwardKeyDown = false
	myUpKeyDown = false
	myDownKeyDown = false
	myShiftsDown = 0

	
	local width, height = Camera.Area()
	World.OpenAccess(myWorld)
		Camera.Create(0, 0, width, height)
	World.CloseAccess()
	
	Camera.SetClipPlanes( 0.1, 200 )
	local rFog, gFog, bFog = Config.Get("sky_r", 1), Config.Get("sky_g", 1), Config.Get("sky_b", 1) 
	Camera.SetFog( Config.Get("fogging", 1), Config.Get("fog_start", 40), Config.Get("fog_end", 80) , 1, rFog, gFog, bFog )
	Camera.SetBackground( rFog, gFog, bFog )
	Camera.SetPosition( myCameraPosition )
	Camera.SetTarget( myTargetPosition, Vector.New( 0, 1, 0 ) )

	Input.RegisterKey(Input.KEY_ADD)
	Input.RegisterKey(Input.KEY_EQUALS)
	Input.RegisterKey(Input.KEY_SUBTRACT)
	Input.RegisterKey(Input.KEY_MINUS)
	Input.RegisterKey(Input.KEY_LEFT)
	Input.RegisterKey(Input.KEY_RIGHT)
	Input.RegisterKey(Input.KEY_UP)
	Input.RegisterKey(Input.KEY_DOWN)
	Input.RegisterKey(Input.KEY_A)
	Input.RegisterKey(Input.KEY_S)
	Input.RegisterKey(Input.KEY_D)
	Input.RegisterKey(Input.KEY_W)
	Input.RegisterKey(Input.KEY_Q)
	Input.RegisterKey(Input.KEY_Z)
	Input.RegisterKey(Input.KEY_LSHIFT)
	Input.RegisterKey(Input.KEY_RSHIFT)
	Input.RegisterKey(Input.KEY_HOME)
	Input.RegisterMouse()
	
	SetAspect( 60 )
	
	GUI.CreateObject( "click_layer",  0, 0, width, height, 1 )

	
end


function MessageShow(show)
	Camera.Show( show )
end


function MessageSetTargetPosition(p)
	myTargetPosition = p
end

function SystemCamera( frametime )

	if myCameraMode  == "Free" then
		-- free camera
		local q = Quatn.New( Vector.New( 1, 0, 0 ), myAngle ) *
				Quatn.New( Vector.New( 0, 1, 0 ), myYaw+180 )
		Camera.SetOrientation(  q )
		local speed = 3
		if myShiftsDown > 0 then
			speed = speed * 3
		end
		if myRightArrowKeyDown then
			myCameraPosition = myCameraPosition  + Vector.New( -frametime * speed, 0, 0 ) *  q
		end
		if myLeftArrowKeyDown then
			myCameraPosition = myCameraPosition  + Vector.New( frametime * speed, 0, 0 ) *  q
		end
		if myForwardKeyDown then
			local q = Quatn.New( Vector.New( 0, 1, 0 ), myYaw+180 )
			myCameraPosition = myCameraPosition  + Vector.New( 0, 0, frametime * speed ) *  q
		end
		if myBackwardKeyDown then
			local q = Quatn.New( Vector.New( 0, 1, 0 ), myYaw+180 )
			myCameraPosition = myCameraPosition  + Vector.New( 0, 0, -frametime * speed ) *  q
		end
		
		if myUpKeyDown then
			myCameraPosition = myCameraPosition + Vector.New(0,0.1,0)
		end
	
		if myDownKeyDown then
			myCameraPosition = myCameraPosition + Vector.New(0,-0.1,0)
		end
		Camera.SetPosition( myCameraPosition )
	else
		-- edit, follow and cool cameras..........all use a target position
				
		if myCameraMode == "Edit" then
			-- edit mode
			if myBackwardKeyDown then
				myDistance = myDistance  + 0.1
			end
			if myForwardKeyDown then
				myDistance = myDistance  - 0.1
				if myDistance < 0 then
					myDistance = 0
				end
			end
		end
		
		local y = Number.sin( myAngle ) * myDistance
		local r = Number.cos( myAngle ) * myDistance
		local z = r * Number.cos( myYaw )
		local x = r * Number.sin( myYaw )
		myCameraPosition = Vector.New( x, y, z )  + myTargetPosition
		
		
		if myCameraMode ~= "Edit" then
			-- follow & cool camera
			local dir = Vector.New(x, 0, z)
			local length = Vector.GetLength(dir)*10
			local camOffset = Vector.New()
			if myBackwardKeyDown then
				camOffset = Vector.New(x/length, 0, z/length)
			end
			if myForwardKeyDown then
				camOffset = Vector.New(-x/length, 0, -z/length)
			end
			
			myCameraPosition = myCameraPosition + camOffset
			myDistance = Vector.GetLength(Vector.New( x, y, z )+camOffset)
		end
				
		Camera.SetPosition( myCameraPosition )
		Camera.SetTarget( myTargetPosition, Vector.New( 0, 1, 0 ) )
	end
	
end
	

function SystemKeyDown(key)

	local controlDown = Input.IsKeyDown(Input.KEY_LCONTROL) or Input.IsKeyDown(Input.KEY_RCONTROL)
	
	if key == Input.KEY_HOME then
		myAngle = myDefaultAngle
		myDistance = myDefaultDistance
		myYaw = myDefaultYaw
		return
	elseif key == Input.KEY_ADD  or key == Input.KEY_EQUALS then
		myDistance = myDistance * ( 1 - 120 * 0.001 )
--		myDistance = myDistance  -1
	elseif key == Input.KEY_SUBTRACT or key == Input.KEY_MINUS then
		myDistance = myDistance * ( 1 + 120 * 0.001 )
		--myDistance = myDistance  +1
	elseif key == Input.KEY_RIGHT or key == Input.KEY_D then
		myRightArrowKeyDown = 1
	elseif key == Input.KEY_LEFT or key == Input.KEY_A then
		myLeftArrowKeyDown = 1
	elseif key == Input.KEY_UP or (key == Input.KEY_W and not controlDown) then
		myForwardKeyDown = 1
	elseif key == Input.KEY_DOWN or (key == Input.KEY_S and not controlDown) then
		myBackwardKeyDown = 1
	elseif key == Input.KEY_Q and not controlDown then
		myUpKeyDown = 1
	elseif key == Input.KEY_Z then
		myDownKeyDown = 1
	elseif key == Input.KEY_LSHIFT  or  key == Input.KEY_RSHIFT then
		myShiftsDown = myShiftsDown +1	
	end
	
end

	
function SystemKeyUp(key)

	if key == Input.KEY_RIGHT or key == Input.KEY_D then
		myRightArrowKeyDown = false
	elseif key == Input.KEY_LEFT or key == Input.KEY_A then
		myLeftArrowKeyDown = false
	elseif key == Input.KEY_UP or key == Input.KEY_W then
		myForwardKeyDown = false
	elseif key == Input.KEY_DOWN or key == Input.KEY_S then
		myBackwardKeyDown = false
	elseif key == Input.KEY_Q then
		myUpKeyDown = false
	elseif key == Input.KEY_Z then
		myDownKeyDown = false
	elseif key == Input.KEY_LSHIFT  or  key == Input.KEY_RSHIFT then
		myShiftsDown = myShiftsDown - 1
	end
	
end

	
function SystemMouse(x, y, wheel)
	if myCameraMode ~= "Free" then
		myDistance = myDistance * ( 1 + wheel * 0.001 )
	end
	if myRightKeyDown then
		local scale = 0.6
		if myCameraMode == "Free" then
			scale = 0.3
		end
		myAngle = myAngle + y * scale
		if myAngle > 89 then
			myAngle = 89
		end
		if myAngle < -89 then
			myAngle = -89
		end
		myYaw = myYaw - x * scale
	end
end
		
	
function SystemUIMouseRDown(segment)
	if segment == Segment.click_layer then
		myRightKeyDown = 1
		if myCameraMode == "Cool" then
			World.OpenAccess(myWorld)
				World.Pause(myWorld)
			World.CloseAccess()
		end
	end
end

	
function SystemUIMouseRUp(segment)
	if segment == Segment.click_layer then
		myRightKeyDown = false
		World.OpenAccess(myWorld)
			World.Resume(myWorld)
		World.CloseAccess()
	end
end
		

function MessagePick()
	return Camera.Pick( Input.MousePosition() )
end		
		

function SetAnamorphic( verticalViewAngle ) -- Assumes camera screen window is 4x3 but desired aspect ratio is 16x9
	local horizontalViewAngle = 2 * Number.atan( ( 16.0 / 9.0 ) * Number.tan( verticalViewAngle / 2.0 ) )
	myHorizontalViewAngle = horizontalViewAngle
	myVerticalViewAngle = verticalViewAngle
	Camera.SetViewAngles( horizontalViewAngle, verticalViewAngle )
end

		
function SetAspect( verticalViewAngle ) -- Assumes camera screen window is 4x3 but desired aspect ratio is 16x9
	local horizontalViewAngle = 2 * Number.atan( ( 4 / 3 ) * Number.tan( verticalViewAngle / 2.0 ) )
	myHorizontalViewAngle = horizontalViewAngle
	myVerticalViewAngle = verticalViewAngle
	Camera.SetViewAngles( horizontalViewAngle, verticalViewAngle )
end


function MessageShowBackground(show)
	if show then
		local rFog, gFog, bFog = Config.Get("sky_r", 1), Config.Get("sky_g", 1), Config.Get("sky_b", 1) 
		Camera.SetFog( 1, Config.Get("fog_start", 40), Config.Get("fog_end", 80), 1, rFog, gFog, bFog  )
		Camera.SetBackground( rFog, gFog, bFog )
	else
		Camera.SetFog( 0, Config.Get("fog_start", 40), Config.Get("fog_end", 80), 1, 1, 1, 1 )
		Camera.SetBackground( Config.Get("bluescreen_colour_red",0), Config.Get("bluescreen_colour_green",0), Config.Get("bluescreen_colour_blue",1), Config.Get("bluescreen_colour_alpha",1) )
	end
end


function SetVerticalViewAngle( verticalViewAngle )
	local width, height = Camera.GetSize()
	local aspect = width / height
	local horizontalViewAngle = 2 * Number.atan( aspect * Number.tan( verticalViewAngle / 2.0 ) )
	Camera.SetViewAngles( horizontalViewAngle, verticalViewAngle )
end


function MessageShow(b)
	Camera.Show(b)
end

function SetScreenAndPanelSize(panelWidth, anamorphic, letterboxed)

	local width, height = GUI.Area()

	local letterboxHeight = width * 9/16
	local letterboxTop = (height - letterboxHeight)/2
	local letterboxBottom = letterboxTop + letterboxHeight
	local smallWidth = letterboxHeight * 4 / 3
	local smallRight = width - (width - smallWidth)/2
	GUI.CreatePicture( "letterbox_top", "black.png", -1, -1, width, letterboxTop )
	GUI.CreatePicture( "letterbox_bottom", "black.png", -1, letterboxBottom, width, height )

	local panelTop =33
	if letterboxed == false then
		GUI.Show( Segment.letterbox_top, letterboxed )
		GUI.Show( Segment.letterbox_bottom, letterboxed )
	else
		panelTop = letterboxTop + letterboxHeight * 32/579
	end

	
	local panelLeft
	if anamorphic then
		panelLeft = smallRight - panelWidth - smallWidth * 52/768       --To put inside 4x3
	else
		panelLeft = width - panelWidth - 32 --smallRight - panelWidth
	end
	local panelRight = panelLeft + panelWidth
	
	return panelLeft, panelRight, panelTop, smallWidth, smallRight
end
