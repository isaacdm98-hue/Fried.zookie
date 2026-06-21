# Lap specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()
	

	local contestobject_red = 158/255 
	local contestobject_green = 157/255 
	local contestobject_blue = 157/255 
	
	agents = {}
	
	params = { 
		shape = "cube", 
		movable = false, 
		rotation = Quatn.New(Vector.New(1,0,0), 0), 
		red = 1, 
		green = 1, 
		blue = 1, 
		visible = 1, 
		texture = "Agents/World/Target/plasterlores",
		solid = false,
		shadow = false
		}
	params.position = Vector.New(30, 0, -10.5)
	params.scale = Vector.New(20,0.05,19)
	agents[1] = Agent.Create("Target",  params )
	params.position = Vector.New(0, 0, -30)
	params.scale = Vector.New(80,0.05,20)
	agents[2] = Agent.Create("Target",  params )
	params.position = Vector.New(-30, 0, 0)
	params.scale = Vector.New(20,0.05,40)
	agents[3] = Agent.Create("Target",  params )
	params.position = Vector.New(0, 0, 30)
	params.scale = Vector.New(80,0.05,20)
	agents[4] = Agent.Create("Target",  params )
	params.position = Vector.New(30, 0, 10.5)
	params.scale = Vector.New(20,0.05,19)
	agents[5] = Agent.Create("Target",  params )

	params.shape = "capsule"
	params.texture = "Agents/World/Target/redcheck"
	params.solid = 1
	
	params.position = Vector.New(19, -1, 0)
	params.scale = Vector.New(2,0,38)
	agents[6] = Agent.Create("Target",  params )
	params.position = Vector.New(0, -1, -19)
	params.scale = Vector.New(2,0,38)
	params.eulers = Vector.New(0,90,0)
	agents[7] = Agent.Create("Target",  params )
	params.position = Vector.New(-19, -1, 0)
	params.scale = Vector.New(2,0,38)
	params.eulers = Vector.New(0,0,0)
	agents[8] = Agent.Create("Target",  params )
	params.position = Vector.New(0, -1, 19)
	params.scale = Vector.New(2,0,38)
	params.eulers = Vector.New(0,90,0)
	agents[9] = Agent.Create("Target",  params )

	params.scale = Vector.New( 20, 10, 2 )
	params.position = Vector.New( 30,0,0 )
	params.solid = false
	params.shape = "cube"
	params.eulers = Vector.New(0,0,0)
	params.visible = false
	agents[10] = Agent.Create("Target", params )

	params.scale = Vector.New( 2, 2, 2 )
	params.position = Vector.New( 30,0,-30 )
	params.solid = false
	params.shape = "sphere"
	params.eulers = Vector.New(0,0,0)
	params.visible = false
	params.red = 1
	params.green = 0
	params.blue = 0
	agents[11] = Agent.Create("Target", params )

	target = Config.Get("BuilderTarget", Agent.Null())
	myOldTargetSolidity = Config.Get("target_nonsolid", false)
	Config.Set("target_nonsolid", 1)
	
	myTargetPositions = {Vector.New( 30,0,-30), Vector.New( -30,0,-30), Vector.New( -30,0,30), Vector.New( 30,0,30), Vector.New( 30,0,-30) }
	myCurrentTarget = 1
	Agent.SendMessage("MoveTo", target, myTargetPositions[ myCurrentTarget ])
	myLastHitTime = World.SimTime()
	myFinished = false

end

function MessageGo()
	Agent.PostMessage( "TimeOut", Agent.Me(), 60.05 )
end

function Finalize()
	
	Config.Set("target_nonsolid", myOldTargetSolidity)
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
	creature = agent
	reportMessage = message
	reportTo = Agent.From()
	--Agent.SendMessage("AddCallback", target, { agent = agent, receiver = Agent.Me(), message = "TargetCallback" })
	Agent.SendMessage("AddCallback", agents[11], { agent = agent, receiver = Agent.Me(), message = "TargetCallback" })
end

function MessageTargetCallback(data)
	if World.SimTime() - myLastHitTime > 0.5 then
		myLastHitTime = World.SimTime()
		Agent.PostMessage( "Next", Agent.Me(), 0 )
	end
end

function MessageTargetCallbackFinish(data)
	Agent.PostMessage( "Finish", Agent.Me(), 0 )
end

function MessageNext()
	--Agent.SendMessage("RemoveCallback", target, { agent = creature, receiver = Agent.Me(), message = "TargetCallback" })
	Agent.SendMessage("RemoveCallback", agents[11], { agent = creature, receiver = Agent.Me(), message = "TargetCallback" })
	myCurrentTarget = myCurrentTarget + 1
	Agent.SendMessage("MoveTo", target, myTargetPositions[ myCurrentTarget ] )
	Agent.SendMessage("SetPosition",  agents[11], {position = myTargetPositions[ myCurrentTarget ] } )
	if myCurrentTarget > 4 then
		Agent.SendMessage("AddCallback", agents[10], { agent = creature, receiver = Agent.Me(), message = "TargetCallbackFinish" })
	else
		--Agent.SendMessage("AddCallback", target, { agent = creature, receiver = Agent.Me(), message = "TargetCallback" })
		Agent.SendMessage("AddCallback", agents[11], { agent = creature, receiver = Agent.Me(), message = "TargetCallback" })
	end
end

function MessageFinish()
	if not myFinished then
		myFinished = 1
		Agent.SendMessage("RemoveCallback", agents[10], { agent = creature, receiver = Agent.Me(), message = "TargetCallbackFinish" })
		Config.Set("target_nonsolid", false)
		local result = Agent.SendMessage(reportMessage, reportTo)
		Agent.SendMessage("AddDetail", reportTo, "Achievement", "Trial: Lap", String.format( "%4.1f", result), "sec", {"PHYSICAL_MOD", "DYNAMIC_MOD"})
	end
end

function MessageTimeOut()
	if not myFinished then
		myFinished = 1
		Config.Set("target_nonsolid", false)
		local result = Agent.SendMessage(reportMessage, reportTo)
		Agent.SendMessage("AddDetail", reportTo, "Achievement", "Trial: Lap", String.format( "%4.1f", result), "sec", {"PHYSICAL_MOD", "DYNAMIC_MOD"})
		Trace( "Finished" )
	end
end

function MessageStartPosition()
	return Vector.New( 30, 0, 0 )
end

function MessageCountdown()
	return 1
end
	