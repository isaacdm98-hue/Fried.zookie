# BoxEnv specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()

	--local size = floorSizeX
	--~ Karma.CreateBody("wall1", 1, false, Vector.New(0, 2.5, size/2), Quatn.New(), Vector.New(size,5,1))
	--~ Visual.Create("wall1", 1, Vector.New(0, 2.5, size/2), Quatn.New(), Vector.New(size,5,1), 1)
	--~ Visual.SetColour(Segment.wall1, .9,.9,.9)
	--~ Karma.CreateBody("wall2", 1, false, Vector.New(0, 2.5, -size/2), Quatn.New(), Vector.New(size,5,1))
	--~ Visual.Create("wall2", 1, Vector.New(0, 2.5, -size/2), Quatn.New(), Vector.New(size,5,1), 1)
	--~ Visual.SetColour(Segment.wall2, .9,.9,.9)
	--~ Karma.CreateBody("wall3", 1, false, Vector.New(-size/2, 2.5, 0), Quatn.New(), Vector.New(1,5,size))
	--~ Visual.Create("wall3", 1, Vector.New(-size/2, 2.5, 0), Quatn.New(), Vector.New(1,5,size), 1)
	--~ Visual.SetColour(Segment.wall3, .7,.7,.7)
	--~ Karma.CreateBody("wall4", 1, false, Vector.New(size/2, 2.5, 0), Quatn.New(), Vector.New(1,5,size))
	--~ Visual.Create("wall4", 1, Vector.New(size/2, 2.5, 0), Quatn.New(), Vector.New(1,5,size), 1)
	--~ Visual.SetColour(Segment.wall4, .7,.7,.7)
		
	local target = Config.Get("BuilderTarget", Agent.Null())
	Agent.SendMessage("MoveTo", target, Vector.New(0,0,-60))
	
	
end


function Finalize()
end


function MessageShow( visible )
	--~ Visual.SetVisible( Segment.wall1, visible )
	--~ Visual.SetVisible( Segment.wall2, visible )
	--~ Visual.SetVisible( Segment.wall3, visible )
	--~ Visual.SetVisible( Segment.wall4, visible )
	MessageEnv__Show(visible)
end

function MessageDestroy()
	Agent.Destroy()
end

