# BuilderGrids specializes Agent embeds Visual, Karma, Sound


function Initialize( )
	myModeSphere = 1
	myModeGrid = 2
	myModeNone = 0

	myMode = myModeNone
	CreateGrid()
	CreateSphere()
end

function CreateGrid()
	local mesh = {vertices = {}, indices = {0, 1, 2, 2, 3, 0}, texture_coordinates = {0,0,  0,1,  1,1,  1,0} }
	mesh.vertices[1] = Vector.New( 0, -4, 4 )
	mesh.vertices[2] = Vector.New( 0, -4, -4 )
	mesh.vertices[3] = Vector.New( 0, 4, -4 )
	mesh.vertices[4] = Vector.New( 0, 4, 4 )
	mesh.texture = "Agents/World/BuilderGrids/foot_grid.png"
	Visual.Create("foot_grid1", mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1, 1, 1), 1)
	Visual.SetTransparent( Segment.foot_grid1, 1 )
	mesh.indices = { 0, 2, 1,  3, 2, 0 }
	Visual.Create("foot_grid2", mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1, 1, 1), 1)
	Visual.SetTransparent( Segment.foot_grid2, 1 )
end

function CreateSphere()
	Visual.CreateHemisphere( "foot_sphere", Vector.New(0,0,0), Quatn.New(), 1, "Agents/World/BuilderGrids/foot_grid.png" )
	Visual.SetTransparent( Segment.foot_sphere, 1 )
end

function MessageShow( visible )
	if myMode == MyModeSphere then
		Visual.SetVisible( Segment.foot_sphere, visible )
	end
	if myMode == MyModeGrid then
		Visual.SetVisible( Segment.foot_grid1, visible )
		Visual.SetVisible( Segment.foot_grid2, visible )
	end
end

function MessageSetFootGrid( visible, position )
	if visible then
		myMode = MyModeGrid
	else
		if myMode == MyModeGrid then
			myMode  = myModeNone
		end
	end
	Visual.SetVisible( Segment.foot_grid1, visible )
	Visual.SetVisible( Segment.foot_grid2, visible )
	if visible then
		Visual.MoveTo( Segment.foot_grid1, position )
		Visual.MoveTo( Segment.foot_grid2, position )
	else
		Visual.MoveTo( Segment.foot_grid1, Vector.New( -1000, -1000, -1000 ) )
		Visual.MoveTo( Segment.foot_grid2, Vector.New( -1000, -1000, -1000 ) )
	end
end

function MessageSetFootSphere( visible, radius, transform )
	if visible then
		myMode = MyModeSphere
	else
		if myMode == MyModeSphere then
			myMode  = myModeNone
		end
	end
	Trace( "SetFootSphere % % %", visible, position, radius )
	Visual.SetVisible( Segment.foot_sphere, visible )
	if visible then
		--Visual.MoveTo( Segment.foot_sphere, position )
		--radius = 0.5 * radius /  Number.sqrt( 3 )
		--Visual.SetScale( Segment.foot_sphere, Vector.New( radius*2, radius*2, radius*2 ) )
		--Visual.SetScale( Segment.foot_sphere, Vector.New( radius, radius, radius ) )
		--Visual.RotateTo( Segment.foot_sphere, orientation )
		--local scale = Matrix.New()
		--Matrix.SetScale( scale, radius )
		Visual.SetTransform( Segment.foot_sphere, transform )
		Visual.SetScale( Segment.foot_sphere, Vector.New( radius, radius, radius ) )
	else
		Visual.MoveTo( Segment.foot_sphere, Vector.New( -1000, -1000, -1000 ) )
	end
end
