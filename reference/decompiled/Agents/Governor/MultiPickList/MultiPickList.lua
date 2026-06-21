# MultiPickList specializes UIAgent embeds Input

function Initialize( notifyAgent, title, masterList, selectedList )

	Input.SetFocus()

	myNotifyAgent = notifyAgent
	myMasterList = masterList
	mySelectedList = selectedList
	myOriginalSelectedList = Clone(selectedList)
	myNextSelected = 1
	for index, value in mySelectedList do
		myNextSelected = index
	end
	myNextSelected = myNextSelected+1

	local screenWidth, screenHeight = GUI.Area()
	local width = 500
	local height = 250
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	local centrey = screenHeight/2
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	GUI.CreateText( "title", title .. ":", left + 16, top + 16, right, bottom,  "Fonts/Edit.met" )
	GUI.SetColour( Segment.title, 0, 0, 0, 1 )
	
	GUI.CreateList( "masterlist", left + 16, top + 40, middle -30, bottom-50, "Fonts/Edit.met" )
	GUI.CreateList( "selectedlist", middle+30, top + 40, right - 16, bottom-50, "Fonts/Edit.met" )

	AddPanelButton( "add", "> >", middle - 15, centrey-30, middle+15, centrey-6 )
	AddPanelButton( "subtract", "< <", middle - 15, centrey+6, middle+15, centrey+30 )
	

	AddPanelButton( "ok_button", "OK", right - 164, bottom-40, right - 100, bottom-16 )
	AddPanelButton( "cancel_button", "Cancel", right - 80, bottom-40, right - 16, bottom-16 )
	
	
	Input.RegisterKey(Input.KEY_RETURN)
	SetLists()
	
end


function SetLists()
	local activeList = Clone(myMasterList)
	for index, value in activeList do
		for i,v in mySelectedList do
			if value == v then 
				activeList[index] = nil
			        break
			end
		end
	end
	GUI.SetListText( Segment.masterlist, activeList)
	GUI.SetListText( Segment.selectedlist, mySelectedList)
end

function SystemKeyDown(key)
	if key == Input.KEY_RETURN then
		SystemUIChange( Segment.ok_button )
	end
end

function SystemUIChange( segment )
	if segment == Segment.ok_button then
		if myNotifyAgent ~= nil then
			-- run form agent, pass details back and destroy
			Agent.SendMessage( "MultiPickListOK", myNotifyAgent, mySelectedList)
			Agent.Destroy()
		else
			-- presumes run for boot script, pass back control
			System.ExitMainLoop()
		end
	elseif segment == Segment.cancel_button then
		mySelectedList = myOriginalSelectedList
		local notifyAgent = myNotifyAgent
		Agent.Destroy()
		if notifyAgent == nil then
			-- presumes run for boot script, pass back control
			System.ExitMainLoop()
		end
	elseif segment == Segment.add then
		local selected = GUI.GetListSelectedText(Segment.masterlist)
		if selected ~= false then
			mySelectedList[myNextSelected] = selected
			myNextSelected = myNextSelected + 1
			SetLists()
		end			
	elseif segment == Segment.subtract then
		local selected = GUI.GetListSelectedText(Segment.selectedlist)
		if selected ~= false then
			for i,v in mySelectedList do
				if selected == v then 
					mySelectedList[i] = nil
					break
				end
			end
			SetLists()
		end		
	end
	
end


function MessageList()
	return mySelectedList
end
