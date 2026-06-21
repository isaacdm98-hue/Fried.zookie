#Target specializes BaseTarget embeds Visual, Karma, Input

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
		
	local spec = Execute("BreakObjects", spec )
	CalcPosition(spec)
	myMovePathActive = false
	

	
	-- if has physics
	if World.GetFlags() == 3 then

		
		-- create aggregate geometries
		local geometrySpecs = spec.geometries
		local total = 0
		geometries = nil
		if spec.geometries ~= nil then
			geometries = {}
			for i, v in spec.geometries do
				total = total + 1
				geometries[total] = CreateGeometry( total, v )
			end
		end

			
		if spec.density == nil then
			spec.density = 1
		end
		if spec.movepath ~= nil and spec.movepath then
			spec.movable = 1
		end
		
		if total == 0 then
			-- no agregation so create master spec body
			CalcShape( spec )
			Karma.CreateBody("target", spec.shape, spec.movable, spec.position, CalcRotation(spec), spec.scale, spec.density)
		else
			-- aggregation so create geometry for master spec body and then create body aggregate for all 
			--total = total + 1
			--geometries[total] = CreateGeometry( total, spec )
			Trace("about to create aggregate")
			Karma.CreateBody("target", geometries, spec.movable, spec.position, CalcRotation(spec), spec.scale, spec.density)
			Trace("created aggregate")
		end
		CreateVisual(Segment.target, spec)

		if spec.mass ~= nil then
			Karma.SetMass(Segment.target, spec.mass)
		end
	
		if spec.friction ~= nil then
			Karma.SetFriction(Segment.target, spec.friction, 0.5, 0, 0, 0, 0)
		end
	
		if spec.damping ~= nil then
			Karma.SetLinearVelocityDamping(Segment.target, spec.damping)
		end
	
		if spec.frozen ~= nil then
			Karma.FreezeBody( Segment.target )
		end
	
		if spec.angular_damping ~= nil then
			Karma.SetAngularVelocityDamping(Segment.target, spec.angular_damping)
		end

		MessageSetSolidity(spec.solid)
		Trace("geometries done")

		AffirmCreation(Segment.target)
	
		-- constraint stuff - requires a table constraint = { axes = Vector, angle = Number }
		if spec.constraint ~= nil then
			Karma.ConstrainAxis(Segment.target, spec.constraint.axes, spec.constraint.angle)
		end		
		if spec.prismatic ~= nil then
			Karma.CreatePrismatic( "prismatic", Segment.target, 0, spec.prismatic )
		end
		if spec.movepath ~= nil and spec.movepath then
			if spec.movedelay == nil or spec.movedelay == false then
				Karma.CreateFixedPath( "movepath", Segment.target, 0,  spec.movetime,  spec.moveaccel, 
					spec.movephase, spec.moveposition)
				myLastPos = spec.position
				myMovePathActive = 1
			end
		end
		MakeConstraints( spec )
		
		MessageSetVisible(spec.visible)
	
	else
		CalcShape( spec )
		CreateVisual("target", spec)
	end
	
	



	-- moving target stuff - requires a table move = { to = Vector, force = Vector, tolerance = Number }
	if spec.move ~= nil then
		pos = {}
		pos[1] = spec.position
		pos[2] = spec.move.to
		current_pos = 1
		Move()	
	end
end

function MessageGetSpec()
	return spec
end

function MessageStartMove(params)
	Trace( "Starting move")
	if spec.movepath ~= nil and spec.movepath and not myMovePathActive then
		Karma.CreateFixedPath( "movepath", Segment.target, 0,  spec.movetime,  spec.moveaccel, 
			spec.movephase, spec.moveposition)
		myLastPos = spec.position
		myMovePathActive = 1
	end
end

function MessageStopMove(params)
	Trace( "Stopping move")
	if myMovePathActive then
		myMovePathActive = false
		Segment.Destroy( Segment.movepath )
	end
end

function MessageHaltMove(params)
	Trace( "Halting move")
	if myMovePathActive then
		myMovePathActive = false
		Segment.Destroy( Segment.movepath )
	end
	Karma.SetLinearVelocity( Segment.target, Vector.New(0,0,0) )
end

function TimerMovePath()
	local newPos = Vector.New( Number.sin( World.SimTime()*100 )*4, 4, 0 )
	Karma.SetFixedPathPosition( Segment.movepath, Vector.New( Number.sin( World.SimTime()*100 )*4, 4, 0 ) )
	Karma.SetFixedPathVelocity( Segment.movepath, 0.1 * ( newPos - myLastPos ) )
	myLastPos = newPos
end

function MakeConstraints( spec )
	local linear, x, y, z = 0, 0, 0, 0
	if spec.xconstrain ~= nil and spec.xconstrain  then
		linear = linear + 1
		x = 1
	end
	if spec.yconstrain ~= nil and spec.yconstrain  then
		linear = linear + 1
		y = 1
	end
	if spec.zconstrain ~= nil and spec.zconstrain  then
		linear = linear + 1
		z = 1
	end

	if linear == 3 then
		Karma.CreateBallAndSocket( "ballandsocket", Segment.target, 0,  spec.position)
	elseif linear == 2 then
		Karma.CreateKeepOnLine( "keeponline", Segment.target, 0, Vector.New(1-x,1-y,1-z) )
	elseif linear == 1 then
		Karma.CreateKeepOnPlane( "keeponplane", Segment.target, 0, Vector.New(x,y,z) )
	end
		
	local rot, x, y, z = 0, 0, 0, 0
	if spec.xrotconstrain ~= nil and spec.xrotconstrain  then
		rot = rot + 1
		x = 1
	end
	if spec.yrotconstrain ~= nil and spec.yrotconstrain  then
		rot = rot + 1
		y = 1
	end
	if spec.zrotconstrain ~= nil and spec.zrotconstrain  then
		rot = rot + 1
		z = 1
	end
	
	if rot == 3 then
		Karma.CreateNoRotate( "norotate", Segment.target, 0 )
	elseif rot == 2 then
		Karma.CreateRotateOneAxis( "rotateoneaxis", Segment.target, 0, Vector.New(1-x,1-y,1-z) )
	end
		
end

function MessageClone()
	return Agent.Create( "Target", spec )
end

function MessageGetOABB()
	local scale = spec.scale
	local x, y, z = Vector.GetXYZ( scale )
	if spec.shape == "cylinder" then
		scale = Vector.New( x, x, z )
	elseif spec.shape == "capsule" then
		scale = Vector.New( x, x, z+x )
	elseif spec.shape == "sphere" or spec.shape == "ball" then
		local d = 2 * Number.sqrt( x *x + y * y + z * z )
		scale =Vector.New( d, d, d )
	end
	return GetObjectCentre(spec), scale
end

function GetObjectCentre(s)
	-- adjust position around base not centre (unless sphere)
	if s.shape == "cylinder" or s.shape == "capsule" then
		local heightAlteration = Vector.New(0,Vector.GetX(s.scale)/2, 0) * CalcRotation(s)
		return s.position + Vector.New(0,Vector.GetY(heightAlteration), 0)
	elseif s.shape == "ball" then
		return s.position + Vector.New(0, Vector.GetLength(s.scale), 0)
	elseif s.shape ~= "sphere" then
		local heightAlteration = Vector.New(0,Vector.GetY(s.scale)/2, 0) * CalcRotation(s)
		return s.position + Vector.New(0,Vector.GetY(heightAlteration), 0)
	else
		return s.position
	end
end

function CalcPosition(s)
	s.position = GetObjectCentre(s)
end


function CreateGeometry( num, s )
	
	CalcShape( s ) 

	local segment_name  = "geometry_" .. num

	Karma.CreateGeometry(segment_name, s.shape, s.position, CalcRotation(s), s.scale)

	local segmentId = Segment.GetId(segment_name)
	if s.visual ~= nil and s.visual ~= false then
		CreateVisual(segmentId, s)
	end

	return segmentId

end


function CalcShape( s ) 

	-- Note alters s.shape in spent data

	local shape
	if s.shape == "sphere" or spec.shape == "ball" then
		shape = 0
	elseif s.shape == "cube" then
		shape = 1
	elseif s.shape == "cylinder" then
		shape = 3
	elseif s.shape == "capsule" then
		shape = 4
	elseif s.shape == "wedge" then
		shape = WedgeMesh()
	end

	--~ if shape == 1 then
		--~ CreateCompositeCube( s.movable, s.position, s.rotation, s.scale, s.density )
	--~ else
		--~ Karma.CreateBody("target", shape, s.movable, s.position, s.rotation, s.scale, s.density)
	--~ end

	s.shape = shape

end


function CreateVisual(segmentId, s)

	local segment_name = segmentId	-- may be a string if only a visual is created
	if String.TypeCheck(segmentId, 1) == false then
		segment_name = Segment.GetName(segmentId)
	end
	
	
	if s.texture ~= nil then
		if String.strfind(s.texture, "/") ~= nil  then
			segmentId= Visual.Create(segment_name, s.shape, s.position, CalcRotation(s), s.scale, 1, false, 0.5, s.texture)
		else
			segmentId= Visual.Create(segment_name, s.shape, s.position, CalcRotation(s), s.scale, 1, false, 0.5, "Agents/World/Target/"..s.texture)
		end
	elseif spec.texture ~= nil then
		if String.strfind(spec.texture, "/") ~= nil  then
			segmentId =Visual.Create(segment_name, s.shape, s.position, CalcRotation(s), s.scale, 1, false, 0.5, spec.texture)
		else
			segmentId =Visual.Create(segment_name, s.shape, s.position, CalcRotation(s), s.scale, 1, false, 0.5, "Agents/World/Target/"..spec.texture)
		end
	else
		segmentId =Visual.Create(segment_name, s.shape, s.position, CalcRotation(s), s.scale, 1)
	end
	
	-- refer to master spec
	if spec.shadow ~= nil and spec.shadow ~= false then
		Visual.SetShadow( segmentId, 1 )
	end
	
	local alpha = 1
	if s.visible == false then
		alpha = Config.Get("invisible_alpha", 0.25)
		Visual.SetTransparent( segmentId, 1 )
	end

	if s.transparent ~= nil and  s.transparent then
		Visual.SetTransparent( segmentId, 1 )
	end

	if s.chroma ~= nil then
		local red = Config.Get("bluescreen_colour_red", 0 )
		local green = Config.Get("bluescreen_colour_green", 0 )
		local blue = Config.Get("bluescreen_colour_blue", 0 )
		Visual.SetColour(segmentId, red, green, blue, alpha)
	elseif s.red ~= nil and s.green ~= nil and s.blue ~= nil then
		Visual.SetColour(segmentId, s.red, s.green, s.blue, alpha)
	else
		-- refer to master spec
		Visual.SetColour(segmentId, spec.red, spec.green, spec.blue, alpha)
	end
	
	if s.flags ~= nil then
	--	Visual.SetFlags( segmentId, s.flags )
	end

end

function MessageTestIntersect( otherAgent )
	local agents = {otherAgent}
	return Karma.TestIntersect( agents, {}, false, false ) ~= 0
end

function MessageSetVisible(visible)
	Visual.SetVisible(Segment.target, visible)
end


function MessageSetSolidity(s)
	Karma.SetSolidity(Segment.target, s)
end



function MessageIntersect(agents, ignore)
	return Karma.TestIntersect(agents, ignore, 1, false)
end


function SystemArrived(location)
	Move()
end


function Move()

	if current_pos == 1 then
		current_pos = 2
	else
		current_pos = 1
	end

	Trace("Setting target pos %", current_pos)
	Karma.MoveTo(Segment.target, pos[current_pos], spec.move.force, spec.move.tolerance)

end


function MessageSetPosition(data)
	Karma.SetPosition(Segment.target, data.position)
	Visual.MoveTo(Segment.target, data.position)
end

function MessageGetPosition()
	return Karma.GetPosition(Segment.target)
end


function WedgeMesh()
	local mesh = {}
	mesh.vertices = {
		Vector.New( .5, -.5, -.5 ),
		Vector.New( .5, -.5, .5 ),
		Vector.New( -.5, -.5, .5 ),
		Vector.New( -.5, -.5, -.5 ),
		Vector.New( .5, .5, .5 ),
		Vector.New( -.5, .5, .5 )
	}
	return mesh
end

function CalcRotation( spec )
	if spec.eulers ~= nil then
		return Quatn.New( Vector.GetXYZ( spec.eulers ) )
	else
		return Quatn.New()
	end
end

function CreateCompositeCube( movable, position, rotation, scale, density )
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
				local name = "x"..iX.."y"..iY.."z"..iZ
				if movable == false then
					Karma.CreateBody( name, 1, false, p, rotation, subScale, density )
				else
					Karma.CreateGeometry( name, 1, p, rotation, subScale)
				end
				
				--Visual.Create(name, 1, p, rotation, subScale, 1)
				
				nGeometries = nGeometries + 1
				geometries[ nGeometries ] = Segment.GetId( name )
			end
		end
	end
	if movable == false then
		Karma.CreateBody( cubeName, geometries, movable, position, rotation, scale, density )
	end
end




function MessageShoot( segment, point, dir, strength )
	dir = Vector.Normalise( dir )
	dir = strength * dir
	--Trace("Shot!!")
	Karma.AddImpulse( segment, dir, point )
end


-- FUNCTIONS BELOW ARE REQUIRED FOR THE CONTEST EDITOR


function MessageDestroy()
	Agent.Destroy()
end

function MessageSpec()
	if spec.shape == "sphere" or spec.shape == "ball" then
		-- ensure radius is in x for export
		local table = Clone(spec)	
		table.scale = Vector.New(Vector.GetLength(table.scale), 0, 0)
		return table
	end
	return spec
end


function MessageBoundingSphere()
	if spec.shape == "sphere"  or spec.shape == "ball" then
		return Vector.GetLength(spec.scale)*2
	end
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
	local s = Clone(spec)
	CalcPosition( s )
	CalcShape( s ) 
	CreateVisual( Segment.target, s )
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
			name = "ball",	-- same as spere but positioned around base not centre
			default = { 
				description = "",
				shape = "ball", 					-- specifies shape (sphere, cube, cylinder, capsule)
				movable = 1,						-- does not move 
				position = Vector.New(0,0,0), 						-- far left, centre table location
				rotation = Quatn.New(Vector.New(0,1,0), 90),	-- rotated around Y axis (X,Y,Z)=(0,1,0) by 90 degrees
				scale = Vector.New(0.5,0,0), 				-- absoulte size; will not scale with table size
				red =  0.5, 
				green = 0.5,
				blue = 0.5,  
				visible = 1, 						-- invisible
				solid = 1,						-- not solid; can be walked through
				shadow = 1,						-- does not cast shadows	
				density = 1,
				group = "0"
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "scalex", label = "Radius",  tab = "Physical", icon = "WidthObj", default = 0.5, min = .1, max = 75, scale = 4 },
				{ name = "movable", label = "Movable", tab = "Physical", check = false },
				{ name = "solid", label = "Solid", tab = "Physical", check = 1 },
				{ name = "density", label = "Density", tab = "Physical", default = 1, min = 0.01, max = 10, scale = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "xconstrain", label = "Constrain X", tab = "Constraints", top =1, check = 1 },
				{ name = "yconstrain", label = "Constrain Y", tab = "Constraints", check = 1 },
				{ name = "zconstrain", label = "Constrain Z", tab = "Constraints", check = 1 },
				{ name = "xrotconstrain", label = "Constrain X Rotation", tab = "Constraints", top =1, check = 1 },
				{ name = "yrotconstrain", label = "Constrain Y Rotation", tab = "Constraints", check = 1 },
				{ name = "zrotconstrain", label = "Constrain Z Rotation", tab = "Constraints", check = 1 },
				{ name = "movepath", label = "Move Path", tab = "Constraints", top =1, check = 1 },
				{ name = "movedelay", label = "Delay Move", tab = "Constraints", top =1, check = 1 },
				{ name = "moveposition", label = "Move Position", tab = "Constraints", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "movetime", label = "Move Time", tab = "Constraints", default = 1, min = 0.1, max = 40, scale = 1 },
				{ name = "movephase", label = "Move Phase", tab = "Constraints", default = 0, min = 0, max = 1, scale = 1 },
				{ name = "moveaccel", label = "Move Acceleration", tab = "Constraints", default = 0.5, min = 0, max = 1, scale = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		},
		{
			name = "capsule",
			default = { 
				description = "",
				shape = "capsule", 					-- specifies shape (sphere, cube, cylinder, capsule)
				movable = false,						-- does not move 
				position = Vector.New(0,0,0), 						-- far left, centre table location
				eulers = Vector.New(0,0,0),
				scale = Vector.New(1,1,1), 				-- absoulte size; will not scale with table size
				red =  0.5, 
				green = 0.5,
				blue = 0.5,  
				visible = 1, 						-- invisible
				texture = "plaster",
				solid = 1,						-- not solid; can be walked through
				shadow = 1,						-- does not cast shadows
				density = 1,
				group = "0"
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "eulers", label = "Orientation", vector = 5, default = Vector.New(0,0,0) },
				{ name = "scalex", label = "Width", tab = "Physical", icon = "WidthObj", default = 1, min = .1, max = 150, scale = 4 },
				{ name = "scalez", label = "Length",tab = "Physical", icon = "DepthObj",  default = 1, min = .1, max = 150, scale = 4 },
				{ name = "movable", label = "Movable", tab = "Physical", check = false },
				{ name = "solid", label = "Solid", tab = "Physical", check = 1 },
				{ name = "density", label = "Density", tab = "Physical", default = 1, min = 0.01, max = 10, scale = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "xconstrain", label = "Constrain X", tab = "Constraints", top =1, check = 1 },
				{ name = "yconstrain", label = "Constrain Y", tab = "Constraints", check = 1 },
				{ name = "zconstrain", label = "Constrain Z", tab = "Constraints", check = 1 },
				{ name = "xrotconstrain", label = "Constrain X Rotation", tab = "Constraints", top =1, check = 1 },
				{ name = "yrotconstrain", label = "Constrain Y Rotation", tab = "Constraints", check = 1 },
				{ name = "zrotconstrain", label = "Constrain Z Rotation", tab = "Constraints", check = 1 },
				{ name = "movepath", label = "Move Path", tab = "Constraints", top =1, check = 1 },
				{ name = "movedelay", label = "Delay Move", tab = "Constraints", top =1, check = 1 },
				{ name = "moveposition", label = "Move Position", tab = "Constraints", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "movetime", label = "Move Time", tab = "Constraints", default = 1, min = 0.1, max = 40, scale = 1 },
				{ name = "movephase", label = "Move Phase", tab = "Constraints", default = 0, min = 0, max = 1, scale = 1 },
				{ name = "moveaccel", label = "Move Acceleration", tab = "Constraints", default = 0.5, min = 0, max = 1, scale = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		},
		{
			name = "cube",
			default = { 
				description = "",
				shape = "cube", 					-- specifies shape (sphere, cube, cylinder, capsule)
				movable = false,						-- does not move 
				position = Vector.New(0,0,0), 						-- far left, centre table location
				eulers = Vector.New(0,0,0),
				scale = Vector.New(1,1,1), 				-- absoulte size; will not scale with table size
				red =  0.5, 
				green = 0.5,
				blue = 0.5,  
				visible = 1, 						-- invisible
				texture = "plaster",
				solid = 1,						-- not solid; can be walked through
				shadow = 1,						-- does not cast shadows	
				density = 1,
				transparent = false,
				group = "0"

			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "eulers", label = "Orientation", vector = 5, default = Vector.New(0,0,0) },
				{ name = "scalex", label = "Width", tab = "Physical", icon = "WidthObj", default = 1, min = .01, max = 150, scale = 4 },
				{ name = "scaley", label = "Height", tab = "Physical", icon = "HeightObj", default = 1, min = .01, max = 150, scale = 4 },
				{ name = "scalez", label = "Length", tab = "Physical", icon = "DepthObj",  default = 1, min = .01, max = 150, scale = 4 },
				{ name = "movable", label = "Movable", tab = "Physical", check = false },
				{ name = "solid", label = "Solid", tab = "Physical", check = 1 },
				{ name = "density", label = "Density", tab = "Physical", default = 1, min = 0.01, max = 10, scale = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "transparent", label = "Transparent", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "xconstrain", label = "Constrain X", tab = "Constraints", top =1, check = 1 },
				{ name = "yconstrain", label = "Constrain Y", tab = "Constraints", check = 1 },
				{ name = "zconstrain", label = "Constrain Z", tab = "Constraints", check = 1 },
				{ name = "xrotconstrain", label = "Constrain X Rotation", tab = "Constraints", top =1, check = 1 },
				{ name = "yrotconstrain", label = "Constrain Y Rotation", tab = "Constraints", check = 1 },
				{ name = "zrotconstrain", label = "Constrain Z Rotation", tab = "Constraints", check = 1 },
				{ name = "movepath", label = "Move Path", tab = "Constraints", top =1, check = 1 },
				{ name = "movedelay", label = "Delay Move", tab = "Constraints", top =1, check = 1 },
				{ name = "moveposition", label = "Move Position", tab = "Constraints", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "movetime", label = "Move Time", tab = "Constraints", default = 1, min = 0.1, max = 40, scale = 1 },
				{ name = "movephase", label = "Move Phase", tab = "Constraints", default = 0, min = 0, max = 1, scale = 1 },
				{ name = "moveaccel", label = "Move Acceleration", tab = "Constraints", default = 0.5, min = 0, max = 1, scale = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		},
		{
			name = "cylinder",
			default = { 
				description = "",
				shape = "cylinder", 					-- specifies shape (sphere, cube, cylinder, capsule)
				movable = false,						-- does not move 
				position = Vector.New(0,0,0), 						-- far left, centre table location
				eulers = Vector.New(0,0,0),
				scale = Vector.New(1,1,1), 				-- absoulte size; will not scale with table size
				red =  0.5, 
				green = 0.5,
				blue = 0.5,  							
				visible = 1, 						-- invisible
				texture = "plaster",
				solid = 1,						-- not solid; can be walked through
				shadow = 1,						-- does not cast shadows	
				density = 1,
				group = "0"
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "eulers", label = "Orientation", vector = 10, default = Vector.New(0,0,0) },
				{ name = "scalex", label = "Width", tab = "Physical", icon = "WidthObj", default = 1, min = .1, max = 150, scale = 4 },
				{ name = "scalez", label = "Length", tab = "Physical", icon = "DepthObj",  default = 1, min = .1, max = 150, scale = 4 },
				{ name = "movable", label = "Movable", tab = "Physical", check = false },
				{ name = "solid", label = "Solid", tab = "Physical", check = 1 },
				{ name = "density", label = "Density", tab = "Physical", default = 1, min = 0.01, max = 10, scale = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "xconstrain", label = "Constrain X", tab = "Constraints", top =1, check = 1 },
				{ name = "yconstrain", label = "Constrain Y", tab = "Constraints", check = 1 },
				{ name = "zconstrain", label = "Constrain Z", tab = "Constraints", check = 1 },
				{ name = "xrotconstrain", label = "Constrain X Rotation", tab = "Constraints", top =1, check = 1 },
				{ name = "yrotconstrain", label = "Constrain Y Rotation", tab = "Constraints", check = 1 },
				{ name = "zrotconstrain", label = "Constrain Z Rotation", tab = "Constraints", check = 1 },
				{ name = "movepath", label = "Move Path", tab = "Constraints", top =1, check = 1 },
				{ name = "movedelay", label = "Delay Move", tab = "Constraints", top =1, check = 1 },
				{ name = "moveposition", label = "Move Position", tab = "Constraints", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "movetime", label = "Move Time", tab = "Constraints", default = 1, min = 0.1, max = 40, scale = 1 },
				{ name = "movephase", label = "Move Phase", tab = "Constraints", default = 0, min = 0, max = 1, scale = 1 },
				{ name = "moveaccel", label = "Move Acceleration", tab = "Constraints", default = 0.5, min = 0, max = 1, scale = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		},
		{
			name = "sphere",
			default = { 
				description = "",
				shape = "sphere", 					-- specifies shape (sphere, cube, cylinder, capsule)
				movable = false,						-- does not move 
				position = Vector.New(0,0,0), 						-- far left, centre table location
				rotation = Quatn.New(Vector.New(0,1,0), 90),	-- rotated around Y axis (X,Y,Z)=(0,1,0) by 90 degrees
				scale = Vector.New(0.5,0,0), 				-- absoulte size; will not scale with table size
				red =  0.5, 
				green = 0.5,
				blue = 0.5,  
				visible = 1, 						-- invisible
				solid = false,						-- not solid; can be walked through
				shadow = 1,						-- does not cast shadows	
				density = 1,
				group = "0"
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "scalex", label = "Radius", tab = "Physical", icon = "WidthObj", default = 0.5, min = .1, max = 75, scale = 4 },
				{ name = "movable", label = "Movable", tab = "Physical", check = false },
				{ name = "solid", label = "Solid", tab = "Physical", check = 1 },
				{ name = "density", label = "Density", tab = "Physical", default = 1, min = 0.01, max = 10, scale = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "xconstrain", label = "Constrain X", tab = "Constraints", top =1, check = 1 },
				{ name = "yconstrain", label = "Constrain Y", tab = "Constraints", check = 1 },
				{ name = "zconstrain", label = "Constrain Z", tab = "Constraints", check = 1 },
				{ name = "xrotconstrain", label = "Constrain X Rotation", tab = "Constraints", top =1, check = 1 },
				{ name = "yrotconstrain", label = "Constrain Y Rotation", tab = "Constraints", check = 1 },
				{ name = "zrotconstrain", label = "Constrain Z Rotation", tab = "Constraints", check = 1 },
				{ name = "movepath", label = "Move Path", tab = "Constraints", top =1, check = 1 },
				{ name = "movedelay", label = "Delay Move", tab = "Constraints", top =1, check = 1 },
				{ name = "moveposition", label = "Move Position", tab = "Constraints", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "movetime", label = "Move Time", tab = "Constraints", default = 1, min = 0.1, max = 40, scale = 1 },
				{ name = "movephase", label = "Move Phase", tab = "Constraints", default = 0, min = 0, max = 1, scale = 1 },
				{ name = "moveaccel", label = "Move Acceleration", tab = "Constraints", default = 0.5, min = 0, max = 1, scale = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		},
		{
			name = "wedge",
			default = { 
				description = "",
				shape = "wedge", 					-- specifies shape (sphere, cube, cylinder, capsule)
				movable = false,						-- does not move 
				position = Vector.New(0,0,0), 						-- far left, centre table location
				eulers = Vector.New(0,0,0),
				scale = Vector.New(1,1,1), 				-- absoulte size; will not scale with table size
				red =  0.5, 
				green = 0.5,
				blue = 0.5,  
				visible = 1, 						-- invisible
				texture = "plaster",
				solid = 1,						-- not solid; can be walked through
				shadow = 1,						-- does not cast shadows	
				density = 1,
				group = "0"
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "eulers", label = "Orientation", vector = 5, default = Vector.New(0,0,0) },
				{ name = "scalex", label = "Width", tab = "Physical", icon = "WidthObj", default = 1, min = .1, max = 150, scale = 4 },
				{ name = "scaley", label = "Height", tab = "Physical", icon = "HeightObj", default = 1, min = .1, max = 150, scale = 4 },
				{ name = "scalez", label = "Length", tab = "Physical", icon = "DepthObj",  default = 1, min = .1, max = 150, scale = 4 },
				{ name = "movable", label = "Movable", tab = "Physical", check = false },
				{ name = "solid", label = "Solid", tab = "Physical", check = 1 },
				{ name = "density", label = "Density", tab = "Physical", default = 1, min = 0.01, max = 10, scale = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "xconstrain", label = "Constrain X", tab = "Constraints", top =1, check = 1 },
				{ name = "yconstrain", label = "Constrain Y", tab = "Constraints", check = 1 },
				{ name = "zconstrain", label = "Constrain Z", tab = "Constraints", check = 1 },
				{ name = "xrotconstrain", label = "Constrain X Rotation", tab = "Constraints", top =1, check = 1 },
				{ name = "yrotconstrain", label = "Constrain Y Rotation", tab = "Constraints", check = 1 },
				{ name = "zrotconstrain", label = "Constrain Z Rotation", tab = "Constraints", check = 1 },
				{ name = "movepath", label = "Move Path", tab = "Constraints", top =1, check = 1 },
				{ name = "movedelay", label = "Delay Move", tab = "Constraints", top =1, check = 1 },
				{ name = "moveposition", label = "Move Position", tab = "Constraints", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "movetime", label = "Move Time", tab = "Constraints", default = 1, min = 0.1, max = 40, scale = 1 },
				{ name = "movephase", label = "Move Phase", tab = "Constraints", default = 0, min = 0, max = 1, scale = 1 },
				{ name = "moveaccel", label = "Move Acceleration", tab = "Constraints", default = 0.5, min = 0, max = 1, scale = 1 },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/Target", filespec = "*.png", bottom = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		}
	}
	return types
end
