# ZigZagEnv specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()
	
	agents = {}
	agent = 1

	MakePoles(-0.5, -10)
	MakePoles(0.5, -25)
	MakePoles(-0.5, -40)
	MakePoles(0.5, -55)

	local target = Config.Get("BuilderTarget", Agent.Null())
	Agent.SendMessage("MoveTo", target, Vector.New(0,0,-60))

end


function Finalize()
	
	for index, value in agents do
		Agent.SendMessage("Destroy", value)
	end
end


function MakePoles(x, z)
	local redteam_red = 247/255 
	local redteam_green = 38/255 
	local redteam_blue = 27/255 
	
	local pad_width = 0.8	--actually the pole width
	local pole_width = 0.1


	agents[agent] = Agent.Create("Target", { 
		shape = "cylinder", 					-- a cylinder, Z = length, X = diameter, Y = ignored
		movable = false, 
		position = Vector.New(x, 10, z),  	-- relative positioning; will scale with table size.
		--~ rotation = Quatn.New(Vector.New(1,0,0), 90), -- rotated 90 degrees around Z
		eulers = Vector.New(90,0,0),
		scale = Vector.New(pad_width,0,20), 		-- relative sizing for X and Z. Y is ignored for cylinder
		red =  redteam_red, 
		green = redteam_green,
		blue = redteam_blue,  
		visible = 1, 
		solid = 1,
		shadow = 1,
		mass = 1,
		texture = "Agents/World/Target/plaster" } )
	agent = agent+1
	 agents[agent] = Agent.Create("Target", { 
		shape = "cylinder", 					-- a cylinder, Z = length, X = diameter, Y = ignored
		movable = false, 
		position = Vector.New(x, 0, z),  	-- relative positioning; will scale with table size.
		--~ rotation = Quatn.New(Vector.New(1,0,0), 90), -- rotated 90 degrees around Z
		eulers = Vector.New(90,0.05,0),
		scale = Vector.New(3,0,pole_width), 		-- relative sizing for X and Z. Y is ignored for cylinder
		red =  redteam_red, 
		green = redteam_green,
		blue = redteam_blue,  
		visible = 1, 
		solid = false,
		shadow = 1,
		mass = 1,
		texture = "Agents/World/Target/plaster" } )
	agent = agent+1
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

