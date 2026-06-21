# TableRect specializes Agent embeds Visual, Karma, Input

function Initialize(s)
	
	if s == nil then
		-- query instanciation
		return
	end
	
	spec = s
	Table.TypeCheck(s)
	
	local worldScale = Config.Get("worldscale",1)
	spec.position = spec.position * worldScale
	spec.scale = spec.scale * worldScale
	
	
	magicFloorOffset = Vector.New(0,30,0) 
	
	Config.Set("theLand", Agent.Me())

	-- if has physics
	if World.GetFlags() == 3 then

		local scalex = Vector.GetX(spec.scale)
		local scaley = Vector.GetY(spec.scale)
		local scalez = Vector.GetZ(spec.scale)

	
		-- Specify the HeightField image and dimensions here
		local hf_name = "kw-table.pgm"
		hf_x = 18  -- Heightfield pgm width (table top size (accounting for sides) = hf_x - 3)
		hf_z = 13  -- Heightfield pgm depth (table top size (accounting for sides) = hf_z - 3)
		local hf_texture = "Agents/World/Target/Plaster"

		local table_x_scale = scalex / (hf_x - 3)
		local table_z_scale = scalez / (hf_z - 3) 
		local pos = spec.position 
		--~ local floor_pos = spec.position - Vector.New(0,scaley,0) 
	
		Karma.LoadPGMHeightField("hf", hf_name, (pos - magicFloorOffset) + Vector.New(-(hf_x-1) * table_x_scale / 2, 0, -(hf_z-1) * table_z_scale / 2), 60, table_x_scale, table_z_scale, hf_texture, 1/(hf_x*table_x_scale), 1/(hf_z*table_z_scale))
		-- Invisible floor
		local floorHeight=-1		-- in metres (0 = contest table top)
		--~ Karma.CreateBody("floor", 2, false, floor_pos, Quatn.New(Vector.New(1, 0, 0), -90), Vector.New(1, 1, 1))
		Karma.CreateBody("invisible_wall", 2, false, pos+Vector.New(0,0,(-0.7 *scalez)), Quatn.New(Vector.New(0, 1, 0), 0), Vector.New(1, 1, 1))
	else
		CreateVisualOnly()
	end

end

function StaticInject()
	Agent.Create("TableRect", spec)
end

function MessageGetOABB()
	local worldScale = Config.Get("worldscale",1)
	return spec.position - (magicFloorOffset*0.45*worldScale), spec.scale
end

function CreateVisualOnly()

	local scalex = Vector.GetX(spec.scale)
	local scaley = Vector.GetY(spec.scale)
	local scalez = Vector.GetZ(spec.scale)

	local pos = spec.position 
	local floor_pos = spec.position - Vector.New(0,scaley,0)
	-- visual only, not created by height field
	Visual.Create( "hf", 1, pos+Vector.New(0,-scaley/2,0), Quatn.New(), Vector.New(scalex, scaley, scalez),0)
	--~ Visual.Create( "floor_visual", 1, floor_pos, Quatn.New(), Vector.New(scalex*1.5, 0, scalez*1.5),0)
	Visual.Create("invisible_wall", 1, pos+Vector.New(0,0,(-0.7 *scalez)), Quatn.New(Vector.New(0, 1, 0), 0), Vector.New(scalex, scalex/2, 1),0)	
	local red = Config.Get("bluescreen_colour_red", 0 )
	local green = Config.Get("bluescreen_colour_green", 0 )
	local blue = Config.Get("bluescreen_colour_blue", 1 )
	Visual.SetColour(Segment.invisible_wall, 1, 1, 1, Config.Get("invisible_alpha", 0.25))--0.01)
	--~ Visual.SetColour(Segment.floor_visual, red, green, blue, 1)--0.01)

end

function MessageHeight(vec)
	Vector.TypeCheck(vec)
	if Segment.hf ~= nil then
		return Karma.HeightGetHeight(Segment.hf, vec)
	end
end



function MessageStandardLights()
	local light1 = Visual.CreateLight( Visual.LIGHT_SOFTSPOT )
	local transform = Matrix.New()

	Matrix.SetTranslation( transform, Vector.New( 0, 20, 0 )+spec.position )
	Matrix.LookAt( transform, Vector.New( 0, 0, 0 )+spec.position, Vector.New( 1, 0, 0 )+spec.position )
	Visual.SetLightTransform( light1, transform )
	Visual.SetLightRadius( light1, 50 )
	Visual.SetLightConeAngle( light1, 35 )
	Visual.SetLightColour( light1, .4, .4, .4 )

	local light2 = Visual.CreateLight( Visual.LIGHT_AMBIENT )
	Visual.SetLightColour( light2, .2, .2, .2 )

	local light3 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	Matrix.LookAt( transform, Vector.New( 10, 0, 20 )+spec.position, Vector.New( 1, 0, 0 )+spec.position )
	Visual.SetLightTransform( light3, transform )
	Visual.SetLightColour( light3, .3, .3, .3 )

	local light4 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	Matrix.LookAt( transform, Vector.New( -20, 0, -15 )+spec.position, Vector.New( 1, 0, 0 )+spec.position )
	Visual.SetLightTransform( light4, transform )
	Visual.SetLightColour( light4, .3, .3, .3 )

	Matrix.SetTranslation( transform, Vector.New( 0, -20, 0 )+spec.position )
	local light5 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	Matrix.LookAt( transform, Vector.New( 0, 0, 0 )+spec.position, Vector.New( 1, 0, 0 )+spec.position)
	Visual.SetLightTransform( light5, transform )
	Visual.SetLightColour( light5, .05, .05, .05 )
end



function MessageShow( visible )
	if Segment.hf ~= nil then
		if visible == false then
			if Config.Get("textured_heightfield", false) == false then
				local red = Config.Get("bluescreen_colour_red", 0 )
				local green = Config.Get("bluescreen_colour_green", 0 )
				local blue = Config.Get("bluescreen_colour_blue", 1 )
				Visual.SetColour(Segment.hf, red, green, blue, 0.01)
			end
		else
			if Config.Get("textured_heightfield", false) == false then
				Visual.SetColour(Segment.hf, 1, 1, 1, 1)
			end
		end
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
	spec[field] = value
	CreateVisualOnly()
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
				scale = Vector.New(4.5/0.04, 1/0.04, 1.8/0.04),
				position = Vector.New(),
				group = "0"	
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = 1, default = Vector.New(0,0,0) },
				{ name = "x", label = "x", icon = "WidthObj", default = 4.5/0.04, min = 1, max = 200, scale = 1 },
				{ name = "y", label = "y", icon = "HeightObj", default = 1/0.04, min = 1, max = 200, scale = 1 },
				{ name = "z", label = "z", icon = "DepthObj",  default = 1.8/0.04, min = 1, max = 200, scale = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		}
	}
	return types
end
