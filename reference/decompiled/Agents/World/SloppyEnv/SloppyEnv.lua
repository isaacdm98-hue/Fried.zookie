# SloppyEnv specializes Env embeds Visual, Karma

function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )

	MessageStandardLights()

	posz = -15
	height = 0.3
	posx = -20
	for index = 0, 8 do
		MessageFreeBlock(Vector.New(posx,height+0.06, posz), Vector.New(5.5, .1, 7), Quatn.New(), .6, .4, .5)
		MessageFreeBlock(Vector.New(posx, height/2, posz-0.5), Vector.New(5.5, height, 0.5), Quatn.New(), .6, .4, .5)

		posx = posx + 6
		height = height + 0.1
	end
	
		
	local target = Config.Get("BuilderTarget", Agent.Null())
	Agent.SendMessage("MoveTo", target, Vector.New(0,0,-60))
	
end


function Finalize()
end


function MessageShow( visible )
	MessageEnv__Show(visible)
end

function MessageDestroy()
	Agent.Destroy()
end
