# Logon specializes UIAgent embeds Input

function Initialize( notifyAgent, message, text, username, password, username_label, password_label )

	Input.SetFocus()

	myNotifyAgent = notifyAgent
	myMessage = message
	
	
	local lines = 0
	if Table.TypeCheck(text, 1) ~= false then
		for index, value in text do
			lines = lines + 1
		end
	else
		lines = 1
		local l = text
		text = {}
		text[1] = l
	end	
	
	-- if no default username supplied
	if username == nil then
		username = ""
		password = ""
	end

	if username_label == nil then
		username_label = "username"
	end
	if password_label == nil then
		password_label = "password"
	end
	
	local fontHeight = 20
	
	local screenWidth, screenHeight = GUI.Area()
	local width = 300
	local height = 120+ (lines*fontHeight)
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	
	local y = top + 16
	for index, value in text do
		local segname = "prompt_"..tostring(index)
		GUI.CreateText( segname, value, left + 16,  y, right, bottom,  "Fonts/Edit.met" )
		GUI.SetColour( Segment.GetId(segname), 0, 0, 0, 1 )
		y = y + fontHeight
	end
	
	y = y + 16
	GUI.CreateText( "usernamelabel", username_label, left + 16, y, left+100, y+23,  "Fonts/Edit.met" )
	GUI.SetColour( Segment.usernamelabel, 0, 0, 0, 1 )
	GUI.CreateTextEdit( "username", username, left + 116, y, right - 32, y+23,  "Fonts/Edit.met" )
	GUI.SetText( Segment.username, username)
	
	y = y + fontHeight
	GUI.CreateText( "passwordlabel", password_label, left + 16, y, left+100, y+23,  "Fonts/Edit.met" )
	GUI.SetColour( Segment.passwordlabel, 0, 0, 0, 1 )
	GUI.CreateTextEdit( "password", password, left + 116, y, right - 32, y+23,  "Fonts/Password.met" )
	GUI.SetText( Segment.password, password)

	y = y + fontHeight + 16
	AddPanelButton( "ok_button", "OK", right - 164, y, right - 100, y+24 )
	AddPanelButton( "cancel_button", "Cancel", right - 80, y, right - 16, y+24 )
	
	GUI.SetFocus( Segment.username )
	myFocus = Segment.username
	
	Input.RegisterKey(Input.KEY_RETURN)
	
end

function SystemKeyDown(key)
	if key == Input.KEY_RETURN then
		if myFocus == Segment.username then
			GUI.SetFocus( Segment.password )
			myFocus = Segment.password
		elseif myFocus == Segment.password then
			SystemUIChange( Segment.ok_button )
		end
	end
end

function SystemUIChange( segment )

	if segment == Segment.password then
		myFocus = Segment.password
	end
	if segment == Segment.username then
		myFocus = Segment.username
	end
		
	if segment == Segment.ok_button then
		myUsername = GUI.GetText( Segment.username ) 
		myPassword = GUI.GetText( Segment.password ) 
		if myNotifyAgent ~= nil then
			-- run form agent, pass details back and destroy
			Agent.SendMessage( myMessage, myNotifyAgent, myUsername, myPassword)
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


function MessageEntry()
	return myUsername, myPassword
end
