# SplitCamera specializes Agent embeds Camera, Visual

function Initialize( x1, y1, x2, y2 )
	myAnamorphic = Config.Get("anamorphic", false )
	Camera.Create( x1, y1, x2, y2 )
	myOffset = Vector.New( 2.5, 5, 10 )
	myTarget = Vector.New( 0, 0, 0 )

	myVerticalViewAngle = 45
	myRecordingImages = false
	Camera.SetClipPlanes( 1, 400 )
	SetSize( x2 - x1, y2 - y1 )
	Camera.SetBackground( .8, .8, .8, 1 )
	myTargetHeight = 0
	myRecordingPositions = false
	myRecordedPositions = {}

end

function MessageShow( show )
	Camera.Show( show )
end

function SystemCamera( frametime )
	if myRecordingImages then
		Camera.SaveAsJpeg( "Movies/Tmp"..myRecordingImages..".png" )
		myRecordingImages = myRecordingImages + 1
	end

	UpdateView()

	if myRecordingPositions then
		local frame = Number.floor( World.SimTime() * Config.Get("video_resolution", 25 ) )
		myRecordedPositions[frame] = {Camera.GetTransform(), myVerticalViewAngle}
	end
end

function UpdateView()
	if myZook == -1 then
	elseif myZook ~= 0 then
		myTarget = Visual.GetRootPosition( myZook )
	else
		local pos1, pos2 = Visual.GetRootPosition( 1 ), Visual.GetRootPosition( 5 )
		myTarget = 0.5 * ( pos1 + pos2 )
		local pos = myTarget + myOffset
		local normOffset = Vector.Normalise( myOffset )
		local off1 = Vector.Normalise( pos - pos1 )
		local off2 = Vector.Normalise( pos - pos2 )
		local dot1 = Vector.Dot( off1, normOffset )
		local dot2 = Vector.Dot( off2, normOffset )
		if dot2 < dot1 then dot1 = dot2 end
		--Trace( "off1 % off2 % offset % Dot %", off1, off2, normOffset, dot1 )
		SetViewAngle( Number.abs( Number.acos( dot1 ) * 2.1 ) )
	end

	local x, y, z = Vector.GetXYZ( myTarget )
	myTargetHeight = myTargetHeight * 0.99 + y * 0.01
	myTarget = Vector.New( x, myTargetHeight, z )
	local pos = myTarget + myOffset
	Camera.SetPosition( pos )
	Camera.SetTarget( myTarget, Vector.New( 0, 1, 0 ) )
end

function MessageSetView( view )
	myZook = view.zook
	myOffset = view.offset
	myTarget = view.target
	myVerticalViewAngle = view.verticalViewAngle
	myTargetHeight = view.targetHeight
	SetViewAngles()
end

function MessageGetView()
	return { zook = myZook, offset = myOffset, target = myTarget,  verticalViewAngle = myVerticalViewAngle, targetHeight = myTargetHeight}
end

function MessageResize( x1, y1, x2, y2 )
	Camera.Resize( x1, y1, x2, y2 )
	SetSize( x2 - x1, y2 - y1 )
end

function SetSize( width, height )
	myWidth = width
	myHeight = height
	SetViewAngles()
end

function SetViewAngle( angle )
	if angle < 10 then angle = 10 end
	--Trace( "View angle %", angle )
	myVerticalViewAngle = angle
	SetViewAngles()
end

function SetViewAngles()
	local width = myWidth
	if myAnamorphic then
		width = myWidth * ( (16 / 9) / (4 / 3) )
	end
	local horizontalViewAngle = 2 * Number.atan( ( width / myHeight ) * Number.tan( myVerticalViewAngle / 2.0 ) )
	Camera.SetViewAngles( horizontalViewAngle, myVerticalViewAngle )
end	

function MessageSaveScreen()
	myRecordingImages = 1
end

function MessageRecordPositions( rec )
	myRecordingPositions = rec
end

function MessageSavePositions( filename )
	System.WriteTable( filename, myRecordedPositions )
end

function MessageGetPositions()
	return myRecordedPositions
end

function MessageGetPosition()
	UpdateView()
	return {Camera.GetTransform(), myVerticalViewAngle}
end

