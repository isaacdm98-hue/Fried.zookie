# LightManager specializes UIAgent embeds Visual, Input, GUI


function Initialize(w)

	world = w

	Lights = {}
	Shadow = { alpha = 0.85,  source = Vector.New(-1, -4, -1) }
	TotalLights = 0


	MASTER = 1

	currentEditLight = 0
	myLastAnon = 0
	myCalibrating = false
	mySelecting = false
	CreateCalibrationUI()
	CreateSelectionUI()

	Config.Set("light_manager", Agent.Me())
	Input.RegisterKey(Input.KEY_L)
	MessageLoad("default.dat")
	Config.Set("projector_mode", 1)
	
end
	
	
function MessageLoad(name)	
	
	for id,v in Lights do
		MessageDestroyLight(v.id)
	end
	Lights = {}
	TotalLights = 0

	local path = Agent.GetPath()
	local table = System.ReadTable( path .. name )
	MASTER = table.MASTER
	if MASTER == nil then
		MASTER = 1
	end
	GUI.SetValue(Segment.master, MASTER)
	GUI.SetText( Segment.master_text, tostring(MASTER))	
	for i, v in table.Lights do
		local id = MessageCreateLight(v.type)
		MessageSetName(id, v.name)
		MessageSetColour(id, v.red, v.green, v.blue)
		MessageSetRadius(id, v.radius)
		MessageSetConeAngle(id,  v.angle)
		MessageSetPositionAndRotation(id, v.position, v.xAngle, v.yAngle, v.zAngle)
		SetGUIText(id)
	end
	Shadow = table.Shadow
	if Shadow ~= nil then
		MessageSetShadow(Shadow.source, Shadow.alpha)
	end
	filename = name
	GUI.SetText( Segment.filename, filename)
end


function MessageSave(name)

	local path = Agent.GetPath()
	local table = {}
	table.Lights = Clone(Lights)
	table.Shadow = Shadow
	table.MASTER = MASTER
	-- blank id info as this is internal only
	for i, v in table.Lights do
		v.id = nil
		v.segmentId = nil
	end

	System.WriteTable( path .. name, table )

end

		
function MessageCreateLight(type_string)
		
	World.OpenAccess(world)

	local type
	if type_string == "AMBIENT" then
		type = Visual.LIGHT_AMBIENT
	elseif type_string == "DIRECTIONAL" then
		type = Visual.LIGHT_DIRECTIONAL
	elseif type_string == "POINT" then
		type = Visual.LIGHT_POINT
	elseif type_string == "SPOT" then
		type = Visual.LIGHT_SPOT
	elseif type_string == "SOFTSPOT" then
		type = Visual.LIGHT_SOFTSPOT
	else
		return -1
	end
	
	local segment = Visual.CreateLight(type)
	TotalLights = TotalLights+1
	local id = TotalLights
	Lights[id] = {}
	Lights[id].id = id
	Lights[id].name = "no name"
	Lights[id].segmentId = segment
	Lights[id].type = type_string
	Lights[id].red = 0
	Lights[id].green = 0
	Lights[id].blue = 0
	Lights[id].radius = 0
	Lights[id].angle = 0
	Lights[id].position = Vector.New()
	Lights[id].xAngle = 0
	Lights[id].yAngle = 0
	Lights[id].zAngle = 0
	
	-- set light list	
	LoadLightList()
	SetGUIText(id)
		
	World.CloseAccess()


	return id
		
end
	
	
function LoadLightList()
	local light_ids = {}
	for i, v in Lights do
		light_ids[i] = tostring(Lights[i].id) .. " - " .. Lights[i].name
	end
	GUI.SetListText( Segment.light_list, light_ids )	
end

function MessageDestroy()
	Agent.Destroy()
end

function MessageDestroyLight(id)

	World.OpenAccess(world)
	Segment.Destroy(Lights[id].segmentId)
	World.CloseAccess()

	if currentEditLight == Lights[id].id then
		LoadLightList()
		SetGUIText(Lights[id].id)
		currentEditLight = Lights[id].id
	end
	Lights[id] = nil
end


function MessageSetShadow(s, a)

	World.OpenAccess(world)
	if Segment.shadow ~= nil then
		Segment.Destroy(Segment.shadow)
	end
	Visual.CreateShadowSource( s, a, "shadow" )
	World.CloseAccess()

	Shadow = {}
	Shadow.source = s
	Shadow.alpha = a

end

function MessageSetName(id, name)
	Lights[id].name = name
end


function MessageSetColour(id, red, green, blue)
	Lights[id].red = red
	Lights[id].blue = blue
	Lights[id].green = green

	World.OpenAccess(world)
	Visual.SetLightColour(Lights[id].segmentId, red * MASTER, green * MASTER, blue * MASTER)
	World.CloseAccess()

end


function MessageSetColourNoStore(id, red, green, blue)
	World.OpenAccess(world)
	Visual.SetLightColour(Lights[id].segmentId, red * MASTER, green * MASTER, blue * MASTER)
	World.CloseAccess()
end


function MessageSetRadius(id, radius)
	Lights[id].radius = radius
	World.OpenAccess(world)
	Visual.SetLightRadius(Lights[id].segmentId, radius)
	World.CloseAccess()

end


function MessageSetConeAngle(id,  angle)
	Lights[id].angle = angle
	World.OpenAccess(world)
	Visual.SetLightConeAngle(Lights[id].segmentId,  angle)
	World.CloseAccess()
end


function MessageSetTransform(id, transform)
	Lights[id].position = Matrix.GetTranslation(transform)
	local rotation = Matrix.GetRotation(transform)
	Lights[id].xAngle, Lights[id].yAngle, Lights[id].zAngle = Quatn.GetEuler(rotation)

	World.OpenAccess(world)
	Visual.SetLightTransform(Lights[id].segmentId, transform)
	World.CloseAccess()

end


function MessageSetPositionAndRotation(id, position, xAngle, yAngle, zAngle)
	
	Lights[id].position = position
	Lights[id].xAngle = xAngle
	Lights[id].yAngle = yAngle
	Lights[id].zAngle = zAngle
	
	
	
	local scale = Vector.New(1,1,1)
	local translation = position
	local rotation = Quatn.New()
	
	local transform = Matrix.New(scale, rotation, translation)
	
	Matrix.RotateX(transform, xAngle)
	Matrix.RotateY(transform, yAngle)
	Matrix.RotateZ(transform, zAngle)

--	local transform = Matrix.New()
--	Matrix.SetTranslation( transform, position )
--	Matrix.LookAt( transform, Vector.New( xAngle, yAngle, zAngle ), Vector.New( 1, 0, 0 ) )

	World.OpenAccess(world)
	Visual.SetLightTransform(Lights[id].segmentId, transform)
	World.CloseAccess()

end


function SystemKeyDown(key)

	local controlDown = Input.IsKeyDown(Input.KEY_LCONTROL) or Input.IsKeyDown(Input.KEY_RCONTROL)
	local shiftDown = Input.IsKeyDown(Input.KEY_LSHIFT) or Input.IsKeyDown(Input.KEY_RSHIFT)

	if key == Input.KEY_L and controlDown and not shiftDown then
		ToggleCalibration()
	end
	if key == Input.KEY_L and controlDown and shiftDown then
		ToggleSelection()
	end
	
end


function ToggleCalibration()
	if myCalibrating then
		GUI.Show( Segment.calibration_ui, false )
	else
		SetGUIText(currentEditLight)
		GUI.Show( Segment.calibration_ui, 1 )
	end
	myCalibrating = not myCalibrating
end


function ToggleSelection()
	if mySelecting then
		GUI.Show( Segment.selection_ui, false )
	else
		GUI.Show( Segment.selection_ui, 1 )
		for count = 1, 16 do
			local id = Segment.GetId("check_label"..count)
			GUI.SetText(id, "No Light")
		end
		local count = 0
		for index, v in Lights do 
			count = count+1
			if v.name ~= nil then
				local id = Segment.GetId("check_label"..count)
				GUI.SetText(id, v.name)
				local id = Segment.GetId("check_label"..(count+8))
				GUI.SetText(id, v.name)
			end
		end
	end
	mySelecting = not mySelecting
end

	

function CreateCalibrationUI()
	local width, height = GUI.Area()
	GUI.CreateObject( "calibration_ui", 0, 0, width, height, false )
	GUI.Show( Segment.calibration_ui, false )

	local left, top, right, bottom = 10, 10, 400, 700
	AddPanel( left, top, right, bottom, 1, 1, false, false,  Segment.calibration_ui,  Segment.calibration_ui )
		
	GUI.SetParent( Segment.calibration_ui )
	local x = left + 64
	local y = top + 20
	local width = 80
	local height = 24
	local gap = 8
	

	local yTop = y
	
	local boxHeight = height*25
	GUI.CreateText("light_label", "Light", x, y, x + 64, y + boxHeight, "Fonts/edit.met" )
	GUI.CreateCombo("light_list", "", x + 64, y, x + 64*4, y + height, "Fonts/edit.met" )
	y = y + height + gap


	GUI.CreateText( "name_label", "Name", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "name", "", x + 64, y, x + 64*4, y + height, "Fonts/edit.met" )
	y = y + height + gap
	
	GUI.CreateText( "type_label", "Type", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateText( "type", "", x + 64, y, x + 64*4, y + height, "Fonts/edit.met" )
	y = y + height + gap

	GUI.CreateText( "red_label", "RGB", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "red", "0", x + 64, y, x + 64*2, y + height, "Fonts/edit.met" )
--	y = y + height + gap
--	GUI.CreateText( "green_label", "Green", x+80, y, x +80+64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "green", "1", x + 80+64, y, x + 80+(64 * 2), y + height, "Fonts/edit.met" )
--	y = y + height + gap
--	GUI.CreateText( "blue_label", "Blue", x+80+80, y, x +80+80+64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "blue", "0", x + 80+80+64, y, x + 80+80+(64*2), y + height, "Fonts/edit.met" )
	y = y + height + gap
	GUI.CreateText( "radius_label", "Radius", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "radius", "1", x + 64, y, x + 64 * 2, y + height, "Fonts/edit.met" )
	y = y + height + gap
	GUI.CreateText( "angle_label", "Angle", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "angle", "1", x + 64, y, x + 64 * 2, y + height, "Fonts/edit.met" )
	y = y + height + gap
	GUI.CreateText( "x_label", "XYZ", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "x", "1", x + 64, y, x + 64 * 2, y + height, "Fonts/edit.met" )
--	y = y + height + gap
--	GUI.CreateText( "y_label", "Y", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "y", "1", x + 80+64, y, x + 80+(64 * 2), y + height, "Fonts/edit.met" )
--	y = y + height + gap
--	GUI.CreateText( "z_label", "Z", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "z", "1", x +80+80+ 64, y, x + 80+80+(64 * 2), y + height, "Fonts/edit.met" )
	y = y + height + gap
	GUI.CreateText( "xangle_label", "X Angle", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "xangle", "1", x + 64, y, x + 64 * 2, y + height, "Fonts/edit.met" )
	y = y + height + gap
	GUI.CreateText( "yangle_label", "Y Angle", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "yangle", "1", x + 64, y, x + 64 * 2, y + height, "Fonts/edit.met" )
	y = y + height + gap
	GUI.CreateText( "zangle_label", "Z Angle", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateTextEdit( "zangle", "1", x + 64, y, x + 64 * 2, y + height, "Fonts/edit.met" )

	y = y + height + gap
	GUI.CreateText( "master_label", "MASTER", x, y, x+64, y+25, "Fonts/edit.met" )
	GUI.CreateSlider( "master", x+84, y, x+284, y+50)
	GUI.SetValue( Segment.master, MASTER )
	GUI.CreateText( "master_text", "1", x+300, y, x + 340, y + height, "Fonts/edit.met" )


	y = y + height + height + gap
	GUI.CreateText( "shadow_label", "Shadow xyza", x, y, x + 64, y + height, "Fonts/edit.met" )
	local ls = 64
	GUI.CreateTextEdit( "shadowx", "1", ls + x + 32, y, ls + x + 32 * 2, y + height, "Fonts/edit.met" )
	ls = ls + 32 + 10
	GUI.CreateTextEdit( "shadowy", "1", ls + x + 32, y, ls + x + 32 * 2, y + height, "Fonts/edit.met" )
	ls = ls + 32 + 10
	GUI.CreateTextEdit( "shadowz", "1", ls + x + 32, y, ls + x + 32 * 2, y + height, "Fonts/edit.met" )
	ls = ls + 32 + 10
	GUI.CreateTextEdit( "shadowa", "1", ls + x + 32, y, ls +  x + 32 * 2, y + height, "Fonts/edit.met" )


	y = y + height + gap

	mySetButtons = {}
	local lb = left
	mySetButtons[1] = AddPanelButton( "apply", "Apply", lb + 64, y, lb + 64+width, y+height, Segment.calibration_ui )
	lb = left + width + 32
	y = y + height + gap
	lb = left
	mySetButtons[3] = AddPanelButton( "new", "New", lb + 64, y, lb + 64+width, y+height, Segment.calibration_ui )
	lb = lb + width +32
	GUI.CreateCombo("type_list", "", lb +64,  y,lb + 64+(width*2), y + height, "Fonts/edit.met" )
	
	local light_types = {
		"AMBIENT",
		"DIRECTIONAL",
		"POINT",
		"SPOT",
		"SOFTSPOT"}
	GUI.SetListText( Segment.type_list, light_types )	

	lb = left
	y = y + height + gap
	mySetButtons[4] = AddPanelButton( "delete", "Delete", lb + 64, y, lb + 64+width, y+height, Segment.calibration_ui )
	y = y + height + gap
	mySetButtons[2] = AddPanelButton( "save", "Save", lb + 64, y, lb + 64+width, y+height, Segment.calibration_ui )
	GUI.CreateTextEdit( "filename", "", lb +64+width,  y,lb + 64+(width*2)+width, y + height, "Fonts/edit.met" )
	y = y + height + gap
	mySetButtons[5] = AddPanelButton( "load", "Load", lb + 64, y, lb + 64+width, y+height, Segment.calibration_ui )

	GUI.SetParent()

		
end




function CreateSelectionUI()
	local width, height = GUI.Area()
	GUI.CreateObject( "selection_ui", 0, 0, width, height, false )
	GUI.Show( Segment.selection_ui, false )

	local left, top, right, bottom = 10, 10, 400, 700
	AddPanel( left, top, right, bottom, 1, 1, false, false,  Segment.selection_ui,  Segment.selection_ui )
		
	GUI.SetParent( Segment.selection_ui )
	local x = left + 64
	local y = top + 20
	local width = 80
	local height = 24
	local gap = 4
	
	CheckSegments = {}
	TotalCheckSegments = 0
	
	GUI.CreateText("At1", "Team 1", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateText("At2", "Team 2", x+64+20, y, x + 64, y + height, "Fonts/edit.met" )
	y = y + height + gap	
	for index = 1 , 4 do
		TotalCheckSegments = TotalCheckSegments+1
		CheckSegments[TotalCheckSegments] = {}
		AddButton( "check_button"..index, x+4, y, "check", "")
		CheckSegments[TotalCheckSegments].segment = Segment.GetId( "check_button"..index ) 
		CheckSegments[TotalCheckSegments].checked = false
		GUI.CreateText("check_label"..index, "No Light", x+25, y, x + 64, y + height, "Fonts/edit.met" )
		y = y + height + gap
	end
	y = y - ((height + gap) * 4)
	for index = 5 , 8 do
		TotalCheckSegments = TotalCheckSegments+1
		CheckSegments[TotalCheckSegments] = {}
		AddButton( "check_button"..index, x+84+4, y, "check", "")
		CheckSegments[TotalCheckSegments].segment= Segment.GetId( "check_button"..index ) 
		CheckSegments[TotalCheckSegments].checked = false
		GUI.CreateText("check_label"..index, "No Light", x+84+25, y, x +84+64, y + height, "Fonts/edit.met" )
		y = y + height + gap
	end
	
	AddPanelButton( "apply_A", "Apply setup A", x + 4, y,  x +84+64, y+height, Segment.selection_ui )
	APPLYA = Segment.GetId( "apply_A" ) 

	y = y + height + gap
	y = y + height + gap
	

	GUI.CreateText("Bt1", "Team 1", x, y, x + 64, y + height, "Fonts/edit.met" )
	GUI.CreateText("Bt2", "Team 2", x+64+20, y, x + 64, y + height, "Fonts/edit.met" )
	y = y + height + gap	
	for index = 9 , 12 do
		TotalCheckSegments = TotalCheckSegments+1
		CheckSegments[TotalCheckSegments] = {}
		AddButton( "check_button"..index, x+4, y, "check", "")
		CheckSegments[TotalCheckSegments].segment = Segment.GetId( "check_button"..index ) 
		CheckSegments[TotalCheckSegments].checked = false
		GUI.CreateText("check_label"..index, "No Light", x+25, y, x + 64, y + height, "Fonts/edit.met" )
		y = y + height + gap
	end
	y = y - ((height + gap) * 4)
	for index = 13 , 16 do
		TotalCheckSegments = TotalCheckSegments+1
		CheckSegments[TotalCheckSegments] = {}
		AddButton( "check_button"..index, x+84+4, y, "check", "")
		CheckSegments[TotalCheckSegments].segment= Segment.GetId( "check_button"..index ) 
		CheckSegments[TotalCheckSegments].checked = false
		GUI.CreateText("check_label"..index, "No Light", x+84+25, y, x +84+64, y + height, "Fonts/edit.met" )
		y = y + height + gap
	end
	
	AddPanelButton( "apply_B", "Apply setup B", x + 4, y,  x +84+64, y+height, Segment.selection_ui )
	APPLYB = Segment.GetId( "apply_B" ) 
	
end


function ApplySelection(first)
	local count = 0
	for id, v in Lights do
		count = count+1
		if CheckSegments[count+first].checked == false then
			MessageSetColourNoStore(id, 0, 0, 0)
		else
			MessageSetColourNoStore(id, Lights[id].red, Lights[id].green, Lights[id].blue)
		end
	end
end

function SystemUIChange( segment )
	
	for i,v in CheckSegments do 
		if segment == v.segment then
			if v.checked == false then
				v.checked = 1
			else
				v.checked = false
			end
			GUI.SetButtonPushed(v.segment, v.checked)
			return
		end
	end
	
	if segment == APPLYA then
		 ApplySelection(0)
		Config.Set("projector_mode", 1)
	elseif segment == APPLYB then
		 ApplySelection(8)
		Config.Set("projector_mode", 2)
	end

	if segment == Segment.load then
		MessageLoad( GUI.GetText( Segment.filename ) )
	end
		
	if segment == Segment.master then
		MASTER = GUI.GetValue( Segment.master )
		GUI.SetText( Segment.master_text, tostring(MASTER))	
		for i, v in Lights do
			MessageSetColour(v.id, v.red, v.green, v.blue)
		end
	end
	if segment == Segment.light_list then
		local text = GUI.GetText( Segment.light_list )
		local pos = String.strfind(text, "-", 1, 1)
		local id = tonumber(String.strsub(text, 1, pos-1))
		SetGUIText(id)
	end
	if segment == Segment.apply and currentEditLight ~= 0 then
		MessageGUIText(currentEditLight)
	end
	if segment == Segment.save then
		if currentEditLight ~= 0 then
			MessageGUIText(currentEditLight)
		end
		MessageSave(GUI.GetText( Segment.filename ))
	end
	if segment == Segment.new then
		local type = GUI.GetText(Segment.type_list)
		if type ~= "" then
			MessageCreateLight(type)
		end
	end
	if segment == Segment.delete then
		if currentEditLight ~= 0 then
			local text = GUI.GetText( Segment.light_list )
			local pos = String.strfind(text, "-", 1, 1)
			local id = tonumber(String.strsub(text, 1, pos-1))
			for i, v in Lights do
				if Lights[i].id == id then
					MessageDestroyLight(Lights[i].id)
					Lights[i] = nil
				end
			end
			
			LoadLightList()	
			currentEditLight = 0
			for i, v in Lights do
				currentEditLight = Lights[i].id
			end
			SetGUIText(currentEditLight)
			
		end
	end
end


function SetGUIText(id)
	currentEditLight = id
	Trace("Selected light %", currentEditLight)

	if currentEditLight == 0 then 
		return
	end
	GUI.SetText( Segment.light_list, tostring(Lights[id].id) .. " - " .. Lights[id].name)	
	GUI.SetText( Segment.name, Lights[id].name)	
	GUI.SetText( Segment.type, Lights[id].type)	
	GUI.SetText( Segment.red, tostring(Lights[id].red))
	GUI.SetText( Segment.green, tostring(Lights[id].green ))
	GUI.SetText( Segment.blue, tostring(Lights[id].blue ))
	GUI.SetText( Segment.radius, tostring(Lights[id].radius ))
	GUI.SetText( Segment.angle, tostring(Lights[id].angle ))
	GUI.SetText( Segment.x, tostring(Vector.GetX(Lights[id].position)) )
	GUI.SetText( Segment.y, tostring(Vector.GetY(Lights[id].position)) )
	GUI.SetText( Segment.z, tostring(Vector.GetZ(Lights[id].position)) )
	GUI.SetText( Segment.xangle, tostring(Lights[id].xAngle ))
	GUI.SetText( Segment.yangle, tostring(Lights[id].yAngle ))
	GUI.SetText( Segment.zangle, tostring(Lights[id].zAngle ))
	if Shadow ~= nil then
		GUI.SetText( Segment.shadowx, tostring(Vector.GetX(Shadow.source)))
		GUI.SetText( Segment.shadowy, tostring(Vector.GetY(Shadow.source)))
		GUI.SetText( Segment.shadowz, tostring(Vector.GetZ(Shadow.source)))
		GUI.SetText( Segment.shadowa, tostring(Shadow.alpha))
	end
	currentEditLight = id
end


function MessageGUIText(id)
	Trace("Getting light %", id)

	MessageSetName(id, GUI.GetText( Segment.name) )
	MessageSetColour(id, tonumber( GUI.GetText( Segment.red) ), tonumber( GUI.GetText( Segment.green) ), tonumber( GUI.GetText( Segment.blue) ))
	MessageSetRadius(id, tonumber( GUI.GetText( Segment.radius)))
	MessageSetConeAngle(id, tonumber( GUI.GetText( Segment.angle)))
	local position = Vector.New(tonumber( GUI.GetText( Segment.x)), tonumber( GUI.GetText( Segment.y)), tonumber( GUI.GetText( Segment.z)))
	MessageSetPositionAndRotation(id, position, tonumber( GUI.GetText( Segment.xangle)), tonumber( GUI.GetText( Segment.yangle)), tonumber( GUI.GetText( Segment.zangle)))
	LoadLightList()
	GUI.SetText( Segment.light_list, tostring(Lights[id].id) .. " - " .. Lights[id].name )

	local x = tonumber(GUI.GetText(  Segment.shadowx ))
	local y = tonumber(GUI.GetText( Segment.shadowy ))
	local z = tonumber(GUI.GetText( Segment.shadowz ))
	local a = tonumber(GUI.GetText( Segment.shadowa ))
	if x ~= nil and y ~= nil and z ~= nil and a ~= nil then
		MessageSetShadow(Vector.New(x,y,z), a)
	end

end






function AddPanel( left, top, right, bottom, tlRound, trRound, blRound, brRound, glowLayer, panelLayer )
	GUI.SetParent( glowLayer )
	AddPanelGlow( left, top, right, bottom )
	GUI.SetParent( panelLayer )
	GUI.CreateObject( AnySegment(), left, top, right, bottom )
	local size = 12
	if (bottom-top)/2 <12 then size = (bottom-top)/2 end
	local texture = "./UI/UI"
	local r, g, b, a = PanelColour()
	if tlRound then
		GUI.CreatePicture( AnySegment(), texture, left, top, left + size, top + size, 0, 64, 12, 76, 1 )
	else
		GUI.CreatePicture( AnySegment(), texture, left, top, left + size, top + size, 48, 64, 60, 76, 1 )
	end
	GUI.SetColour( LastSegment(), r, g, b, a )
	GUI.CreatePicture( AnySegment(), texture, left + size, top, right - size, top + size, 60, 64, 60, 76, 1 )
	GUI.SetColour( LastSegment(), r, g, b, a )
	if trRound then
		GUI.CreatePicture( AnySegment(), texture, right - size, top, right, top + size, 12, 64, 24, 76, 1 )
	else
		GUI.CreatePicture( AnySegment(), texture, right - size, top, right, top + size, 60, 64, 72, 76, 1 )
	end
	GUI.SetColour( LastSegment(), r, g, b, a )
	GUI.CreatePicture( AnySegment(), texture, left, top + size, left + size, bottom - size, 48, 76, 60, 76, 1 )
	GUI.SetColour( LastSegment(), r, g, b, a )
	GUI.CreatePicture( AnySegment(), texture, left + size, top + size, right - size, bottom - size, 60, 76, 60, 76, 1 )
	GUI.SetColour( LastSegment(), r, g, b, a )
	GUI.CreatePicture( AnySegment(), texture, right - size, top + size, right, bottom - size, 60, 76, 72, 76, 1 )
	GUI.SetColour( LastSegment(), r, g, b, a )
	if blRound then
		GUI.CreatePicture( AnySegment(), texture, left, bottom - size, left + size, bottom, 0, 76, 12, 88, 1 )
	else
		GUI.CreatePicture( AnySegment(), texture, left, bottom - size, left + size, bottom, 48, 76, 60, 88, 1 )
	end
	GUI.SetColour( LastSegment(), r, g, b, a )
	GUI.CreatePicture( AnySegment(), texture, left + size, bottom - size, right - size, bottom, 60, 76, 60, 88, 1 )
	GUI.SetColour( LastSegment(), r, g, b, a )
	if brRound then
		GUI.CreatePicture( AnySegment(), texture, right - size, bottom - size, right, bottom, 12, 76, 24, 88, 1 )
	else
		GUI.CreatePicture( AnySegment(), texture, right - size, bottom - size, right, bottom, 60, 76, 72, 88, 1 )
	end
	GUI.SetColour( LastSegment(), r, g, b, a )
	GUI.SetParent()
end


function AddPanelButton( name, label, x, y, x2, y2, parent )
	if parent == nil then
		parent = 0
	end
	AddPanel( x, y, x2, y2, 1, 1, 1, 1, parent, parent )
	local iconRoot = "UI\\Buttons\\UI_Blank"
	GUI.SetParent( parent )
	GUI.CreateButtonEx( name, x, y, x2, y2, iconRoot.."_Up", iconRoot.."_Dn", iconRoot.."_Ov" )
	local width, height = GUI.MeasureText( label, "Fonts/Edit.met"  )
	GUI.CreateText(AnySegment(), label, (x + x2 - width)/2, (y+y2 - height)/2, x+16, y, "Fonts/Edit.met" )
	GUI.SetColour( LastSegment(), 0, 0, 0, 1 )
	return Segment.GetId( name )
end


function AnySegment()
	myLastAnon = myLastAnon + 1
	return "Anon"..myLastAnon
end


function PanelColour()
	myPanelColourRed = Config.Get("panel_colour_red", 1)
	myPanelColourGreen = Config.Get("panel_colour_green", 1)
	myPanelColourBlue = Config.Get("panel_colour_blue", 1)
	myPanelColourAlpha = Config.Get("panel_colour_alpha", 0.6)
	return myPanelColourRed, myPanelColourGreen, myPanelColourBlue, myPanelColourAlpha
end


function LastSegment()
	return Segment.GetId( "Anon"..myLastAnon )
end


function AddPanelGlow( left, top, right, bottom )
	local margin = 18
	GUI.CreateBorder( AnySegment(), left - margin, top - margin, right + margin, bottom + margin, 128, 0, 200, 72, 1 )
end

	