# PopUpEdit specializes Agent embeds Input, Camera, GUI, Visual

function Initialize(x, y, text, notify)
	
	Input.SetFocus()

	myNotifyAgent = notify
	local screenWidth, screenHeight = GUI.Area()
	Input.RegisterKey(Input.KEY_RETURN)
	GUI.SetParent()
	GUI.CreateObject( "pop_up", 0, 0, screenWidth, screenHeight, 1 )
	GUI.CreateTextEdit( "text_edit", "", x, y, x+64, y+24, "Fonts/Edit.met" )
	GUI.SetText( Segment.text_edit, text )
	GUI.SetFocus( Segment.text_edit )
end

function Finish()
	local text = GUI.GetText( Segment.text_edit ) 
	Agent.SendMessage( "PopUpEditFinished", myNotifyAgent, Agent.Me(), text)
	Agent.Destroy()
end

function SystemUIMouseLDown(segment)
	if segment  == Segment.pop_up then
		Finish()
	end
end

function SystemUIMouseRDown(segment)
	if segment  == Segment.pop_up then
		Finish()
	end
end

function SystemKeyDown(key)
	if key == Input.KEY_RETURN then
		Finish()
	end
end
