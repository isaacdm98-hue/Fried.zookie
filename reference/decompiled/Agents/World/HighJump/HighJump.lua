# HighJump specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()
	

	local contestobject_red = 158/255 
	local contestobject_green = 157/255 
	local contestobject_blue = 157/255 
	
	agents = {}
	
	local target = Config.Get("BuilderTarget", Agent.Null())
	Agent.SendMessage("MoveTo", target, Vector.New(0,0,-80))

	Agent.SetTimer("MeasureHeight", Agent.Me(), "measureheight", 0.1)
	myMaxHeight = 0
end

function MessageGo()
	Agent.PostMessage( "Finish", Agent.Me(), 10.05 )
end


function TimerMeasureHeight()
	local y = Agent.SendMessage( "LowestPoint", myCreature )
	if y > myMaxHeight then
		myMaxHeight = y
	end
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
	reportTo = Agent.From()
end

function MessageFinish()
	local result = myMaxHeight
	if result < 0 then result = 0 end
	Agent.StopTimer( Agent.Me(), "measureheight" )
	Agent.SendMessage("AddDetail", reportTo, "Achievement", "Trial: High Jump", String.format( "%4.1f", result), "cm", {"PHYSICAL_MOD", "DYNAMIC_MOD"})
end

function MessageCountdown()
	return 1
end
