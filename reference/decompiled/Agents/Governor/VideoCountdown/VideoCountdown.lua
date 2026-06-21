# VideoCountdown specializes Agent embeds GUI, Camera

function Initialize( notify )
	myNotify = notify
	local width, height =GUI.Area()
	--GUI.CreateObject( "resizer", 0, 0, width, height )
	local x1 = width/2 - 100
	local x2 = width/2 + 100
	local y1 = height/2 - 100
	local y2 = height/2 + 100
	GUI.CreatePicture( "count", "./Agents/Governor/Countdown/Count", x1, y1, x2, y2, 0,0,0,0 )
end

function MessageUpdate(time)
	time = time - 1
	if time > 4 or time < 0 then
		GUI.Retexture( Segment.count, "./Agents/Governor/Countdown/Count", 0,0,0,0 )
	else
		local floor = Number.floor( time )
		GUI.Retexture( Segment.count, "./Agents/Governor/Countdown/Count", floor*0.25, 0, (floor+1) *0.25, 1 )
		GUI.SetColour( Segment.count, 1, 1, 1, 1 + floor - time )
	end
end

--~ function SystemUIResize( segment )
	--~ if segment == Segment.count then
		--~ Agent.PostMessage( "Resize", Agent.Me(), 0.2 )
	--~ end
--~ end
	
function MessageResize()
	local width, height =GUI.Area()
	local x1 = width/2 - 100
	local x2 = width/2 + 100
	local y1 = height/2 - 100
	local y2 = height/2 + 100
	GUI.Resize( Segment.count, x1, y1, x2, y2 )
end

function MessageSize( width, height )
	local x1 = width/2 - 100
	local x2 = width/2 + 100
	local y1 = height/2 - 100
	local y2 = height/2 + 100
	GUI.Resize( Segment.count, x1, y1, x2, y2 )
end

function MessageDestroy()
	Agent.Destroy()
end
