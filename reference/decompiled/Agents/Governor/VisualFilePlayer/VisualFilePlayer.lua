#VisualFilePlayer specializes UIAgent embeds UI, Visual

function Initialize(world, splitScreen)

	mySplitScreen = splitScreen
	myWorld = world
	World.OpenAccess(myWorld)
	profileId = World.CreateProfile("Read", 1, 0, 0)
	Visual.CreateShadowSource( Vector.New( 2, 10, 2 ), .2 )
	Visual.CreateLight( 0, "ambient" )
	Visual.SetLightColour( Segment.ambient, 0.3, 0.3, 0.3 )
	Visual.CreateLight( 1, "directional" )
	Visual.SetLightColour( Segment.directional, 0.7, 0.7, 0.7 )
	local trans = Matrix.New()
	Matrix.SetTranslation( trans, Vector.New( -1, 1, -1 ) )
	Matrix.LookAt( trans, Vector.New(0, 0, 0 ), Vector.New( 0, 1, 0 ) )
	Visual.SetLightTransform( Segment.directional, trans )
	World.CloseAccess()

	loop = false
	speed = 1
	timeStamp = 0

	local width = 400
	local height = 400

	--Input.RegisterKey(Input.KEY_G)
	--myFloorManager = Agent.Create( "FloorManager", world )
	--myGroupLightingManager = Agent.Create("GroupLightManager", world)

	-- For temporary video files
	TMP_VIDEO_PATH = Config.Get("product_directory", ".").."/Videos/"
	myRandomTempName= TMP_VIDEO_PATH..Number.random(999999) .. ".bmv"
	myTempName=nil

	-- Default for saved video files
	VIDEO_PATH = System.GetLabeledPath("EXPORT") .. "/"
	local video_subdir = Config.Get("video_subdir", "")
	if video_subdir ~= "" then
		VIDEO_PATH = VIDEO_PATH .. video_subdir .. "/"
	end

	Config.Set( "visual_ignore_lights", 1 )
	myHasGUI = false
	myPlaying = false
	Input.RegisterKey( Input.KEY_ESCAPE )
	myToolTips = Agent.Create( "ToolTips" )
	local screenWidth, screenHeight = GUI.Area()
	GUI.CreateObject( "resizer", 0, 0, screenWidth, screenHeight, false )
	CreateUI()
	myCountdown = Agent.Create( "VideoCountdown", world )
	UI.SingleFrame.CallOnExit( Agent.Me(), "SystemOnExit" )
end

function SystemOnExit()
		System.ExitMainLoop()
end

function Finalize()
	Agent.SendMessage("Destroy", myToolTips)
	--Agent.SendMessage("Destroy", myFloorManager)
	--Agent.SendMessage("Destroy", myGroupLightingManager)
end



function MessageFilename()
	return filename
end


function MessageSelectFile()
	local path = System.GetLabeledPath("MYDOCUMENTS") .. "\\My BAMZOOKi\\Motion Files"
	filename = System.GetFilename(path, 1, "Bamzooki Motion Files", "*.bvz")
	Trace("loading file: %", filename)
	if String.strlen(filename) == 0 then	
		Trace("exiting")
		SystemOnExit()
	else
		Trace("Got filename %", filename)
		MessageOpenFile(filename)
	end
end


function MessageOpenFile(filename)
	
	alert = Agent.Create("Alert", "Loading....", false, nil, nil)
	Agent.PostMessage("SetTitleFromFilename", Agent.Me(), 0.1, filename)
	Agent.PostMessage("InternalOpenFile", Agent.Me(), 0.1, filename)
	--CreateUI()
	
end

-- This function does not set the title because it is passed 
-- an unzipped temporary file. Set the  title outside this agent
function MessageOpenFileNoUI(filename)
	
	alert = Agent.Create("Alert", "Loading....", false, nil, nil)
	Agent.PostMessage("InternalOpenFile", Agent.Me(), 0.1, filename)
	--Agent.PostMessage("Start", Agent.Me(), 0.2 )
	
end

function MessageGetTempName()
	return myTempName
end

function MessageSetTitleFromFilename(titlefilename)
	if titlefilename==nil then
		titlefilename=filename
	end
	local lastSlash = 1
	local lastDot = String.strlen( titlefilename )
	for i = 1, String.strlen( titlefilename ) do
		local char = String.strsub( titlefilename, i, i ) 
		if char == "\\" or char == "/" then
			lastSlash = i
		elseif char == '.' then
			lastDot = i
		end
	end
	title = String.strsub( titlefilename, lastSlash + 1, lastDot - 1 )
	Agent.SendMessage( "SetTitle", mySplitScreen, title )
end

-- Takes filename to play.
function MessageInternalOpenFile(filename)

	if Equals(Agent.From(), Agent.Me()) == false then
		return
	end

	--find out if file is compressed (.bvz) or not (.bmv)
	local lastDot = String.strlen( filename )
	local lastSlash = 0
	for i = 1, String.strlen( filename ) do
		local char = String.strsub( filename, i, i ) 
		if char == "\\" or char == "/" then
			lastSlash = i
		elseif char == '.' then
			lastDot = i
		end
	end
	if String.strsub( filename, lastDot ) == ".bvz" then
		myTempName= myRandomTempName
		System.Unzip( filename, myTempName)
		filename = myTempName
	end

	World.OpenAccess(myWorld)
	World.EraseRemoteVisuals()
	update_rate, time = World.OpenVisualInput(filename)
	World.CloseAccess()
	Agent.SendMessage("Destroy", alert)
	
	if update_rate == false then
		Agent.Create("Alert", "This video file is an incompatible version ( v"..time.." )", nil, nil, 400)
		return
	end
	if myHasGUI then
		local time = World.SeekVisual(0)
		GUI.SetHelpText( Segment.time_slider, "t="..String.format( "%.2f", time ) )
		GUI.SetValue( Segment.time_slider, 0 )
	end

	
	if time == false then 
		MessageStop()
	else
		timeStamp = time
	end

end


function MessageStart()

	Agent.SetTimer("Update", Agent.Me(), "readvis", 0.02)
	myPlaying = 1

	local screenWidth, screenHeight = GUI.Area()
	GUI.SetParent(myUIParent)
	AddButton( "start_button", 4, 2, "Pause", "Pause" )

end

function MessagePause()

	Agent.StopTimer(Agent.Me(), "readvis")
	myPlaying = false

	GUI.SetParent(myUIParent)
	AddButton( "start_button", 4, 2, "ArrowRight", "Play" )

end


function MessageStop()

	MessagePause()

	Agent.Create("Options", { "Replay", "Choose Video", "Quit" }, 100, Agent.Me(), "FinishMenu" )

end

function MessageFinishMenu(option)
	myMenuShowing = nil
	if option == 1 then
		-- replay
		MessageSeek(0)
		MessageStart()
	elseif option == 2 then
		-- quit
		MessageSelectFile()
	elseif option == 3 then
		-- quit
		SystemOnExit()
	end
end

function MessagePauseMenu(option)
	myMenuShowing = nil
	if option == 1 then
		-- resume
		MessageStart()
	elseif option == 2 then
		-- replay
		MessageSeek(0)
		MessageStart()
	elseif option == 3 then
		MessageSelectFile()
	elseif option == 4 then
		-- quit
		SystemOnExit()
	end
end

function MessageSeek(p)

	World.OpenAccess(myWorld)

		World.StartProfile(profileId)
		local time = World.SeekVisual(p)
		World.StopProfile(profileId)
		if myHasGUI then
			GUI.SetHelpText( Segment.time_slider, "t="..String.format( "%.2f", time ) )
			--GUI.SetText( Segment.sim_time, "Sim Time: " .. time )
		end

	World.CloseAccess()
	return time

end

function TimerUpdate()
	
	if myShuttling ~= nil then return end
	
	if World.IsValid(myWorld)  then

		World.OpenAccess(myWorld)

			World.StartProfile(profileId)
			local time = World.ReadVisual(speed)
			World.StopProfile(profileId)

		World.CloseAccess()
		if time < 0  then 
			if loop == false then
				MessageStop()
			elseif time == -1 then
				MessageSeek(0)
			elseif time == -2 then
				MessageSeek(1)
			end
		elseif myHasGUI then
			timeStamp = time
			local timeFraction = World.VisualInputPosition()
			GUI.SetValue( Segment.time_slider, timeFraction )
		end
		
		if myHasGUI then
			--GUI.SetText( Segment.sim_time, "Sim Time: " .. time )
			GUI.SetHelpText( Segment.time_slider, "t="..String.format( "%.2f", time ) )
		end
		Agent.SendMessage( "Update", myCountdown, time )
	else
		MessageStop()
		myWorld = nil
	end

end

function CreateUI()
	local screenWidth, screenHeight = GUI.Area()

	local height = 32

	local left = 0
	local top = screenHeight - height
	local right = screenWidth
	local bottom = screenHeight

	GUI.SetParent()
	myUIParent = GUI.CreateObject( "parent", 0, screenHeight - 32, screenWidth, screenHeight, false )

	AddPanel( 0,0, right, 32, false, false, false, false,  Segment.parent,  Segment.parent )
	GUI.SetParent(Segment.parent)

	local x = 4
	if myPlaying then
		AddButton( "start_button", x, 2, "Pause", "Pause" )
	else
		AddButton( "start_button", x, 2, "ArrowRight", "Start" )
	end
	x = x + 32
	AddButton( "stop_button", x, 2, "Eject", "Stop" )
	x = x + 36
	GUI.CreateSlider( "time_slider", x, 8, right - 80, 28 )
	x = right - 72
	AddButton( "loop", x, 8, "check", "Loop" )
	x = x +24
	GUI.CreateText( "looplabel", "Loop", x, 8, 0, 0, "Fonts/edit.met" )


	GUI.SetParent()
	myHasGUI = 1
end

function SystemUIResize( segment )
	if segment == Segment.resizer then
		MessageResize()
		--Agent.PostMessage( "Resize", Agent.Me(), 0.2 )
	end
end

function MessageResize()
	CreateUI()
	Agent.SendMessage( "Resize", myCountdown )
end

function SystemUIChange( segment )
	if segment == Segment.start_button then
		if myPlaying then
			MessagePause()
		else
			MessageStart()
		end
	elseif segment == Segment.stop_button then
		MessagePause()
		Agent.Create("Options", { "Resume", "Restart", "Choose Video", "Quit" }, 100, Agent.Me(), "PauseMenu" )
	elseif segment == Segment.loop then
		loop = not loop
		GUI.SetButtonPushed( segment, loop )
	elseif segment == Segment.time_slider then
		myShuttling = 1
		local time = MessageSeek( GUI.GetValue( Segment.time_slider ) )
		Agent.SendMessage( "Update", myCountdown, time )
	elseif segment == Segment.set_speed_button then
		speed = tonumber( GUI.GetText( Segment.time_multiplier ) )
	end
end

function SystemUIMouseLUp(segment)
	if segment == Segment.time_slider then
		myShuttling = nil
	end
end

function SystemKeyDown(key)
	local controlDown = Input.IsKeyDown(Input.KEY_LCONTROL) or Input.IsKeyDown(Input.KEY_RCONTROL)
	local shiftDown = Input.IsKeyDown(Input.KEY_LSHIFT) or Input.IsKeyDown(Input.KEY_RSHIFT)

	if key == Input.KEY_G  and not controlDown and not shiftDown then
		MessageStart()
	end

	if key == Input.KEY_ESCAPE  and not controlDown and not shiftDown then
		MessagePause()
		Agent.Create("Options", { "Resume", "Restart", "Choose Video", "Quit" }, 100, Agent.Me(), "PauseMenu" )
	end

end
	
function MessageDestroy()
	Agent.Destroy()
end
	