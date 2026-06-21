# Camera specializes BaseCamera embeds GUI


-- camera only operates if space is toggled on

function StaticInject()
	Agent.Create("Camera", Vector.New(171.25, 44.58, 86.13), Quatn.New(Vector.New(0, 1, 0), Number.deg(0.6)), 0, 0, 800, 600)
end

function Initialize(pos, rot, x1, y1, x2, y2)

	RegisterKeys()
	Input.RegisterKey(Input.KEY_MOUSE1)
	Input.RegisterMouse()

	myPanChange = 0
	myTiltChange = 0
	myRollChange = 0
	myRestrictingAngles = false

	local pan_rad
	local tilt_rad
	pan_rad, tilt_rad = CalcHeading(rot)
	myPan = Number.deg(pan_rad)
	myTilt = Number.deg(tilt_rad)
	myRoll = 0


	restrictTilt = 90	-- i.e 90 up and 90 down
	restrictPan = 180	-- i.e full all the way round
	restrictRoll = 90	

	myMouseSensitivity = 0.002

	MessageSetScale(1,1,1,1,1,1)
	MessageSetUserControlledAxes(1, 1, false)
	
end


function SystemCamera(frameTime)
--	Trace("t %, tc %", myTilt, myTiltChange)
	myPan = RestrictAngle( myPan + myPanChange, restrictPan )
	myTilt = RestrictAngle( myTilt + myTiltChange, restrictTilt )
	myRoll = RestrictAngle( myRoll + myRollChange, restrictRoll )

	myRotation =  
		Quatn.New( Vector.New( 1, 0, 0 ), myTilt ) *
		Quatn.New( Vector.New( 0, 1, 0 ), myPan ) *
		Quatn.New( Vector.New( 0, 0, 1 ), myRoll )

	myPosition = myPosition + CalcInputMovement(frameTime, myRotation)

	Camera.Set(myPosition, myRotation)

	myPanChange = 0
	myTiltChange = 0
	myRollChange = 0

end


function SystemMouse(x, y, wheel)

	-- sets pan and tilt changes and scales them

	-- dont allow move response if keys are pressed (may be drag and drop etc
	if space == 1 then
		if mouse == 0 then 
--			Trace("mouse0")
			if panUser == 1 then
--				Trace("pan user %  %",myMouseSensitivity, panScale)
				local pan = - Number.deg(x * myMouseSensitivity) * panScale
				myPanChange = RestrictAngle( myPanChange + pan, restrictPan )
			end
			if tiltUser == 1 then
				local tilt = Number.deg(y * myMouseSensitivity) * tiltScale
				myTiltChange = RestrictAngle( myTiltChange + tilt, restrictTilt )
			end
		elseif mouse1 == 1 and rollUser == 1 then
			local roll = - Number.deg(x * myMouseSensitivity) * rollScale
			myRollChange = RestrictAngle( myRollChange + roll, restrictRoll )
		end
	end
--	Trace("Camera Mouse Change pan %, tilt %, roll %", myPanChange, myTiltChange, myRollChange)

end


function CalcInputMovement(frameTime, rotation)
	
	-- cancs movement from input and scales it

	local total_movement = Vector.New()

	if space == 1 then 

		local forwards = Vector.New( 0, 0, 1 ) * rotation
		local rightwards = Vector.New( -1, 0, 0 ) * rotation
		local upwards = Vector.New(0,1,0)

		local rate = frameTime * 10
		if shift == 1 then
			rate = rate * 10
		end
		
		local move
		if left == 1 then
			move = rightwards * -rate
			total_movement = total_movement + move
		end
		if right == 1 then
			move = rightwards * rate
			total_movement = total_movement + move
		end

		if up == 1 then
			move = forwards * rate
			total_movement = total_movement + move
		end
		if down == 1 then
			move = forwards * -rate
			total_movement = total_movement + move
		end
		if straifup == 1 then
			move = upwards * rate
			total_movement = total_movement + move
		end
		if straifdown == 1 then
			move = upwards * -rate
			total_movement = total_movement + move
		end
	end

	return ScalePosition(total_movement)

end


function ScalePosition(v)
	return Vector.New( Vector.GetX(v)*xScale, Vector.GetY(v)*yScale, Vector.GetZ(v)*zScale )
end



function RestrictAngle(angle, restriction)

	if myRestrictingAngles == 1 then
		if restriction < 360 then
			-- keep in restrictive limits
			if angle < -restriction then
				angle = -restriction
			end
			if angle > restriction then
				angle = restriction
			end
		end
	else
		-- just wrap around
		-- keep in restrictive limits
		while angle < 0 do
			angle = angle + 360
		end
		while angle > 360 do
			angle = angle - 360
		end
	end

	return angle

end



function MessageScale()
	return panScale, tiltScale, rollScale, xScale, yScale, zScale 
end



function MessageSetScale(p, t, r, x, y, z)
	panScale = p
	tiltScale = t
	rollScale = r
	xScale = x
	yScale = y
	zScale = z
end


function MessageSetUserControlledAxes(p, t, r)
	panUser = p
	tiltUser = t
	rollUser = r
end



