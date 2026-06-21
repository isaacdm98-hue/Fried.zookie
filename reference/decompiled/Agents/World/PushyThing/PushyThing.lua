#PushyThing specializes Agent embeds Visual, Karma

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

function Create()

	
	local blueteam_red = Config.Get( "blueteam_red", 0/255 )
	local blueteam_green = Config.Get( "blueteam_green", 0/255 )
	local blueteam_blue = Config.Get( "blueteam_blue", 0/255 )
	local redteam_red = Config.Get( "redteam_red", 247/255 )
	local redteam_green = Config.Get( "redteam_green", 38/255 )
	local redteam_blue = Config.Get( "redteam_blue", 27/255 )
	local contestobject_red = Config.Get( "contestobject_red", 158/255 )
	local contestobject_green = Config.Get( "contestobject_green", 157/255 )
	local contestobject_blue = Config.Get( "contestobject_blue", 157/255 )

	local worldScale = Config.Get("worldscale",1)
	local width = Vector.GetZ(spec.scale)
	local depth = Vector.GetX(spec.scale)
	local tall_height = Vector.GetY(spec.scale)
	local short_height = 1 * worldScale
	local wall_width = 1 * worldScale
	
		

	local position, rotation, scale
	local geometries = {}

	local nDivs = 5
	position = spec.position+Vector.New(0, (short_height/2), (depth/2))
	rotation = Quatn.New( Vector.GetXYZ( spec.eulers ) )
	scale = Vector.New(width,short_height,wall_width)
	
	if HasPhysics ~= false then
		for i = 1, nDivs do
			local subScale = Vector.New( Vector.GetX( scale ) / nDivs, Vector.GetY( scale ), Vector.GetZ( scale ) )
			local subPosition = position + Vector.New( Vector.GetX( subScale ) * ( i - nDivs/2 - 0.5 ), 0, 0 ) 
			Karma.CreateGeometry( "wall1"..i, 1, subPosition, rotation, subScale )
			geometries[i] = Segment.GetId("wall1"..i)
		end
	end
	
	
	local alpha = 1
	if spec.visible == false then
		alpha = Config.Get("invisible_alpha", 0.25)
	end
	
	Visual.Create("wall13", 1, position, rotation, scale, 0, false, 0.5, "Agents/World/Target/plaster" )
	Visual.SetColour( Segment.wall13, spec.red, spec.green, spec.blue, alpha )
	Visual.SetShadow( Segment.wall13, spec.shadow )

	position = spec.position+Vector.New(0, (short_height/2), -(depth/2))
	scale = Vector.New(width,short_height,wall_width)
	if HasPhysics ~= false then
		for i = 1, nDivs do
			local subScale = Vector.New( Vector.GetX( scale ) / nDivs, Vector.GetY( scale ), Vector.GetZ( scale ) )
			local subPosition = position + Vector.New( Vector.GetX( subScale ) * ( i - nDivs/2 - 0.5 ), 0, 0 ) 
			Karma.CreateGeometry( "wall2"..i, 1, subPosition, rotation, subScale )
			geometries[i+nDivs] = Segment.GetId("wall2"..i)
		end
	end
	Visual.Create("wall23", 1, position, rotation, scale, 0, false, 0.5, "Agents/World/Target/plaster" )
	Visual.SetColour( Segment.wall23, spec.red, spec.green, spec.blue, alpha )
	Visual.SetShadow( Segment.wall23, spec.shadow )

	position = spec.position+Vector.New(-(width/2)-wall_width/2, (tall_height/2), 0)
	rotation = Quatn.New(Vector.New(0,1,0), 0)
	scale = Vector.New(wall_width,tall_height,depth+wall_width)
	if HasPhysics ~= false then
		Karma.CreateGeometry( "wall3", 1, position, rotation, scale )
		geometries[nDivs*2+1] = Segment.GetId("wall3")
	end
	Visual.Create("wall3", 1, position, rotation, scale, 0, false, 0.5, "Agents/World/Target/plaster" )
	Visual.SetColour( Segment.wall3, blueteam_red, blueteam_green, blueteam_blue, alpha )
	Visual.SetShadow( Segment.wall3, spec.shadow )

	position = spec.position+Vector.New((width/2)+wall_width/2, (tall_height/2), 0)
	scale = Vector.New(wall_width,tall_height,depth+wall_width)
	if HasPhysics ~= false then
		Karma.CreateGeometry( "wall4", 1, position, rotation, scale )
		geometries[nDivs*2+2] = Segment.GetId("wall4")
	end
	Visual.Create("wall4", 1, position, rotation, scale, 0, false, 0.5, "Agents/World/Target/plaster" )
	Visual.SetColour( Segment.wall4, redteam_red, redteam_green, redteam_blue, alpha )
	Visual.SetShadow( Segment.wall4, spec.shadow )

	position = spec.position+Vector.New(0,0.1,0)
	scale = Vector.New(1,1,1)
	if HasPhysics ~= false then
		Karma.CreateBody( "wall", geometries, 1, position, rotation, scale )
		Karma.SetMass( Segment.wall, 5 )
		Karma.SetLinearVelocityDamping( Segment.wall, 10 )
		Karma.CreatePrismatic( "prismatic", Segment.wall, 0, Vector.New( 1, 0, 0 ) )
	end
	
	if HasPhysics ~= false then
		Visual.SetVisible(Segment.wall13, spec.visible)
		Visual.SetVisible(Segment.wall23, spec.visible)
		Visual.SetVisible(Segment.wall23, spec.visible)
		Visual.SetVisible(Segment.wall3, spec.visible)
		Visual.SetVisible(Segment.wall4, spec.visible)
	end
end

-- FUNCTIONS BELOW ARE REQUIRED FOR THE CONTEST EDITOR

function MessageGetOABB()
	local worldScale = Config.Get("worldscale",1)
	local wall_width = 1 * worldScale
	return spec.position + Vector.New(0,Vector.GetY(spec.scale)/2,0), Vector.New(Vector.GetZ(spec.scale)+wall_width*2, Vector.GetY(spec.scale), Vector.GetX(spec.scale)+wall_width)
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
				scale = Vector.New(10, 5, 45),	
				red = .619608, 
				green = .619608, 
				blue = .619608,  
				visible = 1,
				shadow = 1,
				group = "0"
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "eulers", label = "Orientation", vector = 5, default = Vector.New(0,0,0) },
				{ name = "scalex", label = "Width", tab = "Physical", icon = "WidthObj", default = 1, min = 1, max = 100, scale = 4 },
				{ name = "scaley", label = "Height", tab = "Physical", icon = "HeightObj", default = 1, min = 1, max = 100, scale = 4 },
				{ name = "scalez", label = "Length", tab = "Physical", icon = "DepthObj",  default = 1, min = 1, max = 100, scale = 4 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		}
	}
	return types
end

	

