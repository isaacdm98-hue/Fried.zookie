# RamEnv specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()

	local redteam_red = 247/255 
	local redteam_green = 38/255 
	local redteam_blue = 27/255 

	agents = {}

	agents[1] = Agent.Create("Target", { 
		shape = "cylinder", 
		movable = false, 
		position = Vector.New(-13, 2, -20)-Vector.New(0,1,0), 
		--~ rotation = Quatn.New(Vector.New(1,0,0), 90), 
		eulers = Vector.New(90,0,0),
		scale = Vector.New(2,2,2), 
		red =  redteam_red, 
		green = redteam_green,
		blue = redteam_blue, 
		visible = 1, 
		solid = 1,
		texture = "Agents/World/Target/plaster",
		shadow = 1
		} )
	
	agents[2] = Agent.Create("Target", { 
		shape = "cylinder", 
		movable = false, 
		position = Vector.New(14, 2, -20)-Vector.New(0,1,0), 
		--~ rotation = Quatn.New(Vector.New(1,0,0), 90), 
		eulers = Vector.New(90,0,0),
		scale = Vector.New(2,2,2), 
		red =  redteam_red, 
		green = redteam_green,
		blue = redteam_blue, 
		visible = 1, 
		texture = "Agents/World/Target/plaster",
		solid = 1,
		shadow = 1
		} )
	
	agents[3] = Agent.Create("Target", { 
		shape = "cube", 
		movable = 1, 
		position = Vector.New(-3, 1.1, -17)-Vector.New(0,1,0), 
		--~ rotation = Quatn.New(Vector.New(0,1,0), 90), 
		eulers = Vector.New(0,90,0),
		scale = Vector.New(2,2,20), 
		red =  redteam_red, 
		green = redteam_green,
		blue = redteam_blue, 
		visible = 1, 
		texture = "Agents/World/Target/plaster",
		mass = 0.3,
		solid = 1,
		shadow = 1
		} )
		
	local target = Config.Get("BuilderTarget", Agent.Null())
	Agent.SendMessage("MoveTo", target, Vector.New(0,0,-60))
		
end


function Finalize()
	
	for index, value in agents do
		Agent.SendMessage("Destroy", value)
	end
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

