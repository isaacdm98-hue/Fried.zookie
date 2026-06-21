# BehaviourManager specializes Agent final
--
-- 
-- behaviour.name
-- behaviour.owner
-- behaviour.id
-- behaviour.params
-- behaviour.triggerOnEvents
-- behaviour.triggerOffEvents
-- behaviour.destroyOnEvents
-- behaviour.instance = variable and code table
-- behavour.state
-- behaviour.callbackEvents
-- behaviour.nextCallbackEvent

-- Behaviour States
INACTIVE = 0
ACTIVE = 1
SUSPENDED = 2

-- enum types
ALL = -1
SYSTEM = -2
IMMEDIATE = -3
TRIGGER_ON = -4
TRIGGER_OFF = -5
DESTROYED = -6

function StaticInject()
	
end


function Initialize(manager, data)
	
	if Config.Get("trace_behaviours", false) then
		Trace("init manager")
	end

	Manager = manager
	Behaviours = Clone(data.behaviours)
	AllAgents = Clone(data.agents)
	
	Messages = {}
	LastMessage = 0
	
	Suspended = {}
	
	-- initalize behaviours
	for index, value in Behaviours do
		value.state = INACTIVE
		local behav_path="Behaviours/"
		value.instance = Execute(behav_path .. value.name)
		value.owner = Agents(value.owner)
		value.callbackEvents = {}
		value.nextCallbackEvent = 1
	end
	
	Started = false
			
end



function MessageStart()
	local a
	if Started == false then
		-- set off first behaviours
		ProcessEvent( { behaviour = SYSTEM, id = IMMEDIATE } )
		Started = 1
	end
	Agent.SetTimer("Update", Agent.Me(), "update")
	StartTime = World.SimTime()
end


function MessageStop()
	Agent.StopTimer("update")
end

	
function TimerUpdate()

	local oldCurrentlyActiveBehaviour = CurrentlyActiveBehaviour
	local oldBehaviour = Behaviour
	local data = {}
	
	data.simTime = World.SimTime()
	data.realTime = System.RealTime()
	
	for index, value in Behaviours do
		if value.state == ACTIVE then
			CurrentlyActiveBehaviour = value
			Behaviour = value.instance
			Behaviour.update(data)
		end
	end
	
	CurrentlyActiveBehaviour = oldCurrentlyActiveBehaviour
	Behaviour = oldBehaviour
	
end


function MessageCallback(data)
	local id = data.message.behaviour
	for index, value in Behaviours do
		if value.id == id and value.state == ACTIVE then
			local oldCurrentlyActiveBehaviour = CurrentlyActiveBehaviour
			local oldBehaviour = Behaviour
			CurrentlyActiveBehaviour = value
			Behaviour = value.instance

			Behaviour.callback(data)
			
			CurrentlyActiveBehaviour = oldCurrentlyActiveBehaviour
			Behaviour = oldBehaviour
			return
		end
	end
end


function ProcessEvent(e)

	-- store state so can return to how it was after processing broadcast events
	local oldCurrentlyActiveBehaviour = CurrentlyActiveBehaviour
	local oldBehaviour = Behaviour

	
	-- remove messages event triggers off
	for index, value in Messages do
		if EventExists(value.triggerOffEvents,  e) ~= false then
			if Config.Get("trace_behaviours", false) then
				Trace("Behaviour Manager: removing running message %,%,% from event %,%,%", value.name, value.issuer, value.to, e.owner, e.behaviour, e.id)
			end
			Messages[index] = nil
		end
	end


	local data = { event = e }
	data.simTime = World.SimTime()
	data.realTime = System.RealTime()
	for index, value in Behaviours do
		
		CurrentlyActiveBehaviour = value
		Behaviour = value.instance

		-- finalize first so behaviours messages dont distrub new behaviours messages
		if value.state == ACTIVE then
			local destroy = EventExists(value.destroyOnEvents,  e)
			local triggerOff = EventExists(value.triggerOffEvents,  e)
			if triggerOff ~= false or destroy ~= false then
				if Config.Get("trace_behaviours", false) then
					Trace("Behaviour Manager: finalizing behaviour %,%,% from event %,%,%", value.owner, value.id, value.name, e.owner, e.behaviour, e.id)
				end
				value.state = INACTIVE
				Behaviour.finalize(data)
	
				-- remove messages  issued by behaviour
				for i, v in Messages do
					if v.issuer == value.id then
						if Config.Get("trace_behaviours", false) then
							Trace("Behaviour Manager: removing running message from finalizing %,%,%", v.name, v.issuer,v.to)
						end
						Messages[i] = nil
					end
				end
				
				if triggerOff ~= false then
					BroadcastEvent(TRIGGER_OFF, {})
				end
				
				-- remove event from being restarted
				if destroy ~= false then
					if Config.Get("trace_behaviours", false) then
						Trace("Behaviour Manager: destroying running behaviour %,%,% after finalizing", value.owner, value.id, value.name)
					end
					BroadcastEvent(DESTROYED, {})
					Behaviours[index] = nil
				end
			end
		end
		
		-- run callbacks requested by behaviour
		if value.state == ACTIVE and EventExists(value.callbackEvents, e) ~= false then
			if Config.Get("trace_behaviours", false) then
				Trace("Behaviour Manager: calling back behaviour %,%,% from event %,%,%", value.owner, value.id, value.name, e.owner, e.behaviour, e.id)
			end
			Behaviour.callback(data)
		end
		
		-- run new behaviours last
		if Config.Get("trace_behaviours", false) then
			Trace("Behaviour Manager: testing initializing behaviour %,%,% from event %,%,%", value.owner, value.id, value.name, e.owner, e.behaviour, e.id)
		end
		if value.state == INACTIVE and EventExists(value.triggerOnEvents, e) ~= false then
			if Config.Get("trace_behaviours", false) then
				Trace("Behaviour Manager: initializing behaviour %,%,% from event %,%,%", value.owner, value.id, value.name, e.owner, e.behaviour, e.id)
			end
			value.state = ACTIVE
			Behaviour.initialize(data)
			BroadcastEvent(TRIGGER_ON, {})
		end
		
	end	
	
	CurrentlyActiveBehaviour = oldCurrentlyActiveBehaviour
	Behaviour = oldBehaviour
	
end


function EventExists(table, e)
	for index, value in table do
		if (value.behaviour == e.behaviour or e.behaviour == ALL) and (value.id == e.id or e.id == ALL) then
			return 1
		end
	end
	return false
end





-------------------------------------------------------------------------------------------------------------------------------
-- BEHAVIOUR FUNCTIONS
-------------------------------------------------------------------------------------------------------------------------------

function StartTime()
	return StartTime
end

function Me()
	return CurrentlyActiveBehaviour.id
end

function Owner()
	return CurrentlyActiveBehaviour.owner
end


function BehaviourOwner(id)
	for index, value in Behaviours do
		if value.id == id then
			return value.owner
		end
	end
end


function Params()
	return Clone(CurrentlyActiveBehaviour.params)
end

function Agents(id)
	if id == nil then
		return nil
	end
	return AllAgents[id]
end


function BroadcastEvent(event_id, data)
	local e = { owner = CurrentlyActiveBehaviour.owner, behaviour = CurrentlyActiveBehaviour.id, id = event_id, data = data }
	if Config.Get("trace_behaviours", false) then
		Trace("Behaviour Manager: broadcasting event %,%,%", e.owner, e.behaviour, e.id)
	end
	ProcessEvent( e )
end	


function SendMessage(name, to, params, triggerOffEvents)
	if Config.Get("trace_behaviours", false) then
		Trace("Behaviour Manager: Sending message % from % to %", name, CurrentlyActiveBehaviour.id, to)
	end
	if EventExists(triggerOffEvents, ImmediateEvent() ) == false then
		-- does not turn off immediatly
		--Trace("Logging message")
		local msg = {}
		msg.name = name
		msg.to = to
		msg.params = params
		msg.triggerOffEvents = Clone(triggerOffEvents)
		msg.issuer = CurrentlyActiveBehaviour.id
		
		-- add to message list
		LastMessage = LastMessage+1
		Messages[LastMessage] = msg
	end
	
	
	params.to = to
	params.owner = CurrentlyActiveBehaviour.owner
	params.behaviour = CurrentlyActiveBehaviour.id
	
	Agent.SendMessage(name, to, params)
	
end


function AddCallback(event)
	for index, value in CurrentlyActiveBehaviour.callbackEvents do
		if Equals(value, event) then
			return
		end
	end
	CurrentlyActiveBehaviour.callbackEvents[CurrentlyActiveBehaviour.nextCallbackEvent] = event
	CurrentlyActiveBehaviour.nextCallbackEvent = CurrentlyActiveBehaviour.nextCallbackEvent + 1
end


function AddCallbacks(eventList)
	for index, value in eventList do
		AddCallback(value)
	end
end


function RemoveCallback(event)
	for index, value in CurrentlyActiveBehaviour.callbackEvents do
		if Equals(value, event) then
			CurrentlyActiveBehaviour.callbackEvents = nil
		end
	end
end


function RemoveCallbacks(eventList)
	for index, value in eventList do
		RemoveCallback(value)
	end
end


function Deactivate()
	CurrentlyActiveBehaviour.state = INACTIVE
end
	

function Suspend(owner)
	
	if Suspended.owner == nil then
		Suspended.owner = { total = 0, stack = {} }
	end
	
	Suspended.owner.total = Suspended.owner.total + 1
	Suspended.owner.stack[Suspended.owner.total ] = { totalMessages = 0, messages = {}, totalBehaviours = 0, behaviours = {} }
	local top = Suspended.owner.stack[Suspended.owner.total ] 
	
	for index, value in Behaviours do
		if value.state == ACTIVE and Equals(value.owner, owner) then 
			if Config.Get("trace_behaviours", false) then
				Trace("Behaviour Manager: suspending behaviour %,%,%", value.owner, value.id, value.name)
			end
			value.state = SUSPENDED
			top.totalBehaviours = top.totalBehaviours + 1
			top.behaviours[top.totalBehaviours] = value.id
		end
	end
	
	for i, v in Messages do
		local o = BehaviourOwner(v.issuer)
		if Equals(o, owner) then
			if Config.Get("trace_behaviours", false) then
				Trace("Behaviour Manager: suspending running message %,%,%", v.name, v.issuer,v.to)
			end
			top.totalMessages = top.totalMessages + 1
			top.messages[top.totalMessages] = v
			Messages[i] = nil
		end
	end
	
end
	

function Resume(owner)
	
	if Suspended.owner == nil then
		return
	end
	
	if Suspended.owner.total == 0 then
		return
	end
	
	-- deactivate currently running
	for i, v in Behaviours do
		if Equals(v.owner,owner) and v.state == ACTIVE then 
			if Config.Get("trace_behaviours", false) then
				Trace("Behaviour Manager: finalizing behaviour %,%,% from Resume", v.owner, v.id, v.name)
			end
			v.state = INACTIVE
			Behaviour.finalize({ resume = 1 })
		end
	end
	
	local top = Suspended.owner.stack[Suspended.owner.total ] 
	
	for index, value in top.behaviours do
		for i, v in Behaviours do
			if v.id == value and v.state == SUSPENDED then 
				if Config.Get("trace_behaviours", false) then
					Trace("Behaviour Manager: resuming behaviour %,%,%", v.owner, v.id, v.name)
				end
				v.state = ACTIVE
			end
		end
	end
	
	for i, v in top.messages do
		if Config.Get("trace_behaviours", false) then
			Trace("Behaviour Manager: resuming message %,%,%", v.name, v.issuer,v.to)
		end
		SendMessage(v.name, v.to, v.params, v.triggerOffEvents)
	end
	
	Suspended.owner.stack[Suspended.owner.total ]  = nil
	Suspended.owner.total  = Suspended.owner.total  - 1
end


function ImmediateEvent()
	return { behaviour = ALL, id = IMMEDIATE }
end


function Event(event)
	return { behaviour = Me(), id = event }
end
	

function CallManager(message)
	
	return Agent.SendMessage("BehaviourReport", Manager, message)
	
end
