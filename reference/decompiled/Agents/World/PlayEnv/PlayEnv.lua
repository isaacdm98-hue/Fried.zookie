# PlayEnv specializes Env embeds Visual, Karma

function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	
	MessageStandardLights()

	local width = 0.3
	local height = 0.3
	local length = 6
	local wgap = 6
	local lgap = 4
	local posx = 25
	local posz = -30
	local r = 0.4
	local g = 0.2
	local b = 0.2
	for index = 0, 10 do
		MessageFixedBlock(Vector.New(posx + Number.sin(index*18)*12, height/2, posz), Vector.New(width, height, length), Quatn.New(Vector.New(0,index*-3,0),1), 0.02*(index+1), 0.07*(index+1), 0.06*(index+1))
		height = height + 0.1
		width = width + 0.1
		r = r + 0.01
		g = g + 0.02
		b = b + 0.03
		posz = posz+lgap+width
		lgap = lgap + 0.5
	end
	

	posz = -25
	height = 0.3
	posx = -20
	for index = 0, 6 do
		MessageFreeBlock(Vector.New(posx,height+0.06, posz), Vector.New(4.5, .1, 6), Quatn.New(), .6, .4, .5)
		MessageFreeBlock(Vector.New(posx, height/2, posz-0.5), Vector.New(4.5, height, 0.5), Quatn.New(), .6, .4, .5)

		posx = posx + 5
		height = height + 0.1
	end
	

	for index = 0, 10 do
		MessageFreeSphere(Vector.New(-15, 4+(index*1.1), 15), Vector.New(.5,.5,.5), 0.4, 0.9, 0.4)
	end
	

end


function Finalize()
end


function MessageShow( visible )
	MessageEnv__Show(visible)
end

function MessageDestroy()
	Agent.Destroy()
end
