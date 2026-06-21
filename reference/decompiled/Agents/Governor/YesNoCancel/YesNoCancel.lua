# YesNoCancel specializes UIAgent embeds Input

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
	local buttonWidth = 64
	local gap = 26
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	GUI.CreateText( "prompt", text, left + 16, top + 16, right, bottom,  "Fonts/Edit.met" )
	GUI.SetColour( Segment.prompt, 0, 0, 0, 1 )

	AddPanelButton( "yes_button", "Yes", right - (16+((buttonWidth+gap)*2)+buttonWidth), top + 60, right - (16+((buttonWidth+gap)*2)), top + 84 )
	AddPanelButton( "no_button", "No", right - (16+(buttonWidth+gap)+buttonWidth), top + 60, right - (16+(buttonWidth+gap)), top + 84 )
	AddPanelButton( "cancel_button", "Cancel", right - (16+buttonWidth), top + 60, right - 16, top + 84 )

end

function SystemUIChange( segment )
	if segment == Segment.yes_button then
		Agent.SendMessage( myCallbackMessage, myNotifyAgent, 1)
	elseif segment == Segment.no_button then
		Agent.SendMessage( myCallbackMessage, myNotifyAgent, false)
	end
	Agent.Destroy()
end
