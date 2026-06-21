# HurdleEnv specializes Env embeds Visual, Karma

function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	
	MessageStandardLights()

	local width = 1
	local height = 0.5
	local length = 16
	local wgap = 6
	local lgap = 8
	local posx = 0
	local posz = -10
	local r = 0.4
	local g = 0.2
	local b = 0.2
	for index = 0, 5 do
		MessageFixedBlock(Vector.New(0, height/2, posz), Vector.New(width, height, length), Quatn.New(Vector.New(00,90,0),1), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
		height = height + 0.1
		width = width + 0.1
		r = r + 0.01
		g = g + 0.02
		b = b + 0.03
		posz = posz-lgap-width/2
	end
	
	posz = 10
	for index = 0, 5 do
		MessageFixedBlock(Vector.New(0, height/2, posz), Vector.New(width, height, length), Quatn.New(Vector.New(00,90,0),1), 0.04*(index+1), 0.14*(index+1), 0.12*(index+1))
		height = height + 0.1
		width = width + 0.1
		r = r + 0.01
		g = g + 0.02
		b = b + 0.03
		posz = posz+lgap+width/2
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
