# Contest specializes Agent final embeds Input, Visual


function Initialize(selector, d, loadContestants, notifyAgent)
	
	NotifyAgent = notifyAgent
	LoadContestants = loadContestants
	
	Selector = selector
	data = d

		-- back compatibility to raotations
	for index, value in data.agents do
		if value.params.eulers == nil and value.params.rotation ~= nil then
			value.params.eulers = Vector.New( Quatn.GetEuler( value.params.rotation ) )
		end	
	end

	
	local totalContestants = 0
	for index, value in data.agents do
		if value.agent == "ZookPlaceHolder" then
			if value.params.contestant  == nil then
				totalContestants = totalContestants + 1
			else
				if not System.IsValidPath( value.params.contestant.fullname ) then
					value.params.contestant = nil
					totalContestants = totalContestants + 1
				end
			end
		end
	end

	Contestants = {}
	myNextContestant = 1
	

	
	Input.RegisterKey(Input.KEY_ADD)
	Input.RegisterKey(Input.KEY_SUBTRACT)
	Input.RegisterKey(Input.KEY_1)
	Input.RegisterKey(Input.KEY_2)
	Input.RegisterKey(Input.KEY_3)
	Input.RegisterKey(Input.KEY_4)
	Input.RegisterKey(Input.KEY_5)
	Input.RegisterKey(Input.KEY_6)
	Input.RegisterKey(Input.KEY_7)
	Input.RegisterKey(Input.KEY_8)
	Input.RegisterKey(Input.KEY_9)
	Input.RegisterKey(Input.KEY_0)
	
	
	if LoadContestants == false then
		InstanciateAgents()
	elseif LoadContestants == 1 then
		Agent.SendMessage("SelectContestants", Selector, Agent.Me(), totalContestants)
	else
		if getn(LoadContestants) == totalContestants then
			MessageContestantsSelected(LoadContestants)
		else
			Throw("Incorrect number of contestants given for this contest.")
		end
	end
end



function MessageContestantsSelected(selectedContestants)
	SelectedContestants = selectedContestants
	if NotifyAgent ~= nil then
		Agent.PostMessage("InstantiateContest", NotifyAgent, 0.01)
	else
		MessageInstantiateAll()
	end
end

	
function MessageInstantiateAll()
	local c = 1
	for index, value in data.agents do
		if value.agent == "ZookPlaceHolder" then
			if value.params.contestant  == nil then
				local contestant = SelectedContestants[c]
				data.agents[index].params.contestant = contestant
				c = c + 1
			end
				
		end
	end
	
	InstanciateAgents()
	BehaviourManager = Agent.Create("BehaviourManager", Agent.Me(), { agents = agents, behaviours = data.behaviours } )
	

	if NotifyAgent ~= nil then
		Agent.SendMessage("ContestInstantiated", NotifyAgent)
	end
end


function InstanciateAgents()
	
	agents = {}
	ContestantIds = {}
	--for index, value in data.agents do
	for index = 1, getn( data.agents ) do
		if data.agents[index] ~= nil then
			value = data.agents[index]
			if value.agent == "ZookPlaceHolder" and LoadContestants ~= false then
				ContestantIds[index] = myNextContestant
				agents[index] = CreateZook( value )
			else
				agents[index] = Agent.Create( value.agent,  value.params )
			end
			Agent.SendMessage( "SetVisualFlags",  agents[index], value.params.flags )
			Agent.SendMessage( "SetGroup",  agents[index], value.params.group )
		end
	end	
	
end

function CreateZook( value )
	local params = value.params
	local fixed = false
	if value.params.movable == false then
		fixed = 1
	end
	local zook = Agent.Create("Evo", value.params.position, Quatn.New(Vector.GetXYZ(value.params.eulers)),
		 value.params.contestant.fullname, 0, 0, fixed)
	if value.params.movable == false then
		local hatpin = value.params.hatpin
		if hatpin == nil then hatpin = Vector.New(0,0,0) end
		hatpin = hatpin + value.params.position
		local x, y, z = Vector.GetXYZ( hatpin )
		local agent, segment, hit = Visual.Ray(  Vector.New( x, 0.5, z ), Vector.New( x, 1000, z ) )
		local h = 10
		if segment ~= 0 then
			h = Vector.GetY( hit )
		end

		segmentId =Visual.Create("hatpin"..myNextContestant, 3, Vector.New(x,h/2,z), Quatn.New( Vector.New(1,0,0), 90),
			Vector.New( 0.3, 0.3, h ), 1, false, 0.5, "")
		Visual.SetFlags( segmentId, tonumber( value.params.flags ) )
		Agent.SendMessage( "Fix", zook, hatpin )
		Visual.SetColour(segmentId, 0.5, 0.5, 0.5,1)
		Visual.SetShadow(segmentId, 1)
	end
	Contestants[myNextContestant] = zook 
	myNextContestant = myNextContestant + 1
	-- DSB: trying to emulate exactly the conditions of the Zook-kit
	Agent.SendMessage( "SmoothStop", zook )
	--~ Agent.SendMessage("StopMoving", zook ,  {speed = 1})
	return zook
end

function SystemKeyDown(key)

	local shiftDown = Input.IsKeyDown(Input.KEY_LSHIFT) or Input.IsKeyDown(Input.KEY_RSHIFT)
	
	-- start and stop contestants
	if key == Input.KEY_ADD then
		for index, value in Contestants do
			Agent.SendMessage("SmoothStart", value)
		end
	elseif key == Input.KEY_SUBTRACT then
		for index, value in Contestants do
			Agent.SendMessage("SmoothStop", value)
		end
	elseif key >= Input.KEY_1 and key <= Input.KEY_0 then
		local index = (key - Input.KEY_1) + 1
		if Contestants[index] ~= nil then
			if shiftDown == 1 then
				Agent.SendMessage("SmoothStop", Contestants[index])
			else
				Agent.SendMessage("SmoothStart", Contestants[index])
			end
		end
	end
	
end

function MessageGo()
	SystemKeyDown(Input.KEY_ADD)
	Agent.SendMessage("Start", BehaviourManager)
end

function MessageGetContestants()
	return SelectedContestants
end

function MessageBehaviourReport(message)
	
	if  message.scoreboard ~= nil then
		message.scoreboard.contestant = {}
		message.scoreboard.description = {}
		for i,v in message.scoreboard.player do
			-- get contestant ids from agent id
			message.scoreboard.contestant[i] = ContestantIds[v]
			message.scoreboard.description[i] = Agent.SendMessage("GetProperty", Contestants[ContestantIds[v]], "description")
		end
	end
	Agent.PostMessage("BehaviourReport", NotifyAgent, 0.01, message)

end
