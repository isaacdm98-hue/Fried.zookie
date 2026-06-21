#Turntable specializes Agent embeds Visual, Karma, Input

function Initialize(s)

	if s == nil then
		-- query instanciation
		return
	end

	spec = s
	Table.TypeCheck(spec)
	
	local worldScale = Config.Get("worldscale",1)
	spec.position = spec.position * worldScale
	spec.depth = spec.depth * worldScale
	spec.radius = spec.radius * worldScale
	
				
	mySpeed = 0

	myOpening = 1
	myMotorSpeed = 0
	
	Input.RegisterKey( Input.KEY_EQUALS )
	Input.RegisterKey( Input.KEY_MINUS )
	
	Create()
	if World.GetFlags() == 3 then
		Agent.PostMessage( "StartTurntable", Agent.Me(), 4 )
	end
end

function MessageStartTurntable()
	Agent.SetTimer("SpeedUp", Agent.Me(), "timer", 0.1)
end

function TimerSpeedUp()
	mySpeed = mySpeed + 0.02
	Karma.SetHingeMotor( Segment.spindle, mySpeed, 10000 )
end

function Create()
	
	local nCircles = 4
	local nRadials = 4
	local radius = spec.radius 
	local depth = spec.depth
	local bigRadius = spec.curvature
	local spacing  = radius / nCircles
	local mesh = {}
	mesh.vertices = {}
	local nPoints = 0
	mesh.vertices[ nPoints ]  = Vector.New( 0,0,0 )
	for i = 1, nCircles do
		local r = i * spacing
		local nCirclePoints = i * nRadials
		for j = 1, nCirclePoints do
			nPoints = nPoints + 1
			local angle = 360 * j / ( nCirclePoints  )
			local x = Number.sin( angle ) * r
			local z = Number.cos( angle ) * r
			local y = Number.sqrt( bigRadius * bigRadius - x * x - z * z ) - bigRadius
			mesh.vertices[ nPoints ]  = Vector.New( x, y, z )
		end
	end

	local r = radius
	local nCirclePoints = nCircles * nRadials
	for j = 1, nCirclePoints do
		nPoints = nPoints + 1
		local angle = 360 * j / ( nCirclePoints  )
		local x = Number.sin( angle ) * r
		local z = Number.cos( angle ) * r
		local y = Number.sqrt( bigRadius * bigRadius - x * x - z * z ) - bigRadius - depth
		mesh.vertices[ nPoints ]  = Vector.New( x, y, z )
	end
	
	local position = spec.position+Vector.New(0,spec.depth,0)
	-- if has physics
	HasPhysics = false
	if World.GetFlags() == 3 then
		HasPhysics = 1
		Karma.CreateBody( "turntable", mesh, spec.movable, position, Quatn.New(), Vector.New(1,1,1) )
		Karma.CreateHinge("spindle", Segment.turntable, 0, position, Vector.New(0,1,0))
		Karma.CreateHinge("spindle2", Segment.turntable, 0, position, Vector.New(0,1,0))
		Karma.CreateHinge("spindle3", Segment.turntable, 0, position, Vector.New(0,1,0))
		Karma.CreateHinge("spindle4", Segment.turntable, 0, position, Vector.New(0,1,0))
		Karma.CreateHinge("spindle5", Segment.turntable, 0, position, Vector.New(0,1,0))
		Karma.CreateHinge("spindle6", Segment.turntable, 0, position, Vector.New(0,1,0))
		Karma.CreateHinge("spindle7", Segment.turntable, 0, position, Vector.New(0,1,0))
		Karma.CreateHinge("spindle8", Segment.turntable, 0, position, Vector.New(0,1,0)) 
	end
	
	--Add extra points to give visual smooth edge
	--~ nCirclePoints = 100
	--~ for j = 1, nCirclePoints do
		--~ local angle = 360 * j / ( nCirclePoints  )
		--~ local x = Number.sin( angle ) * r
		--~ local z = Number.cos( angle ) * r
		--~ local y = Number.sqrt( bigRadius * bigRadius - x * x - z * z ) - bigRadius
		--~ nPoints = nPoints + 1
		--~ mesh.vertices[ nPoints ]  = Vector.New( x, y, z )
		--~ nPoints = nPoints + 1
		--~ mesh.vertices[ nPoints ]  = Vector.New( x, y-depth, z )
	--~ end
	
	local alpha = 1
	if spec.visible == false then
		alpha = Config.Get("invisible_alpha", 0.25)
	end
	
	Visual.Create( "turntable", mesh, position, Quatn.New(), Vector.New( 1,1,1), 1, false, 0.5, spec.texture)
	Visual.SetColour(Segment.turntable, spec.red, spec.green, spec.blue, alpha)
	Visual.SetShadow( Segment.turntable, spec.shadow )
	if spec.flags == nil then spec.flags = 0 end
	Visual.SetFlags( Segment.turntable, tonumber( spec.flags ) )
	if World.GetFlags() == 3 then
		Visual.SetVisible( Segment.turntable, spec.visible )
	end


end

function SystemKeyDown(key)
	if key == Input.KEY_EQUALS then
		mySpeed = mySpeed + 0.2
	elseif key == Input.KEY_MINUS then
		mySpeed = mySpeed - 0.2
		if mySpeed < 0 then
			mySpeed = 0
		end
	end
	if HasPhysics then
		Karma.SetHingeMotor( Segment.spindle, mySpeed, 10000 )
	end
end


function MessageSpec()
	return spec
end



function MessageDestroy()
	Agent.Destroy()
end


function MessageBoundingSphere()
	return spec.depth*spec.radius
end

function MessageSetProperty( field, value )
	spec[field] = value
	Create()
end

function MessageGetProperty( field )
	return spec[field]
end



function MessageParamaters()
	local types = {
		{
			name = "",
			default = { 
				description = "",
				texture = "Agents/World/Target/plaster",
				depth = 2,
				position = Vector.New(0, 0, 0),
				red =  .619608,
				green = .615686,
				blue = .615686,
				radius = 20,
				curvature = 1000,
				movable = 1,
				visible = 1,
				shadow = 1,
				position = Vector.New(),
				group = "0",	
				flags = "0"	
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "radius", label = "Radius", tab = "Physical", icon = "WidthObj", default = 20, min = 1, max = 50, scale = 1 },
				{ name = "depth", label = "Depth", tab = "Physical", icon = "HeightObj", default = 2, min = 1, max = 100, scale = 1 },
				{ name = "curvature", label = "Curvature", tab = "Physical", default = 1000, min = 51, max = 10000, scale = 1 },
				{ name = "movable", label = "Movable", tab = "Physical", check = false },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "flags", label = "Studio Flags", edit = "0" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 }
			}
		}
	}
	return types
end

	