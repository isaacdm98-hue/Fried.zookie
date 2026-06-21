# GlobalKeys specializes Agent embeds Input

function Initialize(world)

	Input.RegisterKey(Input.KEY_W)
	Input.RegisterKey(Input.KEY_V)
	Input.RegisterKey(Input.KEY_P)
	Input.RegisterKey(Input.KEY_M)
	Input.RegisterKey(Input.KEY_K)
	Input.RegisterKey(Input.KEY_I)
	Input.RegisterKey(Input.KEY_S)
	Input.RegisterKey(Input.KEY_B)
	Input.RegisterKey(Input.KEY_R)
	--~ Input.RegisterKey(Input.KEY_C)

	myWorld = world
	myShowBackground = 1
end

function ToggleConfig(name)
	val = Config.Get(name, false) 
	if val then
		Config.Set(name, 0)
	else
		Config.Set(name, 1)
	end
end

function SystemKeyDown(key)

	local controlDown = Input.IsKeyDown(Input.KEY_LCONTROL) or Input.IsKeyDown(Input.KEY_RCONTROL)
	local shiftDown = Input.IsKeyDown(Input.KEY_LSHIFT) or Input.IsKeyDown(Input.KEY_RSHIFT)
	
	if key == Input.KEY_W and controlDown then
		ToggleConfig("wireframe")
	end

	if key == Input.KEY_V and controlDown then
		--ToggleConfig("vertex_colours_disable")
		ToggleConfig("v_sync")
	end

	if key == Input.KEY_I and controlDown and Config.Get( "allow_show_invisible", false ) then
		ToggleConfig("show_invisible")
	end
	
	if key == Input.KEY_S and controlDown then
		ToggleConfig("show_shadows")
	end
	
	if key == Input.KEY_R and controlDown then
		ToggleConfig("show_bumps")
	end
	
	
	if key == Input.KEY_M and shiftDown and controlDown then
		ToggleConfig("monitor_socket") 
		ToggleConfig("agent_monitor")
		ToggleConfig("agent_trace")
	end

	if key == Input.KEY_P then
	
		if controlDown and shiftDown then
			ToggleConfig("performance_socket") 
		elseif controlDown then
			ToggleConfig("performance_bars")
		else -- just P
			--~ if (World.IsPaused(myWorld)) then
				--~ World.Resume(myWorld)
			--~ else
				--~ World.Pause(myWorld)
			--~ end
		end
	end
	
	if key == Input.KEY_B and controlDown then
		World.OpenAccess( myWorld )
		myEnvirons = Config.Get("theLand", Agent.Null())
		if Agent.IsValid(myEnvirons) == 1 then
			local camera = Config.Get("theCamera",Agent.Null())	
			myShowBackground = not myShowBackground			
			Agent.SendMessage( "Show", myEnvirons, myShowBackground )
			Agent.SendMessage("ShowBackground", camera, myShowBackground)
		end
		World.CloseAccess()
	end
	
	if key == Input.KEY_K then
		if controlDown then
			ToggleConfig("physics_lines")
		end
	end
end


function SystemTurned(rot)
	
	Trace("**** WOO HOO turned to %", rot)
	
end

-- Not much use until we work out a way of passing world in
--~ function StaticInject()
	--~ Agent.Create("GlobalKeys")
--~ end
