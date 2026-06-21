# GroupLightManager specializes UIAgent embeds Camera, Visual, Input, GUI

constDepth = 25


function Initialize(w)
	myWorld = w
	Camera.Create(0,0,1,1)
	Camera.Show( false )
	CFG_PATH = Config.Get("product_directory", ".") .."/"
	Input.RegisterKey(Input.KEY_G)
	myUI = false
	myCurrentLight = 9
	MessageLoad(CFG_PATH.."default.lightgroups")
	Config.Set("projector_mode", 1)
	myTable1Shift = Vector.New( 0,0,0 )
	myTable2Shift = Vector.New( 0,0,0 )
	LoadOffsets()
	MakeSpotUI()
	GUI.Show( Segment.spot_parent, myUI )
	myFloorMoving = false
end

function Finalize()
	if myUI then
		Agent.SendMessage( "Destroy", myLightProperties )
		Agent.SendMessage( "Destroy", myManagerProperties )
		--Agent.SendMessage( "Destroy", myLightEnable1 )
		--Agent.SendMessage( "Destroy", myLightEnable2 )
		Agent.SendMessage( "Destroy", myTableShift )
	end
end

function MessageDestroy()
	Agent.Destroy()
end
		
	
function MessageLoad(name)	
	myLights = System.ReadTable( name )
	for i = 0, 9 do
		if myLights[i] == nil then
			myLights[i] = { enabled = 1, ambient = 0.4, diffuse = 0.7, specular1 = 0.5, specular2 = 0.5,
				position = Vector.New( 0, 100, 0 ), enabled1 = 1, enabled2 = 1 }
		end
	end
	if myLights.up_delay == nil then
		myLights.up_delay = 1
	end
	if myLights.down_delay == nil then
		myLights.down_delay = 1
	end
	if myLights.table_speed == nil then
		myLights.table_speed = 2
	end
	SetLights()
end

function MessageSave(name)
	System.WriteTable( name, myLights )
end


function SystemKeyDown(key)

	local controlDown = Input.IsKeyDown(Input.KEY_LCONTROL) or Input.IsKeyDown(Input.KEY_RCONTROL)
	local shiftDown = Input.IsKeyDown(Input.KEY_LSHIFT) or Input.IsKeyDown(Input.KEY_RSHIFT)

	if key == Input.KEY_G and controlDown and not shiftDown then
		ToggleUI()
	end
end


function ToggleUI()
	local propDefs = {
		{ name = "light", label = "Light", enum = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9" } },
		{ name = "enabled", label = "Enabled", check = 1, top = 1 },
		{ name = "ambient", label = "Ambient", default = 0.4, min = 0, max = 1 },
		{ name = "diffuse", label = "Diffuse", default = 0.7, min = 0, max = 1 },
		{ name = "specular1", label = "Coloured Specular", default = 0.5, min = 0, max = 1 },
		{ name = "specular2", label = "White Specular", default = 0.5, min = 0, max = 1 },
		{ name = "position", label = "Position", vector = 1, default = Vector.New(0,0,0) },
		--{ name = "floor", label = "Virtual table", check = 1  },
		--{ name = "all_off", label = "", button = "All Spots Off"  },
		{ name = "copy", button = "Copy to All"  },
		{ name = "load", button = "Load", top = 1  },
		{ name = "save", button = "Save"  }
	}
	local managerDefs = {
		{ name = "table_speed", label = "Table Speed", default = 2, min = 0.1, max = 4  },
		{ name = "up_delay", label = "Up Delay", default = 1, min = 0, max = 4  },
		{ name = "down_delay", label = "Down Delay", default = 1, min = 0, max = 4  },
		{ name = "up_and_on", button = "Tables up, lights on"  },
		{ name = "choice_lights_on", button = "Choice lights on"  },
		{ name = "off_and_down", button = "Lights off, tables down"  },
	}
	local enableDefs = {
		{ name = "1", label = "Light 1", check = 1 },
		{ name = "2", label = "Light 2", check = 1 },
		{ name = "3", label = "Light 3", check = 1 },
		{ name = "4", label = "Light 4", check = 1 },
		{ name = "5", label = "Light 5", check = 1, top =1 },
		{ name = "6", label = "Light 6", check = 1 },
		{ name = "7", label = "Light 7", check = 1 },
		{ name = "8", label = "Light 8", check = 1 },
		{ name = "apply", label = "", button = "Apply"  }
	}
	local shiftDefs = {
		{ name = "table1", label = "Table 1", vector = .01, default = Vector.New(0,0,0) },
		{ name = "table2", label = "Table 2", vector = .01, default = Vector.New(0,0,0) },
		{ name = "load", label = "", button = "Load"  },
		{ name = "save", label = "", button = "Save"  }
	}
		
	if not myUI then
		myLightProperties = Agent.Create( "PropertyEdit", 8, 16, 224, Agent.Me(), "PropertyEdit", {top_round = 1}, propDefs )
		myManagerProperties = Agent.Create( "PropertyEdit", 232, 224, 432, Agent.Me(), "PropertyEdit", {}, managerDefs )
		myTableShift = Agent.Create( "PropertyEdit", 8, Agent.SendMessage( "GetBottom", myLightProperties )+8,
			224, Agent.Me(), "ShiftTables", {top_round = 1}, shiftDefs )
		Agent.SendMessage("UpdateAll", myLightProperties)
		Agent.SendMessage("UpdateAll", myManagerProperties)
		Agent.SendMessage("UpdateAll", myTableShift)
		UpdateSpotButtons()
	else
		Agent.SendMessage( "Destroy", myLightProperties )
		Agent.SendMessage( "Destroy", myManagerProperties )
		--Agent.SendMessage( "Destroy", myLightEnable1 )
		--Agent.SendMessage( "Destroy", myLightEnable2 )
		Agent.SendMessage( "Destroy", myTableShift )
	end
	myUI = not myUI
	GUI.Show( Segment.spot_parent, myUI )
end

function MakeSpotUI()
	local x1, y1 = 232, 16
	local width, height = 200, 200
	local x2, y2 = x1 + width, y1 + height
	GUI.CreateObject( "spot_parent", x1, y1, x2, y2 )
	AddPanel( 0, 0, width, height, 1, 1, false, false, Segment.spot_parent, Segment.spot_parent )
	GUI.SetParent( Segment.spot_parent )
	GUI.CreateText( "label1", "Choosing Zooks", 8, 8, 8, 8, "Fonts/Edit.met" )
	GUI.CreateText( "label2", "Chosen Zook", 8, 108, 8, 8, "Fonts/Edit.met" )

	mySpotButtons = {{},{}}
	for set = 1, 2 do
		local zook = 1
		for team = 0, 1 do
			for column = 0, 1 do
				for row = 0, 1 do
					local x = 16 + team * 100 + column * 32
					local y = 64 - row * 32 + (set-1) * 100
					AddButton( "spot"..set..zook, x, y, "Bulb", "Spot" )
					mySpotButtons[set][zook] = Segment.GetId(  "spot"..set..zook )
					zook = zook + 1
				end
			end
		end
	end
end

function SystemUIChange( segment )
	for i = 1, 8 do
		if segment == mySpotButtons[1][i] then
			myLights[ i ].enabled1 = not myLights[ i ].enabled1
			GUI.SetButtonPushed( segment, myLights[ i ].enabled1 )
		end
	end
	for i = 1, 4 do
		if segment == mySpotButtons[2][i] then
			for j = 1, 4 do
				myLights[ j ].enabled2 = false
				GUI.SetButtonPushed( mySpotButtons[2][j], false )
			end
			myLights[ i ].enabled2 = 1
			GUI.SetButtonPushed( segment, 1 )
		end
	end
	for i = 5, 8 do
		if segment == mySpotButtons[2][i] then
			for j = 5, 8 do
				myLights[ j ].enabled2 = false
				GUI.SetButtonPushed( mySpotButtons[2][j], false )
			end
			myLights[ i ].enabled2 = 1
			GUI.SetButtonPushed( segment, 1 )
		end
	end
end

function UpdateSpotButtons()
	for i = 1, 8 do
		GUI.SetButtonPushed( mySpotButtons[1][i], myLights[ i ].enabled1 )
	end
	for i = 1, 8 do
		GUI.SetButtonPushed( mySpotButtons[2][i], myLights[ i ].enabled2 )
	end
end

function MessagePropertyEditNotifyVectorX( field, value )
	local x, y, z = Vector.GetXYZ( myLights[ myCurrentLight ][ field ] )
	myLights[ myCurrentLight ][ field ] = Vector.New( value, y, z )
	SetLight( myCurrentLight )
end

function MessagePropertyEditNotifyVectorY( field, value )
	local x, y, z = Vector.GetXYZ( myLights[ myCurrentLight ][ field ] )
	myLights[ myCurrentLight ][ field ] = Vector.New( x, value, z )
	SetLight( myCurrentLight )
end

function MessagePropertyEditNotifyVectorZ( field, value )
	local x, y, z = Vector.GetXYZ( myLights[ myCurrentLight ][ field ] )
	myLights[ myCurrentLight ][ field ] = Vector.New( x, y, value )
	SetLight( myCurrentLight )
end

function MessagePropertyEditNotify( field, value )
	if field == "floor" then
		myLights[ 9 ].enabled = value
		SetLights()
	elseif field == "all_off" then
		for i = 1, 8 do
			myLights[ i ].enabled = false
		end
		SetLights()
	elseif field == "up_and_on" then
		UpAndOn()
	elseif field == "choice_lights_on" then
		MessageSetLights2()
	elseif field == "off_and_down" then
		OffAndDown()
	elseif field == "copy" then
		for i = 0, 9 do
			myLights[ i ] = Clone( myLights[ myCurrentLight ] )
		end
		SetLights()
	elseif field == "load" then
		Agent.Create("FileSelector", Agent.Me(), "LoadFrom", "Load Configuration", "Load", CFG_PATH, ".lightgroups", false, false)
		SetLights()
	elseif field == "save" then
		Agent.Create("FileSelector", Agent.Me(), "SaveAs", "Save Configuration", "Save", CFG_PATH, ".lightgroups", 1, false)
	elseif field == "light" then
		myCurrentLight = tonumber( value )
	elseif field == "table_speed" then
		myLights.table_speed = value
	elseif field == "up_delay" then
		myLights.up_delay = value
	elseif field == "down_delay" then
		myLights.down_delay = value
	else
		myLights[ myCurrentLight ][ field ] = value
		SetLight( myCurrentLight )
	end
end

function UpAndOn()
	World.OpenAccess( myWorld )
		myFloorMoving = 1
		myStartTime = World.SimTime()
	World.CloseAccess()
end

function OffAndDown()
	Config.Set("projector_mode", 2)
	for i = 1, 8 do
		myLights[ i ].enabled = false
	end
	SetLights()
	Agent.PostMessage( "LowerTable", Agent.Me(), myLights.down_delay )
end

function MessageLowerTable()
	World.OpenAccess( myWorld )
		myFloorMoving = 2
		myStartTime = World.SimTime()
	World.CloseAccess()
end

function SystemCamera( frametime )
	if myFloorMoving then
		World.OpenAccess( myWorld )
			local time = ( World.SimTime() - myStartTime ) / myLights.table_speed
		World.CloseAccess()
		if time > 1 then
			time = 1
		end
		local t = 0.5 - Number.cos( time*180 ) / 2
		if myFloorMoving == 1 then -- moving up
			height = -constDepth * (1-t)
		else -- moving down
			height = -constDepth * t
		end
		World.SetVisualGroupOffset( 512, Vector.New( 0, height, 0 ) )
		if time == 1 then
			if myFloorMoving == 1 then
				Agent.PostMessage( "SetLights1", Agent.Me(), myLights.up_delay )
			end
			myFloorMoving = false
		end
	end
end


function LoadOffsets()
	local positions = System.ReadTable( CFG_PATH.."offsets.dat" )
	if positions.table1 ~= nil then
		SetTableShift1( positions.table1 )
		SetTableShift2( positions.table2 )
	end
end

function SaveOffsets()
	positions = {}
	positions.table1 = myTable1Shift
	positions.table2 = myTable2Shift
	System.WriteTable( CFG_PATH.."offsets.dat", positions )
end

function MessageShiftTablesNotifyVectorX( field, value )
	if field == "table1" then
		local x, y, z = Vector.GetXYZ( myTable1Shift )
		SetTableShift1( Vector.New( value, y, z ) )
	end
	if field == "table2" then
		local x, y, z = Vector.GetXYZ( myTable2Shift )
		SetTableShift2( Vector.New( value, y, z ) )
	end
end

function MessageShiftTablesNotifyVectorY( field, value )
	if field == "table1" then
		local x, y, z = Vector.GetXYZ( myTable1Shift )
		SetTableShift1( Vector.New( x, value, z ) )
	end
	if field == "table2" then
		local x, y, z = Vector.GetXYZ( myTable2Shift )
		SetTableShift2( Vector.New( x, value, z ) )
	end
end

function MessageShiftTablesNotifyVectorZ( field, value )
	if field == "table1" then
		local x, y, z = Vector.GetXYZ( myTable1Shift )
		SetTableShift1( Vector.New( x, y, value ) )
	end
	if field == "table2" then
		local x, y, z = Vector.GetXYZ( myTable2Shift )
		SetTableShift2( Vector.New( x, y, value ) )
	end
end

function SetTableShift1( value )
	myTable1Shift = value
	World.OpenAccess(myWorld)
		World.SetVisualGroupOffset( 128, value )
	World.CloseAccess()
end

function SetTableShift2( value )
	myTable2Shift = value
	World.OpenAccess(myWorld)
		World.SetVisualGroupOffset( 256, value )
	World.CloseAccess()
end

function MessageShiftTablesNotify( field, value )
	World.OpenAccess(myWorld)
		if field == "load" then
			LoadOffsets()
		elseif field == "save" then
			SaveOffsets()
		elseif field == "table1" then
			myTable1Shift = value
			World.SetVisualGroupOffset( 128, value )
		elseif field == "table2" then
			myTable2Shift = value
			World.SetVisualGroupOffset( 256, value )
		end
	World.CloseAccess()
end		

function MessageShiftTablesGet( field )
	if field == "table1" then
		return myTable1Shift
	elseif field == "table2" then
		return myTable2Shift
	end
end


function MessageLoadFrom(file, fileWithExtension)
	if file ~= nil then
		MessageLoad(CFG_PATH..fileWithExtension)
	end
end

function MessageSaveAs(file, fileWithExtension)
	if file ~= nil then
		MessageSave(CFG_PATH..fileWithExtension)
	end
end

function MessagePropertyEditGet( field )
	if field == "floor" then
		return myLights[9].enabled
	elseif field == "table_speed" then
		return myLights.table_speed
	elseif field == "up_delay" then
		return myLights.up_delay
	elseif field == "down_delay" then
		return myLights.down_delay
	elseif field == "light" then
		return tostring( myCurrentLight )
	else
		return myLights[ myCurrentLight ][field]
	end
end

function MessageEnableEdit1Notify( field, value )
	if field == "apply" then
		for i = 1, 8 do
			myLights[ i ].enabled = myLights[ i ].enabled1
		end
		--~ Input.SendMidi( 144,127, 127)
		--~ Input.SendMidi( 192, 1, 0 )
		SetLights()
		Agent.SendMessage("UpdateAll", myLightProperties)
		Config.Set("projector_mode", 1)
	else
		myLights[ tonumber(field) ].enabled1 = value
	end
end

function MessageEnableEdit2Notify( field, value )
	if field == "apply" then
		for i = 1, 8 do
			myLights[ i ].enabled = myLights[ i ].enabled2
		end
		SetLights()
		Agent.SendMessage("UpdateAll", myLightProperties)
		Config.Set("projector_mode", 2)
	else
		myLights[ tonumber(field) ].enabled2 = value
	end
end

function MessageEnableEdit1Get( field  )
	return myLights[ tonumber(field) ].enabled1
end

function MessageEnableEdit2Get( field  )
	return myLights[ tonumber(field) ].enabled2
end

function SetLights()
	for i = 0, 9 do
		SetLight(i)
	end
end

function MessageSetLights1()
	for i = 1, 8 do
		myLights[ i ].enabled = myLights[ i ].enabled1
	end
	--~ Input.SendMidi( 144,127, 127)
	--~ Input.SendMidi( 192, 1, 0 )
	SetLights()
	Agent.SendMessage("UpdateAll", myLightProperties)
	Config.Set("projector_mode", 1)
end

function MessageSetLights2()
	for i = 1, 8 do
		myLights[ i ].enabled = myLights[ i ].enabled2
	end
	--~ Input.SendMidi( 144,127, 127)
	--~ Input.SendMidi( 192, 1, 0 )
	SetLights()
	Agent.SendMessage("UpdateAll", myLightProperties)
	Config.Set("projector_mode", 2)
end

function SetLight( i )
	World.OpenAccess(myWorld)
		Visual.SetGroupLighting( i, myLights[i].enabled, myLights[i].ambient, myLights[i].diffuse,
			myLights[i].specular1, myLights[i].specular2, myLights[i].position )
	World.CloseAccess()
end
