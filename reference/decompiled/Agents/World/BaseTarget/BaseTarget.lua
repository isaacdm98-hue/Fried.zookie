# BaseTarget specializes Selectable abstract

function Initialize()

	myKey = nil
	Callbacks = {}
	added = 0
	TotalCallbacks = 0
	
end


function AffirmCreation(physical)
	Number.TypeCheck(physical)
	targetSegment = physical
	--Karma.AddContactAttributeToAll("BaseTarget", 0)
end


function TurnOnContact()
	TotalCallbacks = TotalCallbacks + 1
	if TotalCallbacks > 0 then
		Karma.AddContactAttributeToAll("BaseTarget", 0)
	end
	-- else 0 = no contacts or > 1 already set on
end


function TurnOffContact()
	TotalCallbacks = TotalCallbacks - 1
	if TotalCallbacks == 0 then
		Karma.RemoveContactAttributeFromAll("BaseTarget", 0)
	end
end


function MessagePosition()
	return Karma.GetPosition(targetSegment)
end


function MessageTargetSegmentID()
	return targetSegment
end
	

function MessageSetMeAsTarget(agent)
	Agent.SendMessage("SetTarget", agent, { target = Agent.Me(), segment = MessageTargetSegmentID() } )
end


function SystemIntrusion(agent, my_segment_hit, other_agents_segment_hit, contacts)
	MessageContact(agent)	
end


function SystemCollision(agent, my_segment_hit, other_agents_segment_hit, contacts)
	MessageContact(agent)	
end	


function MessageContact(agent)
	-- this can be sped up by setting contact attributes specific to targets?
	for index, value in Callbacks do
		if value.agent == "all" or Equals(value.agent, agent) then
			--Trace("Agent Contact match % % %", value.message, value.receiver, value.agent)
			local data = { message = value, contact = Clone(value) }
			data.contact.agent = agent	-- else could be all
			Agent.SendMessage(value.message, value.receiver, data)
			--break -- may have multiple
		end
	end
end


function MessageFlushContacts()
	Karma.FlushContactEvents()
end


function MessageAddCallback(data)

	local agent = data.agent
	local	receiver = data.receiver
	local message = data.message
	local behaviour = data.behaviour -- will be nil if not using behaviour manager
		
	for index, value in Callbacks do
		if Equals(value.agent, agent) and Equals(value.receiver, receiver) and value.message == message and value.behaviour == behaviour then
			-- already exists
			--Trace("Callback already exists\n")
			return
		end
	end

	local newSlot = 0
	for free = 1,added do
		if Callbacks[free] == nil then
			newSlot = free
			break
		end	
	end

	if newSlot == 0 then
		added = added + 1
		newSlot = added
	end


	Callbacks[newSlot] = data

	--Trace("Agent % adding target callback(%) for %\n", Agent.Me(), added, Callbacks[newSlot].agent)
	
	TurnOnContact()
	
end


function MessageRemoveCallback(data)
	
	local agent = data.agent
	local	receiver = data.receiver
	local message = data.message
	local behaviour = data.behaviour -- will be nil if not using behaviour manager
	
	for index, value in Callbacks do
		if Equals(value.agent, agent) and Equals(value.receiver, receiver) and value.message == message and value.behaviour == behaviour then
			--Trace("Agent % removing target callback(%) to %\n", Agent.Me(), index, Callbacks[index].agent)
			Callbacks[index] = nil
			TurnOffContact()
			return
		end
	end

	--Trace("Callback not found to be removed\n")
		
end


function MessageRemoveAgent(agent)
	
	for index, value in Callbacks do
		if Equals(value.agent, agent) then
			Callbacks[index] = nil
		end
	end
	
end
	

function MessageRemoveReciever(receiver)
	
	for index, value in Callbacks do
		if Equals(value.receiver, receiver) then
			Callbacks[index] = nil
		end
	end
	
end
	

function MessageRemoveMessage(message)
	
	for index, value in Callbacks do
		if value.message == message then
			Callbacks[index] = nil
		end
	end
	
end


function MessageSetVisualFlags(flags)
	
	if flags == nil then
		flags = 0
	else
		flags = tonumber(flags)
	end
	if flags == nil then
		flags = 0
	end
	
	local segments = Segment.GetIds()
	for i,v in segments do
		Visual.SetFlags(v, flags)
	end
	
	local targetBit = Number.BitwiseLShift(1,12)	-- bit 12 = target segment
	local targetSegmentFlags = Number.BitwiseOr(flags, targetBit)
	Visual.SetFlags(targetSegment, targetSegmentFlags)

end



function MessageSetGroup(group)
	
	if group == nil then
		Group = 0
	else
		Group = tonumber(group)
	end
	
end



function MessageGetGroup()
	
	return Group
	
end
