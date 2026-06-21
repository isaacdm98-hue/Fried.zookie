# SimpleFrame specializes Agent embeds UI

function Initialize()
	UI.SingleFrame.Create()
	UI.SingleFrame.SetTitle( Config.Get("window_title", System.BuildString()) )
end

function Finalize()
	UI.SingleFrame.Destroy()
end

function MessageDestroy()
	Agent.Destroy()
end

function MessageExitMainLoop()
	UI.SingleFrame.ExitMainLoop()
end


