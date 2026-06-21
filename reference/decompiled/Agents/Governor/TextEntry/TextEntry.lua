# TextEntry specializes UIAgent embeds Input

function Initialize( notifyAgent, prompt, text, message, allowCancel )

	Input.SetFocus()

	myNotifyAgent = notifyAgent
	myMessage = message
	
	local screenWidth, screenHeight = GUI.Area()
	local width = 300
	local height = 120
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	GUI.CreateText( "prompt", prompt, left + 16, top + 16, right, bottom,  "Fonts/Edit.met" )
	GUI.SetColour( Segment.prompt, 0, 0, 0, 1 )
	GUI.CreateTextEdit( "text_edit", text, left + 16, top + 40, right - 16, top + 60,  "Fonts/Edit.met" )
	GUI.SetText( Segment.text_edit, text)

	local cancelPos = 84
	if allowCancel then
		AddPanelButton( "cancel_button", "Cancel", right - 80, top + 80, right - 16, top + 104 )
		cancelPos = 0
	end
	AddPanelButton( "ok_button", "OK", right - 164+cancelPos, top + 80, right - 100+cancelPos,top + 104 )

	GUI.SetFocus( Segment.text_edit )
	
	Input.RegisterKey(Input.KEY_RETURN)
	
end

function SystemKeyDown(key)
	if key == Input.KEY_RETURN then
		SystemUIChange( Segment.ok_button )
	end
end

function SystemUIChange( segment )
	if segment == Segment.ok_button then
		myText = GUI.GetText( Segment.text_edit ) 
		if myNotifyAgent ~= nil then
			-- run form agent, pass details back and destroy
			Agent.SendMessage( myMessage, myNotifyAgent, myText)
			Agent.Destroy()
		else
			-- presumes run for boot script, pass back control
			System.ExitMainLoop()
		end
	end
	if segment == Segment.cancel_button then
		local notifyAgent = myNotifyAgent
		Agent.Destroy()
		if notifyAgent == nil then
			-- presumes run for boot script, pass back control
			System.ExitMainLoop()
		end
	end
	
end


function MessageText()
	return myText
end
