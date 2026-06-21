# TableSumo specializes Agent embeds Visual, Karma

--~ radius in real world dimensions
--~ curvature in engine units, roughly 1000 - fairly flat, 10 - rounded
--~ height in realworld dimensions above standard contest table (which is modelled at zero)
function Initialize(s)
	
	if s == nil then
		-- query instanciation
		return
	end
	
	spec = s

	local worldScale = Config.Get("worldscale",1)
	spec.position = spec.position * worldScale
	spec.radius = spec.radius * worldScale
	spec.height = spec.height * worldScale
	

	HasPhysics = false
	if World.GetFlags() == 3 then
		HasPhysics = 1
	end
	
	Config.Set("theLand", Agent.Me())
	Create()
	
end

function Create()
	
	local radius = spec.radius
	local curvature = spec.curvature
	local position = spec.position
	local bigRadius = curvature
	local texture = "Agents/World/Target/plaster"

	local depth=spec.height		-- distance from contest table top to floor in metres (0 = contest table top)

	local nCircles = 3
	local nRadials = 6
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
	
	if HasPhysics ~= false then
		Karma.CreateBody( "sumotable", mesh, false, position, Quatn.New(), Vector.New(1,1,1) )
		-- Invisible floor
		Karma.CreateBody("floor", 2, false, spec.position-Vector.New(0,depth,0), Quatn.New(Vector.New(1, 0, 0), -90), Vector.New(1, 1, 1))
	end
	
	--Add extra points to give visual smooth edge
	nCirclePoints = 100
	for j = 1, nCirclePoints do
		local angle = 360 * j / ( nCirclePoints  )
		local x = Number.sin( angle ) * r
		local z = Number.cos( angle ) * r
		local y = Number.sqrt( bigRadius * bigRadius - x * x - z * z ) - bigRadius
		nPoints = nPoints + 1
		mesh.vertices[ nPoints ]  = Vector.New( x, y, z )
		nPoints = nPoints + 1
		mesh.vertices[ nPoints ]  = Vector.New( x, y-depth, z )
	end
	Visual.Create( "sumotable", mesh, position, Quatn.New(), Vector.New( 1,1,1), 1, false, 0.5, texture)


	--~ Visual.Create( "floor_visual", 1, Vector.New(0,-depth,0), Quatn.New(), Vector.New(radius*3, 0, radius*3),0)
	--~ local red = Config.Get("bluescreen_colour_red", 0 )
	--~ local green = Config.Get("bluescreen_colour_green", 0 )
	--~ local blue = Config.Get("bluescreen_colour_blue", 1 )
	--~ Visual.SetColour(Segment.floor_visual, red, green, blue, 1)

end

function MessageHeight(vec)
	Vector.TypeCheck(vec)
	return  Vector.New(Vector.GetX(vec), Vector.GetY(spec.position), Vector.GetZ(vec))
end

function MessageGetOABB()
	return Vector.New(0,-spec.height/2,0), Vector.New(spec.radius*2, spec.height, spec.radius*2)
end

function MessageStandardLights()
	local light1 = Visual.CreateLight( Visual.LIGHT_SOFTSPOT )
	local transform = Matrix.New()

	Matrix.SetTranslation( transform, Vector.New( 0, 20, 0 )+position )
	Matrix.LookAt( transform, Vector.New( 0, 0, 0 )+position, Vector.New( 1, 0, 0 )+position )
	Visual.SetLightTransform( light1, transform )
	Visual.SetLightRadius( light1, 50 )
	Visual.SetLightConeAngle( light1, 35 )
	Visual.SetLightColour( light1, .4, .4, .4 )

	local light2 = Visual.CreateLight( Visual.LIGHT_AMBIENT )
	Visual.SetLightColour( light2, .2, .2, .2 )

	local light3 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	Matrix.LookAt( transform, Vector.New( 10, 0, 20 )+position, Vector.New( 1, 0, 0 )+position )
	Visual.SetLightTransform( light3, transform )
	Visual.SetLightColour( light3, .3, .3, .3 )

	local light4 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	Matrix.LookAt( transform, Vector.New( -20, 0, -15 )+position, Vector.New( 1, 0, 0 )+position )
	Visual.SetLightTransform( light4, transform )
	Visual.SetLightColour( light4, .3, .3, .3 )

	Matrix.SetTranslation( transform, Vector.New( 0, -20, 0 )+position )
	local light5 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	Matrix.LookAt( transform, Vector.New( 0, 0, 0 )+position, Vector.New( 1, 0, 0 )+position)
	Visual.SetLightTransform( light5, transform )
	Visual.SetLightColour( light5, .05, .05, .05 )
end



function MessageShow( visible )
	if Segment.sumotable ~= nil then
		if visible == false then
			if Config.Get("textured_heightfield", false) == false then
				local red = Config.Get("bluescreen_colour_red", 0 )
				local green = Config.Get("bluescreen_colour_green", 0 )
				local blue = Config.Get("bluescreen_colour_blue", 1 )
				Visual.SetColour(Segment.sumotable, red, green, blue, 0.01)
			end
		else
			if Config.Get("textured_heightfield", false) == false then
				Visual.SetColour(Segment.sumotable, 1, 1, 1, 1)
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
	return Number.sqrt((spec.radius*spec.radius)+(spec.radius*spec.radius)+(spec.height*spec.height))
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
				radius = 0.85/0.04,
				curvature = 10000,
				height = 1/0.04,
				position = Vector.New(),
				group = "0"	
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = 1, default = Vector.New(0,0,0) },
				{ name = "radius", label = "Radius", icon = "WidthObj", default =0.085/0.04, min = 1, max = 200, scale = 1 },
				{ name = "height", label = "Height", icon = "HeightObj", default =  0.06/0.04, min = 1, max = 200, scale = 1 },
				{ name = "curvature", label = "Curvature", default = 10000, min = 1, max = 1000, scale = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		}
	}
	return types
end
