# ShiftEnv specializes Env embeds Visual, Karma

function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )

	MessageStandardLights()

	local height = 2
	local length = 50
	local index = 0
	MessageFixedBlock(Vector.New(0, height/2, -length/2), Vector.New(length, height, 1), Quatn.New(), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
	index = index + 1
	MessageFixedBlock(Vector.New(length/2, height/2, 0), Vector.New(1, height, length), Quatn.New(), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
	index = index + 1
	MessageFixedBlock(Vector.New(0, height/2, length/2), Vector.New(length, height, 1), Quatn.New(), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
	index = index + 1
	MessageFixedBlock(Vector.New(-length/2, height/2, 0), Vector.New(1, height, length), Quatn.New(), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
	index = index + 1

	MessageFreeSphere(Vector.New(5,2,10), Vector.New(1, 1, 1), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
	index = index + 3
	MessageFreeBlock(Vector.New(-5,2,10), Vector.New(1, 1, 1), Quatn.New(), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))

	index = index + 3
	local posy = 2
	for i = 0, 4 do
		MessageFreeBlock(Vector.New(-15,posy,-15), Vector.New(1, 1, 1), Quatn.New(), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
		index = index + 3
		posy = posy + 1.1
	end
	MessageFreeSphere(Vector.New(10,posy,10), Vector.New(0.5, 0.5, 0.5), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
	index = index + 3
	MessageFreeSphere(Vector.New(10,posy,-10), Vector.New(0.5, 0.5, 0.5), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
	index = index + 3
	MessageFreeSphere(Vector.New(-10,posy,-10), Vector.New(0.5, 0.5, 0.5), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
	index = index + 3
	MessageFreeSphere(Vector.New(-10,posy,10), Vector.New(0.5, 0.5, 0.5), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))

		
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
