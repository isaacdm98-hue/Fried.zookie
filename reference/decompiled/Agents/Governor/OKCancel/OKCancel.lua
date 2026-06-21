# OKCancel specializes UIAgent embeds Input

function Initialize( text, notifyAgent, callbackMessage )

	Input.SetFocus()


	myCallbackMessage =  callbackMessage
	myNotifyAgent = notifyAgent
	
	local screenWidth, screenHeight = GUI.Area()
	local width = 400
	local height = 100
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	GUI.CreateText( "prompt", text, left + 16, top + 16, right, bottom,  "Fonts/Edit.met" )
	GUI.SetColour( Segment.prompt, 0, 0, 0, 1 )
	
	AddPanelButton( "ok_button", "OK", right - 170, top + 60, right - 106, top + 84 )
	AddPanelButton( "cancel_button", "Cancel", right - 80, top + 60, right - 16, top + 84 )

end

function SystemUIChange( segment )
	if segment == Segment.cancel_button then
		Agent.SendMessage( myCallbackMessage, myNotifyAgent, false)
	else
		Agent.SendMessage( myCallbackMessage, myNotifyAgent, 1)
	end
	Agent.Destroy()
end
