# PoloTable specializes Agent embeds Visual, Karma, Input

function Initialize(s)

	if s == nil then
		-- query instanciation
		return
	end
	
	spec = s
	
	local worldScale =  1 --Config.Get("worldscale",1)
	spec.position = spec.position * worldScale
	spec.x = spec.x  * worldScale
	spec.y = spec.y * worldScale
	spec.z = spec.z * worldScale
	spec.hole_x = spec.hole_x  * worldScale
	spec.hole_z = spec.hole_z * worldScale

	

	HasPhysics = false
	if World.GetFlags() == 3 then
		HasPhysics = 1
	end
	
	Config.Set("theLand", Agent.Me())
	Create()
	
end

function Create()
	
	local table_x = spec.x
	local table_y = spec.y
	local table_z = spec.z
	local position = spec.position
	local pX, pY, pZ = Vector.GetXYZ( position )
	
	local holeX = spec.hole_x
	local holeZ = spec.hole_z
	-- make backwards compatible with series one contests
	if holeX == nil then
		holeX = 7
	end
	if holeZ == nil then
		holeZ = 10
	end
	if holeX > table_x - 1 then
		holeX = table_x - 1
	end
	if holeZ > table_z - 1 then
		holeZ = table_z - 1
	end
	local res = 4
	holeDepth = 1 / 0.04 --* Config.Get("worldscale",1)
	local wallThickness = 4 --* Config.Get("worldscale",1)
	local delta = 0.01
	myTables = {}
	MakeTable( pX-table_x/2,  pZ-table_z/2, pX-holeX/2, pZ+table_z/2, res, 1 )
	MakeTable( pX+holeX/2,  pZ-table_z/2, pX+table_x/2, pZ+table_z/2, res, 2 )
	myHasHole = false
	if holeX > delta and holeZ >delta then
		myHasHole = 1
		MakeTable( pX-holeX/2,  pZ-table_z/2, pX+holeX/2, pZ-holeZ/2, res, 3 )
		MakeTable( pX-holeX/2,  pZ+holeZ/2, pX+holeX/2, pZ+table_z/2, res, 4 )
	end

	local alpha = 1
	if HasPhysics ~= false then
	
		MakeFrontSkirt( pX-table_x/2, -holeDepth, pX+table_x/2, 0, pZ+table_z/2, res, "skirt1" )          
		MakeBackSkirt( pX-table_x/2, -holeDepth, pX+table_x/2, 0, pZ-table_z/2, res, "skirt2" )          
		MakeRightSkirt( pZ-table_z/2, -holeDepth, pZ+table_z/2, 0, pX+table_x/2, res, "skirt3" )          
		MakeLeftSkirt( pZ-table_z/2, -holeDepth, pZ+table_z/2, 0, pX-table_x/2, res, "skirt4" )          
		--Karma.CreateBody( "skirt1", 1, false, position+Vector.New(0,-holeDepth/2,-table_z/2+wallThickness/2), Quatn.New(), Vector.New(table_x,holeDepth,wallThickness) )
		--Karma.CreateBody( "skirt2", 1, false, position+Vector.New(0,-holeDepth/2,table_z/2-wallThickness/2), Quatn.New(), Vector.New(table_x,holeDepth,wallThickness) )
		--Karma.CreateBody( "skirt3", 1, false, position+Vector.New(-table_x/2+wallThickness/2,-holeDepth/2,0), Quatn.New(), Vector.New(wallThickness,holeDepth,table_z) )
		--Karma.CreateBody( "skirt4", 1, false, position+Vector.New(table_x/2-wallThickness/2,-holeDepth/2,0), Quatn.New(), Vector.New(wallThickness,holeDepth,table_z) )

		if myHasHole then
			MakeFrontSkirt( pX-holeX/2, -holeDepth, pX+holeX/2, 0, pZ-holeZ/2, res, "wall1" )          
			MakeBackSkirt( pX-holeX/2, -holeDepth, pX+holeX/2, 0, pZ+holeZ/2, res, "wall2" )          
			MakeRightSkirt( pZ-holeZ/2, -holeDepth, pZ+holeZ/2, 0, pX-holeX/2, res, "wall3" )          
			MakeLeftSkirt( pZ-holeZ/2, -holeDepth, pZ+holeZ/2, 0, pX+holeX/2, res, "wall4" )          
			--Karma.CreateBody( "wall1", 1, false, position+Vector.New(0,-holeDepth/2,-holeZ/2-wallThickness/2), Quatn.New(), Vector.New(holeX,holeDepth,wallThickness) )
			--Karma.CreateBody( "wall2", 1, false, position+Vector.New(0,-holeDepth/2,holeZ/2+wallThickness/2), Quatn.New(), Vector.New(holeX,holeDepth,wallThickness) )
			--Karma.CreateBody( "wall3", 1, false, position+Vector.New(-holeX/2-wallThickness/2,-holeDepth/2,0), Quatn.New(), Vector.New(wallThickness,holeDepth,holeZ) )
			--Karma.CreateBody( "wall4", 1, false, position+Vector.New(holeX/2+wallThickness/2,-holeDepth/2,0), Quatn.New(), Vector.New(wallThickness,holeDepth,holeZ) )
			Karma.CreateBody( "bottom", 1, false, position+Vector.New(0,-holeDepth - wallThickness/2,0), Quatn.New(), Vector.New(holeX,wallThickness,holeZ) )
		end
	
		-- Invisible floor
		local floorHeight=-1/0.04		-- in metres (0 = contest table top)
		Karma.CreateBody("floor", 2, false, Vector.New(0,floorHeight,0), Quatn.New(Vector.New(1, 0, 0), -90), Vector.New(1, 1, 1))
		Karma.CreateBody("invisible_wall", 2, false, position+Vector.New(0,0,(-0.7 *table_z)), Quatn.New(Vector.New(0, 1, 0), 0), Vector.New(1, 1, 1))
	else
		if spec.visible == false then
			alpha = Config.Get("invisible_alpha", 0.25)
		end
	end
	
	Visual.Create( "skirt1v", 1, position+Vector.New(0,-holeDepth/2,-table_z/2), Quatn.New(), Vector.New(table_x,holeDepth,0), 0 )
	Visual.Create( "skirt2v", 1, position+Vector.New(0,-holeDepth/2,table_z/2), Quatn.New(), Vector.New(table_x,holeDepth,0), 0 )
	Visual.Create( "skirt3v", 1, position+Vector.New(-table_x/2,-holeDepth/2,0), Quatn.New(), Vector.New(0,holeDepth,table_z), 0 )
	Visual.Create( "skirt4v", 1, position+Vector.New(table_x/2,-holeDepth/2,0), Quatn.New(), Vector.New(0,holeDepth,table_z),0 )
	local delta = 0.01
	if myHasHole then
		if spec.texture == nil then
			spec.texture = "plaster.png"
		end
		Visual.Create("wall1v", 1, position+Vector.New(0,-holeDepth/2,-holeZ/2-delta), Quatn.New(), Vector.New(holeX,holeDepth,0), 0, false, 0,
			"Agents/World/Target/"..spec.texture )
		Visual.Create( "wall2v", 1, position+Vector.New(0,-holeDepth/2,holeZ/2+delta), Quatn.New(), Vector.New(holeX,holeDepth,0), 0, false, 0,
			"Agents/World/Target/"..spec.texture )
		Visual.Create( "wall3v", 1, position+Vector.New(-holeX/2-delta,-holeDepth/2,0), Quatn.New(), Vector.New(0,holeDepth,holeZ), 0, false, 0, 
			"Agents/World/Target/"..spec.texture )
		Visual.Create( "wall4v", 1, position+Vector.New(holeX/2+delta,-holeDepth/2,0), Quatn.New(), Vector.New(0,holeDepth,holeZ), 0, false, 0, 
			"Agents/World/Target/"..spec.texture )
		Visual.Create( "bottomv", 1, position+Vector.New(0,-holeDepth,0), Quatn.New(), Vector.New(holeX,0,holeZ), 0 )
		if spec.red == nil then
			spec.red = 1
			spec.green = 1
			spec.blue = 1
		end
		Visual.SetColour( Segment.wall1v, spec.red, spec.green, spec.blue, 1 )
		Visual.SetColour( Segment.wall2v, spec.red, spec.green, spec.blue, 1  )
		Visual.SetColour( Segment.wall3v, spec.red, spec.green, spec.blue, 1  )
		Visual.SetColour( Segment.wall4v, spec.red, spec.green, spec.blue, 1  )
		Visual.SetColour( Segment.bottomv, 0, 0, 0, alpha )
		--Visual.SetVisible(Segment.wall1v, false )
		--Visual.SetVisible(Segment.wall2v, false )
		--Visual.SetVisible(Segment.wall3v, false )
		--Visual.SetVisible(Segment.wall4v, false )
	end
end

function MessageClone()
	return Agent.Create( "PoloTable", spec )
end


function MessageGetOABB()
	return spec.position+Vector.New(0,-holeDepth/2,0), Vector.New(spec.x,holeDepth,spec.z)
end                                                                                   
                                                                                        
function MakeTable( minX, minZ, maxX, maxZ, res, name )          
	local sizeX = Number.ceil( (maxX-minX) / res )
	local sizeZ = Number.ceil( (maxZ-minZ) / res )
	local sX = (maxX-minX) / sizeX
	local sZ = (maxZ-minZ) / sizeZ

	local gindex = 0
	local gindex1 = 0
	local mesh = {vertices = {}, normals = {}, indices = {}, texture_coordinates = {}}

	for i = 0, sizeX do
		for j =0, sizeZ do
			gindex = gindex + 1
			mesh.vertices[gindex] = Vector.New( minX + i*sX, 0, minZ + j*sZ )
			mesh.texture_coordinates[gindex*2-1] = (minX + i*sX)/40
			mesh.texture_coordinates[gindex*2] = (minZ + j*sZ)/40
			mesh.normals[gindex] = Vector.New( 0,1,0 )
			if i < sizeX and j < sizeZ then
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex - 1
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeZ
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeZ
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeZ+1
			end
		end
	end
	mesh.texture = "Agents/World/Target/Plaster.png"
	local vis = Visual.Create( "poly"..name, mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1,1,1),1 )
	myTables[ vis ] = vis
	if HasPhysics ~= false then
		Karma.CreatePolysoup( "poly"..name, mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1,1,1) )
	end
end

function MakeFrontSkirt( minX, minY, maxX, maxY, Z, res, name )          
	local sizeX = Number.ceil( (maxX-minX) / res )
	local sizeY = Number.ceil( (maxY-minY) / res )
	local sX = (maxX-minX) / sizeX
	local sY = (maxY-minY) / sizeY

	local gindex = 0
	local gindex1 = 0
	local mesh = {vertices = {}, normals = {}, indices = {}, texture_coordinates = {}}

	for i = 0, sizeX do
		for j =0, sizeY do
			gindex = gindex + 1
			mesh.vertices[gindex] = Vector.New( minX + i*sX, maxY - j*sY, Z )
			mesh.normals[gindex] = Vector.New( 0,0,1 )
			if i < sizeX and j < sizeY then
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex - 1
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY+1
			end
		end
	end
	if HasPhysics ~= false then
		Karma.CreatePolysoup( "poly"..name, mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1,1,1) )
	end
end

function MakeBackSkirt( minX, minY, maxX, maxY, Z, res, name )          
	local sizeX = Number.ceil( (maxX-minX) / res )
	local sizeY = Number.ceil( (maxY-minY) / res )
	local sX = (maxX-minX) / sizeX
	local sY = (maxY-minY) / sizeY

	local gindex = 0
	local gindex1 = 0
	local mesh = {vertices = {}, normals = {}, indices = {}, texture_coordinates = {}}

	for i = 0, sizeX do
		for j =0, sizeY do
			gindex = gindex + 1
			mesh.vertices[gindex] = Vector.New( minX + i*sX, minY + j*sY, Z )
			mesh.normals[gindex] = Vector.New( 0,0,-1 )
			if i < sizeX and j < sizeY then
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex - 1
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY+1
			end
		end
	end
	if HasPhysics ~= false then
		Karma.CreatePolysoup( "poly"..name, mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1,1,1) )
	end
end

function MakeRightSkirt( minZ, minY, maxZ, maxY, X, res, name )          
	local sizeZ = Number.ceil( (maxZ-minZ) / res )
	local sizeY = Number.ceil( (maxY-minY) / res )
	local sZ = (maxZ-minZ) / sizeZ
	local sY = (maxY-minY) / sizeY

	local gindex = 0
	local gindex1 = 0
	local mesh = {vertices = {}, normals = {}, indices = {}, texture_coordinates = {}}

	for i = 0, sizeZ do
		for j =0, sizeY do
			gindex = gindex + 1
			mesh.vertices[gindex] = Vector.New( X, maxY - j*sY, maxZ - i*sZ )
			mesh.normals[gindex] = Vector.New( 1,0,0 )
			if i < sizeZ and j < sizeY then
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex - 1
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY+1
			end
		end
	end
	if HasPhysics ~= false then
		Karma.CreatePolysoup( "poly"..name, mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1,1,1) )
	end
end

function MakeLeftSkirt( minZ, minY, maxZ, maxY, X, res, name )          
	local sizeZ = Number.ceil( (maxZ-minZ) / res )
	local sizeY = Number.ceil( (maxY-minY) / res )
	local sZ = (maxZ-minZ) / sizeZ
	local sY = (maxY-minY) / sizeY

	local gindex = 0
	local gindex1 = 0
	local mesh = {vertices = {}, normals = {}, indices = {}, texture_coordinates = {}}

	for i = 0, sizeZ do
		for j =0, sizeY do
			gindex = gindex + 1
			mesh.vertices[gindex] = Vector.New( X, maxY - j*sY, minZ + i*sZ )
			mesh.normals[gindex] = Vector.New( -1,0,0 )
			if i < sizeZ and j < sizeY then
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex - 1
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex
				gindex1 = gindex1 + 1
				mesh.indices[ gindex1 ] = gindex + sizeY+1
			end
		end
	end
	if HasPhysics ~= false then
		Karma.CreatePolysoup( "poly"..name, mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1,1,1) )
	end
end

function MessageHeight(vec)
	return Vector.New( Vector.GetX( vec ), 0, Vector.GetY( vec ) )
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

function BlueScreen( segment )
	local red = Config.Get("bluescreen_colour_red", 0 )
	local green = Config.Get("bluescreen_colour_green", 0 )
	local blue = Config.Get("bluescreen_colour_blue", 1 )
	Visual.SetColour(segment, red, green, blue, 0.01)
	--Visual.SetLit( segment, false )
end

function MessageShow( visible )
	Trace( "Hiding table" )
	if Segment.poly1 ~= nil then
		if visible == false then
			if Config.Get("textured_heightfield", false) == false then
				BlueScreen( Segment.poly1 )
				BlueScreen( Segment.poly2 )
				if myHasHole then
					BlueScreen( Segment.poly3 )
					BlueScreen( Segment.poly4 )
				end
				BlueScreen( Segment.skirt1v )
				BlueScreen( Segment.skirt2v )
				BlueScreen( Segment.skirt3v )
				BlueScreen( Segment.skirt4v )
			end
		else
			if Config.Get("textured_heightfield", false) == false then
				local alpha = 1
				if HasPhysics == false and s.visible == false then
					alpha = Config.Get("invisible_alpha", 0.25)
				end

				Visual.SetColour(Segment.poly1, 1, 1, 1, alpha)
				Visual.SetColour(Segment.poly2, 1, 1, 1, alpha)
				if myHasHole then
					Visual.SetColour(Segment.poly3, 1, 1, 1, alpha)
					Visual.SetColour(Segment.poly4, 1, 1, 1, alpha)
				end
				Visual.SetColour(Segment.skirt1v, 1, 1, 1, alpha)
				Visual.SetColour(Segment.skirt2v, 1, 1, 1, alpha)
				Visual.SetColour(Segment.skirt3v, 1, 1, 1, alpha)
				Visual.SetColour(Segment.skirt4v, 1, 1, 1, alpha)
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
	return Number.sqrt((spec.x*spec.x)+(spec.y*spec.y)+(spec.z*spec.z))
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
				x = 6.3/0.04,
				y = 1/0.04,	
				z = 2.52/0.04,
				hole_x = 7,
				hole_z = 10,
				position = Vector.New(),
				group = "0"	
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = 1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "hole_x", label = "Hole Width", default = 7, min = 0, max = 200, scale = 4  },
				{ name = "hole_z", label = "Hole Height", default = 10, min = 0, max = 200, scale = 4  },
				{ name = "x", label = "x", icon = "WidthObj", default = 6.3/0.04, min = 1, max = 200, scale = 4 },
				{ name = "y", label = "y", icon = "HeightObj", default = 1/0.04, min = 1, max = 200, scale = 4 },
				{ name = "z", label = "z", icon = "DepthObj",  default = 2.52/0.04, min = 1, max = 200, scale = 4 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "flags", label = "Studio Flags", edit = "0" },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 }
			}
		}
	}
	return types
end

function MessageSetVisualFlags(flags)
	flags = tonumber( flags )
	if flags == nil then flags = 0 end
	Visual.SetFlags( Segment.skirt1v, 1024 + flags )
	Visual.SetFlags( Segment.skirt2v, 1024 + flags  )
	Visual.SetFlags( Segment.skirt3v, 1024 + flags  )
	Visual.SetFlags( Segment.skirt4v, 1024 + flags  )

	for index, t in myTables do
		Visual.SetFlags( t, 1024 + flags  )
	end

	if myHasHole then
		Visual.SetFlags(Segment.wall1v, flags )
		Visual.SetFlags(Segment.wall2v, flags )
		Visual.SetFlags(Segment.wall3v, flags )
		Visual.SetFlags(Segment.wall4v, flags )
		Visual.SetFlags(Segment.bottomv, flags )
	end
	--~ if flags == nil then
		--~ flags = 0
	--~ else
		--~ flags = tonumber(flags)
	--~ end
	
	--~ local segments = Segment.GetIds()
	--~ for i,v in segments do
		--~ Visual.SetFlags(v, flags)
	--~ end
	
end
