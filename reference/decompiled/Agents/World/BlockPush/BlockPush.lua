# BlockPush specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()
	

	local contestobject_red = 158/255 
	local contestobject_green = 157/255 
	local contestobject_blue = 157/255 
	
	agents = {}
	
	
	for block = 1,10 do
		agents[block] = Agent.Create("Target", { 
			shape = "cube", 
			movable = 1, 
			position = Vector.New(0, 0, -10 - block * 5), 
			--~ rotation = Quatn.New(Vector.New(0,1,0), 90), 
			eulers = Vector.New(0,0,0),
			scale = Vector.New(10,8,2), 
			red =  contestobject_red, 
			green = contestobject_red,
			blue = contestobject_red, 
			visible = 1, 
			texture = "Agents/World/Target/plaster",
			mass = 1.3,
			solid = 1,
			shadow = 1,
			prismatic = Vector.New( 0, 0, 1 )
			} )
	end

	local target = Config.Get("BuilderTarget", Agent.Null())
	Agent.SendMessage("MoveTo", target, Vector.New(0,0,-10000))

end

function MessageGo()
	Agent.PostMessage( "Finish", Agent.Me(), 13.05 )
end



function Finalize()
	
	for index, value in agents do
		Agent.SendMessage("Destroy", value)
	end
end


function MessageShow( visible )
	--~ Visual.SetVisible( Segment.wall1, visible )
	--~ Visual.SetVisible( Segment.wall2, visible )
	--~ Visual.SetVisible( Segment.wall3, visible )
	--~ Visual.SetVisible( Segment.wall4, visible )
	MessageEnv__Show(visible)
end

function MessageDestroy()
	Agent.Destroy()
end


function MessageReportEvent(agent, message)
	reportTo = Agent.From()
end

function MessageFinish()
	local target = Agent.From()
	local endPos = Agent.SendMessage( "GetPosition", agents[1] )
	local result = -Vector.GetZ( endPos ) - 15
	Agent.SendMessage("AddDetail", reportTo, "Achievement", "Trial: Block Push", String.format( "%4.1f", result), "cm", {"PHYSICAL_MOD", "DYNAMIC_MOD"})
end

function MessageCountdown()
	return 1
end
