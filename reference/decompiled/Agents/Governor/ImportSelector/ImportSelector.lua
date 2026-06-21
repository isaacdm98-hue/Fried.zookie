# ImportSelector specializes UIAgent embeds Input

function Initialize( notify )
	myNotify = notify
	Input.SetFocus()

	local screenWidth, screenHeight = GUI.Area()
	local width = 300
	local height = 500
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0, 0 )
	local export = System.GetLabeledPath("EXPORT")
	local import_subdir = Config.Get("import_subdir", "")
	
	local title = "Import Zook from Desktop"
	if import_subdir ~= "" then
		title = title.."/"..import_subdir
	end
	
	GUI.CreateText("label", title, left + 16, top + 16, left+16, top + 16, "Fonts/Edit.met" )
	GUI.SetColour( Segment.label, 0, 0, 0, 1 )
	GUI.CreateList("creature_list",  left + 16, top + 46, right - 16, bottom - 56 ,  "Fonts/Edit.met" )
	creatures = System.GetDirectoryContents( export.."/"..import_subdir,  "*.zook", 1)
	GUI.SetListText( Segment.creature_list, creatures )

	local x = right - 80 * 2
	AddPanelButton( "ok_button", "OK", x, bottom - 24 - 16 , x + 64, bottom - 16 )
	x = x + 80
	AddPanelButton( "cancel_button", "Cancel", x, bottom - 24 - 16 , x + 64, bottom - 16  )
end


function SystemUIChange( segment )
	if segment == Segment.ok_button then
		local export = System.GetLabeledPath("EXPORT")
		local import_subdir = Config.Get("import_subdir", "")
	
		if import_subdir ~= "" then
			import_subdir = import_subdir.."/"
		end
		local name = GUI.GetListSelectedText( Segment.creature_list )
		local fullPath =  export.."/"..import_subdir..name
		
		Agent.SendMessage( "Import", myNotify, fullPath, name )
		Agent.Destroy()
	end
	if segment == Segment.cancel_button then
		Agent.Destroy()
	end
end


function MessageDestroy( )
	Agent.Destroy()
end
