# FloorManager specializes Agent embeds Visual, Input, GUI, Camera

function Initialize(w)
	myWorld = w
	Input.RegisterKey(Input.KEY_F)
	myFloorMoving = false
end

constDepth = 25

function SystemKeyDown(key)

	local controlDown = Input.IsKeyDown(Input.KEY_LCONTROL) or Input.IsKeyDown(Input.KEY_RCONTROL)

	if key == Input.KEY_F then
		World.OpenAccess( myWorld )
			Camera.Create(0,0,1,1)
			Camera.Show( false )
			if controlDown then
				myFloorMoving = 1
			else
				myFloorMoving = 2
			end
			myStartTime = World.SimTime()
		World.CloseAccess()
	end
end

function MessageDestroy()
	Agent.Destroy()
end

function SystemCamera( frametime )
	if myFloorMoving then
		World.OpenAccess( myWorld )
			local time = ( World.SimTime() - myStartTime ) * 0.5
		World.CloseAccess()
		if time > 1 then
			time = 1
		end
		local t = 0.5 - Number.cos( time*180 ) / 2
		if myFloorMoving == 1 then -- moving up
			height = -constDepth * (1-t)
		else -- moving down
			height = -constDepth * t
		end
		World.SetVisualGroupOffset( 512, Vector.New( 0, height, 0 ) )
		if time == 1 then
			myFloorMoving = false
		end
	end
end

