#RevolvingDoor specializes Agent embeds Visual, Karma

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


	HasPhysics = false
	if World.GetFlags() == 3 then
		HasPhysics = 1
	end

	Create()
end

function MessageClone()
	return Agent.Create( "RevolvingDoor", spec )
end

function Create()
	local contestobject_red = Config.Get( "contestobject_red", 158/255 )
	local contestobject_green = Config.Get( "contestobject_green", 157/255 )
	local contestobject_blue = Config.Get( "contestobject_blue", 157/255 )

	local worldScale = Config.Get("worldscale",1)
	local width = Vector.GetZ(spec.scale)
	local depth = Vector.GetX(spec.scale)
	local height = Vector.GetY(spec.scale)
	
		

	local position, rotation, rotation2, scale
	local geometries = {}

	local nDivs = 5
	position = spec.position + Vector.New( 0, height/2, 0 )
	rotation = Quatn.New( Vector.GetXYZ( spec.eulers ) )
	rotation2 = rotation * Quatn.New( Vector.New( 0,1,0), 90 )
	scale = spec.scale
	
	if HasPhysics ~= false then
		Karma.CreateGeometry( "wall1", 1, Vector.New(0,0,0), rotation, scale )
		Karma.CreateGeometry( "wall2", 1, Vector.New(0,0,0), rotation2, scale )
		--Karma.CreateGeometry( "wall1", 1, position, rotation, scale )
		--Karma.CreateGeometry( "wall2", 1, position, rotation2, scale )
		geometries[1] = Segment.GetId("wall1")
		geometries[2] = Segment.GetId("wall2")
	end
	
	
	local alpha = 1
	if spec.visible == false then
		alpha = Config.Get("invisible_alpha", 0.25)
	end
	
	if spec.texture ~= nil then
		Visual.Create("wall1", 1, position, rotation, scale, 0, false, 0.5, spec.texture )
		Visual.Create("wall2", 1, position, rotation2, scale, 0, false, 0.5, spec.texture )
	else
		Visual.Create("wall1", 1, position, rotation, scale, 0 )
		Visual.Create("wall2", 1, position, rotation2, scale, 0 )
	end
	Visual.SetColour( Segment.wall1, spec.red, spec.green, spec.blue, alpha )
	Visual.SetColour( Segment.wall2, spec.red, spec.green, spec.blue, alpha )
	Visual.SetShadow( Segment.wall1, spec.shadow )
	Visual.SetShadow( Segment.wall2, spec.shadow )

	if HasPhysics ~= false then
		Karma.CreateBody( "wall", geometries, 1, position, rotation, scale )
		Karma.SetMass( Segment.wall, spec.mass )
		Karma.CreateHinge("doorhinge", Segment.wall, 0, position, Vector.New(0,1,0) ) --* rotation)
	end
	
end

-- FUNCTIONS BELOW ARE REQUIRED FOR THE CONTEST EDITOR

function MessageGetOABB()
	local x, y, z = Vector.GetXYZ( spec.scale )
	local m = Number.max( x, z )
	return spec.position + Vector.New(0,Vector.GetY(spec.scale)/2,0), Vector.New(m, y, m)
end

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
				eulers = Vector.New(),
				scale = Vector.New(1, 10, 15),	
				red = .619608, 
				green = .619608, 
				blue = .619608,  
				visible = 1,
				mass = 1,
				texture = "Agents/World/Target/plaster",
				shadow = 1
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0) },
				{ name = "eulers", label = "Orientation", vector = 5, default = Vector.New(0,0,0) },
				{ name = "scalex", label = "Width", tab = "Physical", icon = "WidthObj", default = 1, min = 1, max = 100, scale = 1 },
				{ name = "scaley", label = "Height", tab = "Physical", icon = "HeightObj", default = 10, min = 1, max = 100, scale = 1 },
				{ name = "scalez", label = "Length", tab = "Physical", icon = "DepthObj",  default = 15, min = 1, max = 100, scale = 1 },
				{ name = "mass", label = "Mass", tab = "Physical",  default = 1, min = .1, max = 20, scale = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		}
	}
	return types
end

	

