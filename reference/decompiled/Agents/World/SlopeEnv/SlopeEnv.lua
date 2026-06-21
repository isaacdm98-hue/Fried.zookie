# SlopeEnv specializes Env embeds Visual, Karma

function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	
	MessageStandardLights()

	local posz = -15
	local height = 0.3
	local posx = -50
	local slopewidth = 10
	for index = -5, 5 do
		if index ~= 0 then
			MessageFixedBlock(Vector.New(posx,0, posz+index), Vector.New(slopewidth, 1, 15), Quatn.New(Vector.New(5*Number.abs(index),0,0),1), .6, Number.abs(index)*0.15, .5)
		end
		posx = posx +slopewidth
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
