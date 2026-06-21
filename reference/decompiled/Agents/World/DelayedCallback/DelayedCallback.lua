# DelayedCallback specializes Agent

function Initialize( notify, message, delay )
	Agent.PostMessage( "Go", Agent.Me(), delay, notify, message )
end

function MessageGo( notify, message )
	Agent.SendMessage( message, notify )
	Agent.Destroy()
end

function MessageDestroy()
	Agent.Destroy()
end
