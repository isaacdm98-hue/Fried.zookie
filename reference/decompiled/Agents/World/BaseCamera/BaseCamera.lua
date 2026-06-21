# BaseCamera specializes Agent embeds Camera, Input

function Initialize(pos, rot, x1, y1, x2, y2)

	Vector.TypeCheck(pos)
	Quatn.TypeCheck(rot)
	myPosition = pos
	myRotation = rot
	
	pi =  3.1415927 
	halfPi = pi * 0.5
	radPerDeg = pi/180
	
	left = 0
	right = 0
	up = 0
	down = 0
	shift = 0
	mouse = 0
	mouse0 = 0
	mouse1 = 0
	straifup = 0
	straifdown = 0
	tab = 0
	space = 1
	myShown = 1


	if x2 ~= 0 and x2 ~= nil and y2~=0 and y2~=nil then
		Camera.Create(x1, y1, x2, y2)
	else
		local width, height = Camera.Area()
		Camera.Create(0,0,width,height)
	end
	Camera.Set(myPosition, myRotation)
	--Camera.SetFog( 3, 20, 40, 1, 0.0, .2, .3 )
	MessageBackground( 163/255, 31/255, 154/255 )
	
	Config.Set("theCamera",Agent.Me())
	
end


function RegisterKeys()
	Input.RegisterKey(Input.KEY_LEFT)
	Input.RegisterKey(Input.KEY_RIGHT)
	Input.RegisterKey(Input.KEY_UP)
	Input.RegisterKey(Input.KEY_DOWN)

	Input.RegisterKey(Input.KEY_W)
	Input.RegisterKey(Input.KEY_A)
	Input.RegisterKey(Input.KEY_S)
	Input.RegisterKey(Input.KEY_D)
	Input.RegisterKey(Input.KEY_Q)
	Input.RegisterKey(Input.KEY_Z)
	Input.RegisterKey(Input.KEY_H)
	
	Input.RegisterKey(Input.KEY_LSHIFT)
	Input.RegisterKey(Input.KEY_RSHIFT)
	Input.RegisterKey(Input.KEY_SPACE)
	Input.RegisterKey(Input.KEY_TAB)
end
	
function SystemKeyDown(key)

	if ToggleKey(key, 1) == false then
		local controlDown = Input.IsKeyDown(Input.KEY_LCONTROL) or Input.IsKeyDown(Input.KEY_RCONTROL)
	
		if key == Input.KEY_SPACE then
			if space == 1 then
				space = 0
			else 
				space = 1
			end
		elseif key == Input.KEY_H and controlDown then
			myShown = 1 - myShown
			Camera.Show( myShown == 1 )
		end
		
	end
end


function MessageShow(show)
	Camera.Show( show )
end


function SystemKeyUp(key)
	ToggleKey(key, 0)
end


function ToggleKey(key, value)
	
	if key == Input.KEY_LEFT or key == Input.KEY_A then
		left = value
	elseif key == Input.KEY_RIGHT  or key == 32 then
		right = value
	elseif key == Input.KEY_UP or key == Input.KEY_W then
		up = value
	elseif key == Input.KEY_DOWN  or key == Input.KEY_S then
		down = value
	elseif key == Input.KEY_LSHIFT or key == Input.KEY_RSHIFT then
		shift = value
	elseif key == Input.KEY_MOUSE0 or key == Input.KEY_MOUSE1 then
		if key == Input.KEY_MOUSE0 then
			mouse0 = value
		end
		if key == Input.KEY_MOUSE1 then
			mouse1 = value
		end
		mouse = mouse0 + mouse1
	elseif key == Input.KEY_Q then
		straifup = value
	elseif key == Input.KEY_Z then
		straifdown = value
	elseif key == Input.KEY_TAB then
		tab = value
	else
		return false
	end
	
	return 1
	
end
	

function CalcHeading(rot)
	
	-- return s heading in radians

	local pan = Vector.New(1, 0, 0 ) * rot
	local retPan = (Number.atan2(  Vector.GetX( pan ), Vector.GetZ( pan ) )* (pi/180) )+ pi
	local retTilt = Number.asin( Vector.GetY( pan ) ) * (pi/180) 
	if retPan > pi then 
		retPan = retPan - 2 * pi
	end
	return retPan, retTilt
end

	
function MessagePosition()
	return myPosition
end


function MessageRotation()
	return myRotation
end


function MessageSetPosition(pos)
	myPosition = pos
	Camera.SetPosition(pos)
end

function MessageSetTarget(target, updirection)
	Camera.SetTarget(target, updirection)
end

function MessageSetOrientation(q)
	Camera.SetOrientation(  q )
end

function MessageSetViewOffset(x, y)
	Camera.SetViewOffset(x,y)
end

function MessageSetClipPlanes(near, far)
	Camera.SetClipPlanes(near, far)
end

function MessagePick()
	return Camera.Pick( Input.MousePosition() )
end


function MessageRay()
	local nP, fP = Camera.GetRay( Input.MousePosition() )
	local dir = fP - nP
	Vector.Normalise(dir)
	return nP, dir
end


function MessageFog( type, s, e, density, red, green, blue )
	Camera.SetFog( type, s, e, density, red, green, blue )
end


function MessageBackground(r, g, b)
	background_r = r
	background_g = g
	background_b = b
	Camera.SetBackground( r, g, b )
end

function SetVerticalViewAngle( verticalViewAngle, aspect )
    local horizontalViewAngle = 2 * Number.atan( aspect * Number.tan(verticalViewAngle / 2.0 ) )
    Camera.SetViewAngles( horizontalViewAngle, verticalViewAngle )
end

function MessageViewAngles( horizontalViewAngle, verticalViewAngle  )
    Camera.SetViewAngles( horizontalViewAngle, verticalViewAngle )
end

function MessageAnamorphic( verticalViewAngle )
    SetVerticalViewAngle( verticalViewAngle, 16.0 / 9.0  )
end


function MessageVerticalViewAngle( verticalViewAngle )
	--Uses the screen dimensions of the camera to work out aspect ratio(assuming pixels are square)
    local width, height = Camera.GetSize()
    SetVerticalViewAngle( verticalViewAngle, width / height )
end

function MessageHorizontalViewAngle( horizontalViewAngle )
	--Uses the screen dimensions of the camera to work out aspect ratio(assuming pixels are square)
    local width, height = Camera.GetSize()
    local verticalViewAngle = horizontalViewAngle / (width / height)
    SetVerticalViewAngle( verticalViewAngle, width / height )
end


function MessageShowBackground(show)
	if show then
		Camera.SetFog( Config.Get("fogging", 1), Config.Get("fog_start", 40), Config.Get("fog_end", 80), 1, 1, 1, 1 )
		Camera.SetBackground( background_r, background_g,  background_b )
	else
		Camera.SetFog( 0, Config.Get("fog_start", 40), Config.Get("fog_end", 80), 1, 1, 1, 1 )
		Camera.SetBackground( Config.Get("bluescreen_colour_red",0), Config.Get("bluescreen_colour_green",0), Config.Get("bluescreen_colour_blue",1) )
	end
end

function MessageSize()
	return Camera.GetSize()
end


function MessageDestroy()
	Agent.Destroy()
end



function MessageGetImageAsString()
	return Camera.GetImageAsString()
end

function MessageSetBluescreen( on )
	Camera.SetBluescreen( on )
end


	