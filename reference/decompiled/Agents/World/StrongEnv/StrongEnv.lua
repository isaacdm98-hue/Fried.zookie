# StrongEnv specializes Env embeds Visual, Karma


function Initialize( offset_of_world, floorSizeX, floorSizeZ, rotation )
	MessageStandardLights()
	
	local redteam_red = 247/255 
	local redteam_green = 38/255 
	local redteam_blue = 27/255 
	
	local contestobject_red = 158/255 
	local contestobject_green = 157/255 
	local contestobject_blue = 157/255 
	
	agents = {}
	
	agents[1] = Agent.Create("Target", { 
		shape = "cylinder", 					-- a cylinder, Z = length, X = diameter, Y = ignored
		movable = 1, 
		position = Vector.New(0, 8.1, -30)-Vector.New(0,2,0),  	-- relative positioning; will scale with table size.
		--~ rotation = Quatn.New(Vector.New(1,0,0), 90), -- rotated 90 degrees around Z
		eulers = Vector.New(90,0,0),
		scale = Vector.New(4,0,8), 		-- relative sizing for X and Z. Y is ignored for cylinder
		red =  redteam_red, 
		green = redteam_green,
		blue = redteam_blue,  
		visible = 1, 
		solid = 1,
		shadow = 1,
		mass = .4,
		--frozen = 1,
		texture = "Agents/World/Target/plaster" } )
		
	agents[2] = Agent.Create("Target", { 
		shape = "cylinder", 					-- a cylinder, Z = length, X = diameter, Y = ignored
		movable = 1, 
		position = Vector.New(-10, 4.1, -30)-Vector.New(0,2,0),  	-- relative positioning; will scale with table size.
		--~ rotation = Quatn.New(Vector.New(1,0,0), 90), -- rotated 90 degrees around Z
		eulers = Vector.New(90,0,0),
		scale = Vector.New(4,0,4), 		-- relative sizing for X and Z. Y is ignored for cylinder
		red =  redteam_red, 
		green = redteam_green,
		blue = redteam_blue,  
		visible = 1, 
		solid = 1,
		shadow = 1,
		mass = .4,
		--frozen = 1,
		texture = "Agents/World/Target/plaster" } )
		
	agents[3] = Agent.Create("Target", { 
		shape = "cylinder", 					-- a cylinder, Z = length, X = diameter, Y = ignored
		movable = 1, 
		position = Vector.New(10, 12.1, -30)-Vector.New(0,2,0),  	-- relative positioning; will scale with table size.
		--~ rotation = Quatn.New(Vector.New(1,0,0), 90), -- rotated 90 degrees around Z
		eulers = Vector.New(90,0,0),
		scale = Vector.New(4,0,12), 		-- relative sizing for X and Z. Y is ignored for cylinder
		red =  redteam_red, 
		green = redteam_green,
		blue = redteam_blue,  
		visible = 1, 
		solid = 1,
		shadow = 1,
		mass = .4,
		--frozen = 1,
		texture = "Agents/World/Target/plaster" } )		
		
	agents[4] = Agent.Create("Target", { 
		shape = "cube", 
		movable = false, 
		position = Vector.New(0, 0.1, -40)-Vector.New(0,0.025,0), 
		rotation = Quatn.New(Vector.New(1,0,0), 0), 
		scale = Vector.New(60,0.05,1), 
		red = contestobject_red, 
		green = contestobject_green, 
		blue = contestobject_blue, 
		visible = 1, 
		texture = "Agents/World/Target/plaster",
		solid = false,
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
	MessageEnv__Show(visible)
end

function MessageDestroy()
	Agent.Destroy()
end

