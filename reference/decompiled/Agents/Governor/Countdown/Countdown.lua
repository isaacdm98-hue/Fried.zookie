# Countdown specializes Agent embeds GUI, Camera

function Initialize( notify )
	myNotify = notify
	local width, height =GUI.Area()
	local x1 = width/2 - 100
	local x2 = width/2 + 100
	local y1 = height/2 - 100
	local y2 = height/2 + 100
	GUI.CreatePicture( "count", "./Agents/Governor/Countdown/Count", x1, y1, x2, y2 )
	myTime = 0
	myStartTime = System.RealTime()
	myDying = false
	--MessageNext()
	myUseSimTime = false
	Camera.Create( 0,0,1,1)
end

function MessageUseSimTime( world )
	myWorld = world
	World.OpenAccess( myWorld )
	myStartTime = World.SimTime()
	World.CloseAccess()
	myUseSimTime = 1
end

function SystemCamera(frametime)
	if not myDying then
		local time
		if myUseSimTime then
			World.OpenAccess( myWorld )
			time = World.SimTime() - myStartTime
			World.CloseAccess()
		else
			time = System.RealTime() - myStartTime
		end
		if time > myTime then
			if myTime == 4 then
				myDying = 1
				Agent.PostMessage( "Destroy", Agent.Me(), 0 )
				return
			else
				if myTime == 3 then
					Agent.PostMessage( "Start", Agent.Me(), 0 )
				end
				GUI.Retexture( Segment.count, "./Agents/Governor/Countdown/Count", myTime*0.25, 0, (myTime+1) *0.25, 1 )
			end
			myTime = myTime + 1
		end
		GUI.SetColour( Segment.count, 1, 1, 1, 1 + myTime - time )
	end
end

function MessageStart()
	Agent.SendMessage( "CountFinished", myNotify )
end

function MessageDestroy()
	Agent.Destroy()
end


function MessageNext()
	if myTime == 4 then
		Agent.Destroy()
	else
		GUI.Retexture( Segment.count, "./Agents/Governor/Countdown/Count", myTime*0.25, 0, (myTime+1) *0.25, 1 )
		Agent.PostMessage( "Next", Agent.Me(), 1 )
		myTime = myTime + 1
	end
end
	