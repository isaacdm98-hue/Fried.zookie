# Env specializes Agent embeds Visual, Karma, Input

function Initialize(pos, fx, fz, rot)
	
	Config.Set("theLand", Agent.Me())

	if pos == nil then
		pos = Vector.New()
	end
	
	position = pos
	rotation = rot
	floorSizeX = fx
	floorSizeZ = fz
	

	local mesh = {vertices = {}, normals = {}, texture_coordinates = {}, tangents = {}}
	local indices1 = {}
	local indices2 = {}
	indices2[4800] = 0
	local gindex = 0
	local gindex1 = 0
	local gindex2 = 0
	local sizeX = floorSizeX
	local sizeZ = floorSizeZ
	for i = -sizeX/2, sizeX/2 do
		for j =-sizeZ/2, sizeZ/2 do
			gindex = gindex + 1
			mesh.vertices[gindex] = Vector.New( i, 0, j )
			mesh.normals[gindex] = Vector.New( 0,1,0 )
			mesh.tangents[gindex] = Vector.New( 1,0,0 )
			mesh.texture_coordinates[gindex*2 - 1] = i/32
			mesh.texture_coordinates[gindex*2 ] = j/32
			if i < sizeX/2 and j < sizeZ/2 then
				if Number.mod( i + j + sizeX + sizeZ, 2 ) > 0.5 then
					gindex1 = gindex1 + 1
					indices1[ gindex1 ] = gindex - 1
					gindex1 = gindex1 + 1
					indices1[ gindex1 ] = gindex
					gindex1 = gindex1 + 1
					indices1[ gindex1 ] = gindex + sizeZ
					gindex1 = gindex1 + 1
					indices1[ gindex1 ] = gindex + sizeZ
					gindex1 = gindex1 + 1
					indices1[ gindex1 ] = gindex
					gindex1 = gindex1 + 1
					indices1[ gindex1 ] = gindex + sizeZ+1
				else
					gindex2 = gindex2 + 1
					indices2[ gindex2 ] = gindex - 1
					gindex2 = gindex2 + 1
					indices2[ gindex2 ] = gindex
					gindex2 = gindex2 + 1
					indices2[ gindex2 ] = gindex + sizeZ
					gindex2 = gindex2 + 1
					indices2[ gindex2 ] = gindex + sizeZ
					gindex2 = gindex2 + 1
					indices2[ gindex2 ] = gindex
					gindex2 = gindex2 + 1
					indices2[ gindex2 ] = gindex + sizeZ+1
				end
			end
		end
	end
	mesh.indices = indices1
	--mesh.texture = "agents/world/target/plaster.png"
	Visual.Create("land1", mesh, position, rotation, Vector.New(1, 1, 1), 1)
	Visual.SetColour(Segment.land1, Config.Get("floortile1_r", 0.9), Config.Get("floortile1_g", 0.9), Config.Get("floortile1_b", 0.9))
	--~ 10/255,40/255,60/255)
	mesh.indices = indices2
	Visual.Create("land2", mesh, position, rotation, Vector.New(1, 1, 1), 1)
	Visual.SetColour(Segment.land2,Config.Get("floortile2_r", 0.99), Config.Get("floortile2_g", 0.99), Config.Get("floortile2_b", 0.99))
	--~ 30/255,20/255,10/255)



	local matrix = Matrix.New()
	Matrix.RotateX( matrix, -90 )

	Karma.CreateBody("moreland", 2, false, position, Quatn.New(Vector.New(1, 0, 0), -90), Vector.New(1, 1, 1))

	myMagicFootSpeed = 2.0
	
	myFixedBlocks = 0
	myFreeBlocks = 0
	myFreeSpheres = 0
end

function MessageHeight(vec)
	Vector.TypeCheck(vec)
	if Segment.hf ~= nil then
		return Karma.HeightGetHeight(Segment.hf, vec)
	else
		return Vector.New(Vector.GetX(vec), Vector.GetY(position), Vector.GetZ(vec))
	end
end


function MessageUseHeightfield(pgm_name, pgm_x_size, pgm_z_size, texture_name, max_height, x_scale, z_scale )
	if Segment.moreland ~= nil then
		Segment.Destroy(Segment.moreland)
		Segment.moreland = nil
	end
	if Segment.land1 ~= nil then
		Segment.Destroy(Segment.land1)
		Segment.land1 = nil
	end
	if Segment.land2 ~= nil then
		Segment.Destroy(Segment.land2)
		Segment.land2 = nil
	end

	pgm_name = pgm_name .. ".pgm"
	local pos = Vector.New(0, -10, 0)
	Karma.LoadPGMHeightField("hf", pgm_name, pos + Vector.New(-(pgm_x_size-1) * x_scale / 2, 0, -(pgm_z_size-1) * z_scale / 2), max_height, x_scale, z_scale, texture_name, 1/(pgm_x_size*x_scale), 1/(pgm_z_size*z_scale))

end


function MessageStandardLights()
	local light1 = Visual.CreateLight( Visual.LIGHT_SOFTSPOT )
	local transform = Matrix.New()

	Matrix.SetTranslation( transform, Vector.New( 0, 20, 0 )+position )
	Matrix.LookAt( transform, Vector.New( 0, 0, 0 )+position, Vector.New( 1, 0, 0 )+position )
	Visual.SetLightTransform( light1, transform )
	Visual.SetLightRadius( light1, 50 )
	Visual.SetLightConeAngle( light1, 35 )
	Visual.SetLightColour( light1, Config.Get("light_spt1", 0.4), Config.Get("light_spt1", 0.4), Config.Get("light_spt1", 0.4))

	local light2 = Visual.CreateLight( Visual.LIGHT_AMBIENT )
	Visual.SetLightColour( light2, Config.Get("light_amb1", 0.4), Config.Get("light_amb1", 0.4), Config.Get("light_amb1", 0.4))

	local light3 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	Matrix.LookAt( transform, Vector.New( 10, 0, 20 )+position, Vector.New( 1, 0, 0 )+position )
	Visual.SetLightTransform( light3, transform )
	Visual.SetLightColour( light3, Config.Get("light_dir1", 0.3), Config.Get("light_dir1", 0.3), Config.Get("light_dir1", 0.3))

	local light4 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	Matrix.LookAt( transform, Vector.New( -20, 0, -15 )+position, Vector.New( 1, 0, 0 )+position )
	Visual.SetLightTransform( light4, transform )
	Visual.SetLightColour( light4, Config.Get("light_dir2", 0.3), Config.Get("light_dir2", 0.3), Config.Get("light_dir2", 0.3))

	--~ Matrix.SetTranslation( transform, Vector.New( 0, -20, 0 )+position )
	--~ local light5 = Visual.CreateLight( Visual.LIGHT_DIRECTIONAL )
	--~ Matrix.LookAt( transform, Vector.New( 0, 0, 0 )+position, Vector.New( 1, 0, 0 )+position)
	--~ Visual.SetLightTransform( light5, transform )
	--~ Visual.SetLightColour( light5, Config.Get("light_dir2", 0.05), Config.Get("light_dir2", 0.05), Config.Get("light_dir2", 0.05) )
end


function MessageFixedBlock( pos, size, orient, r,g,b )
	myFixedBlocks = myFixedBlocks + 1
	CreateCompositeCube("fixblock"..myFixedBlocks, false, pos+position, orient, size)
	--Karma.CreateBody( "fixblock"..myFixedBlocks, 1, false, pos+position, orient, size )
	Visual.Create("fixblock"..myFixedBlocks, 1, pos+position, orient, size, 1)
	Visual.SetColour(Segment.GetId("fixblock"..myFixedBlocks), r,g,b)
end
function MessageFreeBlock( pos, size, orient, r,g,b )
	myFreeBlocks = myFreeBlocks + 1
	--CreateCompositeCube("freeblock"..myFreeBlocks, 1, pos+position, orient, size)		-- Doesn't work DSB!
	Karma.CreateBody( "freeblock"..myFreeBlocks, 1, 1, pos+position, orient, size )
	Visual.Create("freeblock"..myFreeBlocks, 1, pos+position, orient, size, 1)
	Visual.SetColour(Segment.GetId("freeblock"..myFreeBlocks), r,g,b)
end


function CreateCompositeCube( cubeName, movable, position, rotation, scale )
	local maxSize = 4
	local nX = Number.ceil( Vector.GetX( scale ) / maxSize )
	local nY = Number.ceil( Vector.GetY( scale ) / maxSize )
	local nZ = Number.ceil( Vector.GetZ( scale ) / maxSize )
	local sX = Vector.GetX( scale ) / nX
	local sY = Vector.GetY( scale ) / nY
	local sZ = Vector.GetZ( scale ) / nZ
	local subScale = Vector.New( sX, sY, sZ )
	local geometries = {}
	local nGeometries = 0
	for iX = 1, nX do
		for iY = 1, nY do
			for iZ = 1, nZ do
				local p = position + (- 0.5 * scale + Vector.New( (iX-1) *sX, (iY-1)*sY, (iZ-1)*sZ ) + 0.5 * subScale ) *rotation
				local name = cubeName.."x"..iX.."y"..iY.."z"..iZ
				if movable == false then
					Karma.CreateBody( name, 1, false, p, rotation, subScale )
				else
					Karma.CreateGeometry( name, 1, p, rotation, subScale)
					nGeometries = nGeometries + 1
					geometries[ nGeometries ] = Segment.GetId( name )
				end
				
				--Visual.Create(name, 1, p, rotation, subScale, 1)
			end
		end
	end
	if movable ~= false then
		Karma.CreateBody( cubeName, geometries, movable, position, rotation, scale )
	end
end


function MessageFreeSphere( pos, size, r,g,b )
	myFreeSpheres = myFreeSpheres + 1
	Karma.CreateBody("freesphere"..myFreeSpheres, 0, 1, pos+position, Quatn.New(), size)
	Visual.Create("freesphere"..myFreeSpheres, 0, pos+position, Quatn.New(), size, 1)
	Visual.SetColour(Segment.GetId("freesphere"..myFreeSpheres), r,g,b)
end


function MessageShow( visible )
	Trace("evo change visible %", visible)
	if Segment.land1 ~= nil then
		Visual.SetVisible( Segment.land1, visible )
	end
	if Segment.land2 ~= nil then
		Visual.SetVisible( Segment.land2, visible )
	end
		
	for counter = 1, myFixedBlocks do
		Visual.SetVisible( Segment.GetId("fixblock"..counter), visible )
	end
	for counter = 1, myFreeBlocks do
		Visual.SetVisible( Segment.GetId("freeblock"..counter), visible )
	end
	for counter = 1, myFreeSpheres do
		Visual.SetVisible( Segment.GetId("freesphere"..counter), visible )
	end
	
	if Segment.hf ~= nill then
		if Config.Get("textured_heightfield", false) == false then
			local red = Config.Get("bluescreen_colour_red", 0 )
			local green = Config.Get("bluescreen_colour_green", 0 )
			local blue = Config.Get("bluescreen_colour_blue", 1 )
			Visual.SetColour(Segment.hf, red, green, blue, 0.01)
		end
	--Visual.SetVisible(Segment.GetId("hf"), Config.Get("textured_heightfield", false))
	end
	
	
	
end

function MessageDestroy()
	Agent.Destroy()
end

