#SwingDoor specializes Agent embeds Visual, Karma, Input

function Initialize(s)

	if s == nil then
		-- query instanciation
		return
	end
	
	spec = s
	Table.TypeCheck(spec)
	
	local worldScale = Config.Get("worldscale",1)
	spec.position = spec.position * worldScale
	spec.scale = spec.scale * worldScale

	
	myMinAngle = spec.minangle
	myMaxAngle = spec.maxangle
	myVelocity = spec.velocity
	myMaxForce = spec.maxforce
	myOpening = myVelocity > 0
		
	Create()
end

function Create()

	local worldScale = Config.Get("worldscale",1)
	local poleWidth = 1 * worldScale
	local extraHeight = 0.2 --* worldScale
	local doorpanel_name = "doorpanel"
	local doorpanel_shape = 1
	local doorpanel_pos = spec.position + Vector.New(0,Vector.GetY(spec.scale)/2+extraHeight,Vector.GetZ(spec.scale)/2+poleWidth/2)
	local doorpanel_pos = spec.position + Vector.New(0,Vector.GetY(spec.scale)/2+extraHeight,0)
	local doorpanel_rot = CalcRotation( spec )
	local doorpanel_scale = spec.scale

	local hingePos = doorpanel_pos + Vector.New( 0, 0, -Vector.GetZ( spec.scale ) / 2 ) * doorpanel_rot
	
	local doorpost_pos = hingePos
	local doorpost_name = "doorpost"
	local doorpost_shape = 4
	local doorpost_rot = Quatn.New( Vector.New( 1, 0, 0 ), 90) * doorpanel_rot
	local doorpost_scale = Vector.New(poleWidth,0,Vector.GetY(spec.scale))
	
	local alpha = 1
	if spec.visible == false then
		alpha = Config.Get("invisible_alpha", 0.25)
	end
	
	local post, panel
	if spec.texture ~= nil then
		post = Visual.Create(doorpost_name, doorpost_shape, doorpost_pos, doorpost_rot, doorpost_scale, 1, false, 0.5, "Agents/World/Target/"..spec.texture)
		panel = Visual.Create(doorpanel_name, doorpanel_shape, doorpanel_pos, doorpanel_rot, doorpanel_scale, 1, false, 0.5, "Agents/World/Target/"..spec.texture)
	else
		post = Visual.Create(doorpost_name, doorpost_shape, doorpost_pos, doorpost_rot, doorpost_scale, 1)
		panel = Visual.Create(doorpanel_name, doorpanel_shape, doorpanel_pos, doorpanel_rot, doorpanel_scale, 1)
	end
	Visual.SetColour(post, spec.red, spec.green, spec.blue, alpha)
	Visual.SetColour(panel, spec.red, spec.green, spec.blue, alpha)
	-- if has physics
	if World.GetFlags() == 3 then
		Karma.CreateBody(doorpost_name, doorpost_shape, false, doorpost_pos, doorpost_rot,  doorpost_scale)
		Karma.CreateBody(doorpanel_name, doorpanel_shape, 1, doorpanel_pos, doorpanel_rot, doorpanel_scale)
		Karma.SetMass(Segment.doorpanel, 0.1)
		Karma.CreateHinge("doorhinge", Segment.GetId(doorpanel_name), 0, hingePos, Vector.New(0,1,0) * doorpanel_rot)
		Karma.SetHingeLimits( Segment.doorhinge, myMinAngle, myMaxAngle )
		Karma.SetHingeMotor( Segment.doorhinge, myVelocity, myMaxForce )
		Karma.SetAgentCollidabilityOff()
		Agent.SetTimer( "UpdateDoor",  Agent.Me(), "update", .10)
		Visual.SetVisible(post, spec.visible)
		Visual.SetVisible(panel, spec.visible)
	end

	Visual.SetShadow( post, spec.shadow )
	Visual.SetShadow( panel, spec.shadow )
	
end

function MessageClone()
	return Agent.Create( "SwingDoor", spec )
end

function CalcRotation( spec )
	return Quatn.New( Vector.GetXYZ( spec.eulers ) )
end

function MessageGetOABB()
	return spec.position + Vector.New(0,Vector.GetY(spec.scale)/2,0), spec.scale
end

function TimerUpdateDoor()
	local angle = Karma.GetHingePosition( Segment.doorhinge )
	Trace( "Door position %", angle )
	if myOpening and angle > (myMaxAngle - 5) then
		Karma.SetHingeMotor( Segment.doorhinge, -Number.abs(myVelocity), myMaxForce )
		myOpening = false
	end
	
	if not myOpening and angle < (myMinAngle + 5) then
		Karma.SetHingeMotor( Segment.doorhinge, Number.abs(myVelocity), myMaxForce )
		myOpening = 1
	end
		
end


-- FUNCTIONS BELOW ARE REQUIRED FOR THE CONTEST EDITOR


function MessageSpec()
	return spec
end
	

function MessageDestroy()
	Agent.Destroy()
end


function MessageBoundingSphere()
	return Vector.GetLength(spec.scale)
end

function MessageSetProperty( field, value )
	if field == "scalex" then
		local x, y, z = Vector.GetXYZ( spec.scale )
		spec.scale = Vector.New( value, y, z )
	elseif field == "scaley" then
		local x, y, z = Vector.GetXYZ( spec.scale )
		spec.scale = Vector.New( x, value, z )
	elseif field == "scalez" then
		local x, y, z = Vector.GetXYZ( spec.scale )
		spec.scale = Vector.New( x, y, value )
	else
		spec[field] = value
	end
	Create()
end

function MessageGetProperty( field )
	if field == "scalex" then
		return Vector.GetX( spec.scale )
	elseif field == "scaley" then
		return Vector.GetY( spec.scale )
	elseif field == "scalez" then
		return Vector.GetZ( spec.scale )
	else
		return spec[field]
	end
end

function MessageParamaters()
	local types = {
		{
			name = "",
			default = { 
				description = "",
				position = Vector.New(), 
				eulers = Vector.New(0,0,0),
				scale = Vector.New(1, 7, 18),	
				red = .619608, 
				green = .619608, 
				blue = .619608,  
				visible = 1,
				shadow = 1,	
				texture = "Agents/World/Target/plaster",
				minangle = -80,
				maxangle = 80,
				velocity = 2,
				maxforce = 1000,
				group = "0"
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = 1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "eulers", label = "Orientation", vector = 1, default = Vector.New(0,0,0) },
				{ name = "scalex", label = "Width", tab = "Physical", icon = "WidthObj", default = 1, min = .1, max = 100, scale = 4 },
				{ name = "scaley", label = "Height", tab = "Physical", icon = "HeightObj", default = 1, min = .1, max = 100, scale = 4 },
				{ name = "scalez", label = "Length", tab = "Physical", icon = "DepthObj",  default = 1, min = .1, max = 100, scale = 4 },
				{ name = "minangle", label = "Min Angle", tab = "Physical", default = -80, min = -90, max = 90, scale = 1 },
				{ name = "maxangle", label = "Max Angle", tab = "Physical", default = 80, min = -90, max = 90, scale = 1 },
				{ name = "velocity", label = "Velocity", tab = "Physical", default = 2, min = 1, max = 20, scale = 1 },
				{ name = "maxforce", label = "Max Force", tab = "Physical", default = 1000, min = 1, max = Config.Get( "max_door_strength", 10000 ), scale = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		}
	}
	return types
end

	