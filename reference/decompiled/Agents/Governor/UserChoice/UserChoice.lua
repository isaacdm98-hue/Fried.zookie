# UserChoice specializes UIAgent embeds Input

function Initialize( text, choices, notifyAgent, callbackMessage )
	Input.SetFocus()

	myCallbackMessage =  callbackMessage
	myNotifyAgent = notifyAgent

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

	
	local screenWidth, screenHeight = GUI.Area()
	local width = 400
	--local height = 100
	local fontHeight = 20
	local height = (20+20+40) + (lines*fontHeight)
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	local buttonWidth = 64
	local buttonHeight = 24
	local gap = 26
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	for index, value in text do
		local segname = "prompt_"..tostring(index)
		GUI.CreateText( segname, value, left + 16, (top + 16) + ((index-1)*fontHeight), right, bottom,  "Fonts/Edit.met" )
		GUI.SetColour( Segment.GetId(segname), 0, 0, 0, 1 )
	end

	local x = right - (gap + buttonWidth ) * getn( choices )
	local y = bottom - buttonHeight - 20
	myButtonSegments = {}
	for index, value in choices do
		local segname = "button_"..tostring(index)
		AddPanelButton( segname, value, x, y, x+buttonWidth, y + buttonHeight )
		myButtonSegments[ Segment.GetId( segname ) ] = index
		x = x + buttonWidth + gap
	end

end

function SystemUIChange( segment )
	if myButtonSegments[ segment ] ~= nil then
		Agent.SendMessage( myCallbackMessage, myNotifyAgent, Agent.Me(), myButtonSegments[ segment ])
	end
	Agent.Destroy()
end
