# Hurdles specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()
	

	local contestobject_red = 158/255 
	local contestobject_green = 157/255 
	local contestobject_blue = 157/255 
	
	agents = {}
	
	local nBlocks = 4
	local nSubBlocks = 5
	
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
		texture = "Agents/World/Target/plasterlowres",
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
		texture = "Agents/World/Target/plasterlowres",
		solid = false,
		shadow = false
		} )

	local height = 1
	
	--~ for block = 1,nBlocks do
		--~ for subBlock = 1, nSubBlocks do
			--~ agents[2 + (block-1)*nSubBlocks + subBlock] = Agent.Create("Target", { 
				--~ shape = "wedge", 
				--~ movable = false, 
				--~ position = Vector.New((subBlock-nSubBlocks/2)*4, 0, 30 - block * 10), 
				--~ rotation = Quatn.New(Vector.New(0,1,0), 90), 
				--~ eulers = Vector.New(0,180,0),
				--~ scale = Vector.New(4,height,4), 
				--~ red =  contestobject_red, 
				--~ green = contestobject_red,
				--~ blue = contestobject_red, 
				--~ visible = 1, 
				--~ texture = "Agents/World/Target/plasterlowres",
				--~ mass = 1.3,
				--~ solid = 1,
				--~ shadow = 1
				--~ } )
		--~ end
	--~ end
	
	for block = 1, nBlocks do
		agents[2 + block] = Agent.Create("FixedSplitCube", { 
				movable = false, 
				position = Vector.New(0, 0, 10 - block * 10), 
				--~ rotation = Quatn.New(Vector.New(0,1,0), 90), 
				eulers = Vector.New(20 * block / nBlocks,0,0),
				scale = Vector.New(80,height * block / nBlocks,4), 
				red =  1, 
				green = 1,
				blue = 1, 
				visible = 1, 
				texture = "Agents/World/Target/plasterlowres",
				mass = 1.3,
				solid = 1,
				shadow = 1
				} )
	end

	local target = Config.Get("BuilderTarget", Agent.Null())
	Agent.SendMessage("MoveTo", target, Vector.New(0,0,-100))

	finishTarget = agents[2]
	myFinished = false
end


function Finalize()
	
	for index, value in agents do
		Agent.SendMessage("Destroy", value)
	end
end

function MessageGo()
	Agent.PostMessage( "TimeOut", Agent.Me(), 20.05 )
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
	Trace( "Set call-back %", Agent.Me())
end

function MessageTargetCallback(data)
	if not myFinished then
		myFinished = 1
		local target = Agent.From()
		local result = Agent.SendMessage(reportMessage, reportTo)
		Agent.SendMessage("AddDetail", reportTo, "Achievement", "Trial: Hurdles", String.format( "%4.1f", (70*4)/result), "cm/sec", {"PHYSICAL_MOD", "DYNAMIC_MOD"})
		Agent.SendMessage("RemoveCallback", finishTarget, data.message)
		Trace( "Finished" )
	end
end

function MessageTimeOut()
	if not myFinished then
		myFinished = 1
		local pos = Agent.SendMessage( "GetPosition", myCreature )
		local dist = Vector.GetZ( MessageStartPosition() ) - Vector.GetZ( pos )
		local result = Agent.SendMessage(reportMessage, reportTo)
		Agent.SendMessage("AddDetail", reportTo, "Achievement", "Trial: Hurdles", String.format( "%4.1f", (dist*4)/result), "cm/sec", {"PHYSICAL_MOD", "DYNAMIC_MOD"})
		Trace( "Finished" )
	end
end

function MessageStartPosition()
	return Vector.New( 0, 0, 20 )
end

function MessageCountdown()
	return 1
end
