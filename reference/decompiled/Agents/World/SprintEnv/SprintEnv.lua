# SprintEnv specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()
	

	local contestobject_red = 158/255 
	local contestobject_green = 157/255 
	local contestobject_blue = 157/255 
	
	agents = {}
	
	
	agents[1] = Agent.Create("Target", { 
		shape = "cube", 
		movable = false, 
		position = Vector.New(0, 0.1, -50)-Vector.New(0,0.025,0), 
		rotation = Quatn.New(Vector.New(1,0,0), 0), 
		scale = Vector.New(60,0.05,1), 
		red = contestobject_red, 
		green = contestobject_green, 
		blue = contestobject_blue, 
		visible = 1, 
		texture = "Agents/World/Target/plaster",
		solid = false,
		shadow = 1
		} )

	agents[2] = Agent.Create("Target", { 
		shape = "cube", 
		movable = false, 
		position = Vector.New(0, 0.2, -55), 
		rotation = Quatn.New(Vector.New(1,0,0), 0), 
		scale = Vector.New(60,10,11), 
		red = contestobject_red, 
		green = contestobject_green, 
		blue = contestobject_blue, 
		visible = false, 
		texture = "Agents/World/Target/plaster",
		solid = false,
		shadow = false
		} )

	local target = Config.Get("BuilderTarget", Agent.Null())
	Agent.SendMessage("MoveTo", target, Vector.New(0,0,-60))

	finishTarget = agents[2]
	myFinished = false
end

function MessageGo()
	Agent.PostMessage( "TimeOut", Agent.Me(), 20.05 )
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
	myCreature = agent
	reportMessage = message
	reportTo = Agent.From()
	Agent.SendMessage("AddCallback", finishTarget, { agent = agent, receiver = Agent.Me(), message = "TargetCallback" })
end

function MessageTargetCallback(data)
	if not myFinished then
		myFinished = 1
		local target = Agent.From()
		local result = Agent.SendMessage(reportMessage, reportTo)
		Agent.SendMessage("AddDetail", reportTo, "Achievement", "Trial: Sprint", String.format( "%4.1f", (50*4)/result), "cm/sec", {"PHYSICAL_MOD", "DYNAMIC_MOD"})
		Agent.SendMessage("SetSprintSpeed", reportTo, result) -- version 1 zook kit only
		Agent.SendMessage("RemoveCallback", finishTarget, data.message)
	end
end

function MessageTimeOut()
	if not myFinished then
		myFinished = 1
		local pos = Agent.SendMessage( "GetPosition", myCreature )
		local dist = -Vector.GetZ( pos )
		local result = Agent.SendMessage(reportMessage, reportTo)
		Agent.SendMessage("AddDetail", reportTo, "Achievement", "Trial: Sprint", String.format( "%4.1f", (dist*4)/result), "cm/sec", {"PHYSICAL_MOD", "DYNAMIC_MOD"})
		Trace( "Finished" )
	end
end


function MessageCountdown()
	return 1
end

