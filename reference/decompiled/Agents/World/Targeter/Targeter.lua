# Targeter specializes Agent embeds Visual, Input

function Initialize()

	MaxSpeed = 1.0
	myTarget = nil
	mySegment = nil

	myPosition = Vector.New(0,-10,0)
	local ownerPos = Agent.SendMessage("Position", Agent.From())
	if Vector.TypeCheck(ownerPos, 1) == 1 then
		myPosition = myPosition + ownerPos
	end
		
	
	Agent.SetTimer("Update", Agent.Me(), "update",0.1 )
	
	--Visual.Create("indicator", "UnitCube BB", myPosition, Quatn.New(), Vector.New(1,1,1), 1)
	Visual.Create("indicator", 1, myPosition, Quatn.New(), Vector.New(1,1,1), 1)
	Visual.SetVisible(Segment.indicator, false)
	
end


function TimerUpdate()

	SetTargetDestinaton() -- in case the target has moved. 
	
end
	

function SetTargetDestinaton()
	
	if myTarget ~= nil and mySegment ~= nil then
		local targpos = Agent.SendMessage("SegmentPosition", myTarget, mySegment)
		--Trace("target %, %, %", myTarget, mySegment, targpos)
		if Vector.TypeCheck(targpos,1) == 1 then 
			myPosition	=targpos
			Visual.MoveTo(Segment.indicator, myPosition)
			return
		else
			-- not selectable
			myTarget = nil
			mySegment = nil
		end
	end	
	
end


function MessagePosition()
	return myPosition
end


function MessageSetTarget(data)
	if Equals(data.target, Agent.Me()) ~=1 then
		--Trace("target %", data.target)
		myTarget = data.target
		mySegment = data.segment
		
		SetTargetDestinaton()
	end
end

