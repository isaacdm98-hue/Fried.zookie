# Alert specializes UIAgent embeds Input

function Initialize( text, acknowledge, message, width )

	myMessage = message

	
	Input.SetFocus()
	local screenWidth, screenHeight = GUI.Area()
	local focus = GUI.CreateObject( "focus", 0, 0, screenWidth, screenHeight, 1 )

	
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

	myNotifyAgent = acknowledge
	myFlags = flags

	local fontHeight = 20
	if width == nil then
		width = 300
	elseif width < 0 then
		width = screenWidth - 16
	end
	local height = (20+20+40) + (lines*fontHeight)
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	for index, value in text do
		local segname = "prompt_"..tostring(index)
		GUI.CreateText( segname, value, left + 16, (top + 16) + ((index-1)*fontHeight), right, bottom,  "Fonts/Edit.met" )
		GUI.SetColour( Segment.GetId(segname), 0, 0, 0, 1 )
	end

	if acknowledge ~= false then
		AddPanelButton( "cancel_button", "OK", right - 80, ((lines-1)*fontHeight) + top + 60, right - 16, ((lines-1)*fontHeight)+top + 84 )
	end
end


function SystemUIChange( segment )
	if segment == Segment.cancel_button then
		if Agent.TypeCheck(myNotifyAgent, 1) ~= false then
			Agent.SendMessage(myMessage, myNotifyAgent)
		end
		Agent.Destroy()
	end
end


function MessageDestroy( )
	Agent.Destroy()
end
