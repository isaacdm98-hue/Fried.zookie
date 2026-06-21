#FileSelector specializes UIAgent embeds GUI

function Initialize(notifyAgent, callback, title, buttonName, path, extension, allowTextEntry, splashWindow)
	
	Input.SetFocus()

	
	myNotifyAgent = notifyAgent
	Callback = callback
	Extension = extension

	myWindow = nil
	if splashWindow ~= false then
		myWindow = Agent.Create("SimpleFrame")
		if splashWindow ~= 1 then
			GUI.CreatePicture("splash", splashWindow, 0, 0, screenWidth, screenHeight)
		else
			GUI.CreatePicture("splash", "splash", 0, 0, screenWidth, screenHeight)
		end
	end

	EditBoxFile = nil
	
	local screenWidth, screenHeight = GUI.Area()
	
		
	local width = 400
	local height = 400
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	local border = 16
	AddPanel(left, top, right, bottom, 1, 1, 1, 1, 0,0)
	
	local x = left+border
	local xRight = right-border
	local y = top + border
	bottom = bottom-border
	

	GUI.CreateText("box_label", title, x, y, x, y, "Fonts/Edit.met" )
	AddPanelButton( "select_button", buttonName, xRight-84-8-84, bottom - 32, xRight-8-84, bottom - 8 )
	local cancelName = "Cancel"
	if buttonName == "Save" then
		cancelName = "Don't Save"
	end
	AddPanelButton( "cancel_button", cancelName, xRight-84, bottom - 32, xRight, bottom - 8 )
	local y = y + 40
	bottom = bottom - 40
	local listBottom = bottom 

	if allowTextEntry ~= false then
		listBottom =listBottom - 40
		myEdit = GUI.CreateTextEdit("edit", "", x, listBottom+20, xRight, bottom,  "Fonts/Edit.met" )
	end
	GUI.CreateList("box_list", x , y, xRight, listBottom ,  "Fonts/edit.met" )


	-- populate list
	local files =  System.GetDirectoryContents( path, "*"..Extension, 1)
	RemoveCVS( files )
	RemoveExtensions(files)
	GUI.SetListText( Segment.box_list, files )
	
end


function Finalize()
	if myWindow ~= nil then
		Agent.SendMessage("Destroy", myWindow)
	end
end


function RemoveExtensions(list)
	if Extension ~= ".*" then
		local length = String.strlen(Extension)
		for index, value in list do
			list[index] = String.strsub(value, 0, String.strlen(value) - length) 
		end
	end
	
end

function RemoveCVS(list)
	for index, value in list do
		if String.strlower( value ) == "cvs" then
			tremove( list, index )
			return
		end
	end
end


function MessageFilename(f)
	GUI.SetText( myEdit, f) 
	EditBoxFile = f
end

function SystemUIChange( segment )

	if segment == Segment.box_list then
		if myEdit ~= nil then
			GUI.SetText( myEdit, GUI.GetListSelectedText( Segment.box_list ) )
		end
		-- EditBoxFile = nil if selection is from selection box
		EditBoxFile = nil
	elseif segment == Segment.edit then
		EditBoxFile = GUI.GetText( myEdit )
	elseif segment == Segment.select_button or segment == Segment.cancel_button then
		local file = nil
		if EditBoxFile == nil then
			file = GUI.GetListSelectedText( Segment.box_list )
		else
			EditBoxFile = GUI.GetText( myEdit )
			file = EditBoxFile
		end
		local exit = false
		if segment == Segment.select_button then
			if file ~= nil and file ~= "" then
				exit = 1
				if Extension == ".*" then
					TheFile = file
					TheFileWithExtension = file
				else
					-- removes the extension
					local length = String.strlen(Extension)
					local string = String.strsub(file, String.strlen(file) - (length-1), String.strlen(file))
					if string == Extension then -- may be hand entered
						TheFile = String.strsub(file, 0, String.strlen(file) - length)
						TheFileWithExtension = file
					else 
						TheFile = file
						TheFileWithExtension = TheFile..Extension
					end
				end
			end
		elseif segment == Segment.cancel_button then
			exit = 1
			TheFile = nil
			TheFileWithExtension = nil
		end
		if exit ~= false then
			if myNotifyAgent ~= nil then
				local notifyAgent = myNotifyAgent
				local callback = Callback
				local file = TheFile
				local fileWithExtension = TheFileWithExtension
				Agent.Destroy()
				-- TheFileWithExtension == File if extention = ".*" 
				Agent.SendMessage( callback, notifyAgent, file, fileWithExtension )	
			else
				System.ExitMainLoop()
			end
		end
	end
	
end

function MessageFile()
	return TheFile, TheFileWithExtension -- TheFileWithExtension == File if extention = ".*" 
end

