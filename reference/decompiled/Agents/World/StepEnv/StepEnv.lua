# StepEnv specializes Env embeds Visual, Karma

function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )

	MessageStandardLights()

	local width = 5
	local length = 5
	local posx = 15
	local posz = -15
	local height = 0.1
	local r = 0.07
	local g = 0.1
	local b = 0.2
	for index = 0, 6 do
		MessageFixedBlock(Vector.New(posx, height/2, posz), Vector.New(width, height, length), Quatn.New(), r, g, b)
		height = height + 0.1
		r = r + 0.07
		g = g + 0.03
		b = b + 0.05
		posx = posx-length
	end
	for index = 0, 6 do
		MessageFixedBlock(Vector.New(posx, height/2, posz), Vector.New(width, height, length), Quatn.New(), r, g, b)
		height = height + 0.1
		r = r + 0.07
		g = g + 0.03
		b = b + 0.05
		posz = posz+length
	end
	for index = 0, 6 do
		if index == 4 or index == 7 then
			MessageFixedBlock(Vector.New(posx, height-0.05, posz), Vector.New(width, 0.1, length), Quatn.New(), r, g, b)
		else
			MessageFixedBlock(Vector.New(posx, height/2, posz), Vector.New(width, height, length), Quatn.New(), r, g, b)
		end
		height = height + 0.1
		r = r - 0.05
		g = g - 0.02
		b = b - 0.07
		posx = posx+length
	end
	for index = 0, 6 do
		if index == 2 or index == 5 or index == 8 then
			MessageFixedBlock(Vector.New(posx, height-0.05, posz), Vector.New(width, 0.1, length), Quatn.New(), r, g, b)
		else
			MessageFixedBlock(Vector.New(posx, height/2, posz), Vector.New(width, height, length), Quatn.New(), r, g, b)
		end
		height = height + 0.1
		r = r + 0.07
		g = g + 0.07
		b = b + 0.05
		posz = posz-length
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
