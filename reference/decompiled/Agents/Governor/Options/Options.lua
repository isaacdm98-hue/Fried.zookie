# Options specializes UIAgent embeds Input

function Initialize( options, buttonWidth, notifyAgent, callbackMessage )
	
	Input.SetFocus()

	myCallbackMessage =  callbackMessage
	myNotifyAgent = notifyAgent
	
	local totalButtons = 0
	for i, v in options do
		totalButtons = totalButtons+1
	end
	
	local screenWidth, screenHeight = GUI.Area()
	local buttonHeight = 24
	local buttonGap = 6
	local margin = 20
	local height = (((buttonHeight+buttonGap)*totalButtons)-buttonGap)+(margin*2)
	local width = buttonWidth+margin+margin
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	
	local x = middle - (buttonWidth/2)
	local y = top+margin
	for i, v in options do
		AddPanelButton( "button_"..tostring(i), v, x, y, x+buttonWidth, y + buttonHeight )
		y = y + buttonHeight + buttonGap
	end

end

function SystemUIChange( segment )
	local name = Segment.GetName(segment)
	local buttonStr = String.gsub( name, "button_", "" )
	local button = tonumber(buttonStr)
	Agent.SendMessage( myCallbackMessage, myNotifyAgent, button)
	Agent.Destroy()
end
