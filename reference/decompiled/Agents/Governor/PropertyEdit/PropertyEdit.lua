# PropertyEdit specializes UIAgent embeds Input, Sound

constLabelHeight = 15
constTopGap = 8

function Initialize(left, top, right, notifyAgent, messagePrefix, format, parameters)
	myLeft = left
	myTop = top
	myRight = right
	myNotifyAgent = notifyAgent
	myMessagePrefix = messagePrefix
	myParameters = parameters
	myActiveSpinner = false
	myFormat = format
	if myFormat.initalize_all == nil then myFormat.initalize_all = 1 end
	if myFormat.top_round == nil then myFormat.top_round = false end
	if myFormat.left_margin == nil then myFormat.left_margin = 4 end

	Input.RegisterMouse()
	
	local screenWidth, screenHeight = GUI.Area()
	GUI.SetParent()
	if myFormat.align_topleft ~= nil then
		GUI.CreateObject( "parent", 0, 0, screenWidth, screenHeight, false )
	else
		GUI.CreateObject( "parent", 1, 1, screenWidth, screenHeight, false )
	end
	
	myBottom = myTop + CalcHeight(myParameters)

	AddPanel( left, top, right, myBottom, myFormat.top_round, myFormat.top_round, false, false,  Segment.parent,  Segment.parent )

	CreateUI()
	MessageShow( 1 )

	
	DefaultsInitialized = false
end

function MessageSetLeft( left )
	myLeft = left
end

function MessageHeight()
	return CalcHeight(myParameters)
end


function  CalcHeight(parameters)
	local yTab = {}
	for index, value in parameters do
		if value.tab == nil then
			value.tab = "General"
		end
		if yTab[ value.tab ] == nil then
			yTab[ value.tab ] = 16
		end
		yTab[ value.tab ] = yTab[ value.tab ] + FieldHeight( parameters, index )
		if value.label ~= nil and myFormat.no_labels ~= 1 then
			yTab[ value.tab ] = yTab[ value.tab ] + constLabelHeight
		end
		if value.top ~= nil then
			yTab[ value.tab ] = yTab[ value.tab ] + constTopGap
		end
			
	end
	
	local height = 0 
	local tabName = ""
	for index, tab in yTab do
		if tab > height then
			height = tab 
			tabName = index
		end
	end
	if getn( yTab ) >1 then
		height = height + 8
	end
	return height, tabName
end


function MessageGetBottom()
	return myBottom
end

function CreateTabs()
	myTabs = {}
	local nTabs = 0
	for index, attribute in myParameters do
		local exists = false
		for index, tab in myTabs do
			if tab == attribute.tab then
				exists = 1
			end
		end
		if not exists then
			nTabs = nTabs + 1
			myTabs[ nTabs ] = attribute.tab
		end
	end
	if nTabs == 0 then
		return
	elseif nTabs > 1 then
		AddTabButtons( myLeft, myTop, myRight, myBottom, myTabs, myTabs, Segment.parent )
	else
		GUI.SetParent( Segment.parent )
		local swidth, sheight = GUI.Area()
		GUI.CreateObject( myTabs[1].."_tab_layer",  1, 0, swidth, sheight, false )
	end
end

function CreateUI()
	CreateTabs()

	local x = myLeft + myFormat.left_margin
	local xRight = myRight - 16
	local y = myTop + 8
	if getn( myTabs ) > 1 then
		y = y + 8
	end
	
	myEnums = {}
	myButtonEnums = {}
	myButtons = {}
	mySliders = {}
	myEdits = {}
	myLists = {}
	myTexts = {}
	myCheckBoxes = {}
	myColours = {}
	myColoursX = {}
	myColoursY = {}
	myColoursPic = {}
	myVectorXs = {}
	myVectorYs = {}
	myVectorZs = {}
	mySpinnersX = {}
	mySpinnersY = {}
	mySpinnersZ = {}
	myTextureButtons = {}
	myTextureBits = {}
	myTextureSliders= {}

	local tabY = {}
	for index, tab in myTabs do
		tabY[ tab ] = y
	end
	
	for index, attribute in myParameters do
		local parent = Segment.GetId( attribute.tab.."_tab_layer" ) 
		GUI.SetParent( parent )
		y = tabY[ attribute.tab ]
				
		if attribute.top ~= nil then
			y = y + constTopGap
		end
		if attribute.label ~= nil and myFormat.no_labels ~= 1 then
			local xLabel = x
			if attribute.check ~= nil then
				xLabel = xLabel + 32
			end
			local s = GUI.CreateText( "attr_label"..index, attribute.label, xLabel, y, xLabel, y, "Fonts/Edit.met" )
			GUI.SetColour( s, 0, 0, 0, 1 )
			y = y +constLabelHeight
		end
		
		if attribute.enum ~= nil then
			GUI.CreateCombo( "attr_enum"..index, "", x + 4, y+3, myRight - 32, y+23, "Fonts/Edit.met" )
			local id = Segment.GetId( "attr_enum"..index )
			GUI.SetListText(  id, attribute.enum )
			myEnums[ id ] = attribute
			if myFormat.no_labels == 1 then
				GUI.SetHelpText( id, attribute.label )
			end
		elseif attribute.check ~= nil then
			AddButton( "check_button"..index, x+4, y - constLabelHeight, "check", attribute.label )
			myCheckBoxes[ Segment.GetId( "check_button"..index ) ] = attribute
		elseif attribute.button_enum ~= nil then
			for iButt, button in attribute.button_enum do
				local xButt = x  + 4 + (iButt-1)*32
				AddButton( "button_enum"..index..":"..iButt, xButt, y, button[2], button[3] )
				local id = Segment.GetId( "button_enum"..index..":"..iButt )
				myButtonEnums[  id ] =
					{ attribute, button[1], xButt, y, "enum_highlight"..index, attribute.type}
				myButtonEnums[  id ].state = false
				GUI.SetHelpText( id, button[3]  )
			end
		elseif  attribute.list ~= nil then
			local listRight = myRight - 52
			local hide = GUI.CreateObject( "hide"..index,  myRight - 48, y+3, myRight - 6, y+23, false )
			AddPanelButton( "button"..index, "edit", myRight - 48, y+3, myRight - 6, y+23, hide)
			local id = Segment.GetId( "button"..index )
			GUI.SetParent( parent )
			GUI.SetHelpText( id, "Edit " .. attribute.label .. " list" )
			if attribute.listtype ~= "edit" then
				GUI.Show(hide, false)
				listRight = myRight - 6
			end
			local height = 47
			if attribute.height ~= nil then
				height = attribute.height
			end
			GUI.CreateList( "list"..index, x + 4, y+3, listRight, y+height, "Fonts/Edit.met" )
			local id = Segment.GetId( "list"..index )
			GUI.SetHelpText( id, attribute.label .. " list")
			myLists[ id ] =  attribute
			attribute.listSegment = id
		elseif  attribute.button ~= nil then
			if attribute.height == nil then
				attribute.height = 23
			end
			if attribute.left == nil then
				attribute.left = x+4
			end
			if attribute.right == nil then
				attribute.right = xRight
			end
			local screenWidth, screenHeight = GUI.Area()
			local hide = GUI.CreateObject( "hide"..index,  0, 0, screenWidth, screenHeight, false )
			--GUI.Show(hide, 1)
			AddPanelButton( "button"..index, attribute.button, attribute.left, y+3, attribute.right, y+attribute.height, hide)
			attribute.hide = hide
			local id = Segment.GetId( "button"..index )
			myButtons[ id ] =  attribute
		elseif  attribute.edit ~= nil then
			GUI.CreateTextEdit("edit"..index, attribute.edit, x+4, y+6, myRight - 32, y + 22,  "Fonts/Edit.met" )
			local id = Segment.GetId( "edit"..index )
			myEdits[ id ] =  attribute
		elseif  attribute.red ~= nil then
			GUI.CreateObject("colour_picker"..index,  x, y, x + 128, y + 128, 1 )
			GUI.CreatePicture("colour_pick"..index, "colour_circle_no_bs.png", x, y, x + 128, y + 128 )
			local id = Segment.GetId( "colour_picker"..index )
			myColours[ id ] =  attribute
			myColoursX[ id ] =  x
			myColoursY[ id ] =  y
			myColoursPic[ id ] = Segment.GetId( "colour_pick"..index )
		elseif  attribute.text ~= nil then
			GUI.CreateText("text"..index, attribute.text, x+4, y+6, myRight - 32, y + 22,  "Fonts/Edit.met" )
			local id = Segment.GetId( "text"..index )
			myTexts[ id ] =  attribute
		elseif  attribute.vector ~= nil then
			local x1 = x + ( xRight - x ) / 3
			local x2 = x + 2 * ( xRight - x ) / 3
			AddPanelButton( "x_button"..index, "x", x, y+6, x+16, y+22, parent)
			mySpinnersX[ GUI.CreateObject( "x_spin"..index, x, y+6, x+16, y+22, 1) ] = attribute
			myVectorXs[ GUI.CreateTextEdit("vector_x"..index, "", x+16, y+6, x1, y + 22,  "Fonts/Edit.met" ) ] = attribute
			AddPanelButton( "y_button"..index, "y", x1, y+6, x1+16, y+22, parent)
			mySpinnersY[ GUI.CreateObject( "y_spin"..index, x1, y+6, x1+16, y+22, 1) ] = attribute
			myVectorYs[ GUI.CreateTextEdit("vector_y"..index, "", x1+16, y+6, x2, y + 22,  "Fonts/Edit.met" ) ] = attribute
			AddPanelButton( "z_button"..index, "z", x2, y+6, x2+16, y+22, parent)
			mySpinnersZ[ GUI.CreateObject( "z_spin"..index, x2, y+6, x2+16, y+22, 1) ] = attribute
			myVectorZs[ GUI.CreateTextEdit("vector_z"..index, "", x2+16, y+6, xRight, y + 22,  "Fonts/Edit.met" ) ] = attribute
		elseif  attribute.texturesize ~= nil then
			--attribute.texturesize
			--attribute.filespec
			--attribute.exclude
			--attribute.path
			--attribute.displayedrows
			--attribute.maxphotos
			--attribute.noslider
			CreateTexturePane( x, y, xRight, attribute, index )
			PopulateTexturePane(attribute, index)
		else
			GUI.CreateSlider( "attr_slider"..index, x+4, y+6, myRight - 32, y + 22 )
			local id = Segment.GetId( "attr_slider"..index )
			mySliders[ id ] = attribute
			if myFormat.no_labels == 1 then
				GUI.SetHelpText( id, attribute.label )
			end
		end

		if attribute.icon ~= nil then
			GUI.CreatePicture( "attr_icon"..index, "./UI/Buttons/UI_"..attribute.icon.."_Up.png", 
				myRight - 32, y - 4, myRight, y + 32 - 4)
		end

		tabY[ attribute.tab ] = y + FieldHeight( myParameters, index )
	end
end



function CreateTexturePane( x, y, xRight, attribute, texpane )
	
	attribute.texturecolumns = Number.floor((xRight-x)/attribute.texturesize)

	local bottom = y + attribute.texturesize * attribute.displayedrows
	attribute.displayedrows = Number.floor( (bottom - y) / attribute.texturesize )
--	AddPanel( x,  y, x + 3 * 38, bottom, false, false, false, false,  Segment.texture_button_tab_layer,  Segment.texture_button_tab_layer )

--	GUI.SetParent( Segment.texture_button_tab_layer )
	local window = GUI.CreateObject( "texture_window"..texpane,   x, y, x + attribute.texturecolumns * attribute.texturesize, bottom, false )
	x = x + attribute.texturecolumns * attribute.texturesize + 4
	if attribute.noslider ~= 1 then
		local slider =  GUI.CreateSlider( "texture_slider"..texpane, x, y, x+16, bottom)
		myTextureSliders[slider] = attribute
	end
	GUI.SetParent( window )
	attribute.view = GUI.CreateObject( "texture_view"..texpane,  0, 0, 0, 0, false )
	GUI.SetParent()
	myTextureButtons[texpane] = {}
	myTextureBits[texpane] = {}
end

function PopulateTexturePane(attribute, texpane)
	for index, value in myTextureButtons[texpane] do
		if index ~= "attribute" then
			Segment.Destroy( index )
		end
	end 
	for index, value in myTextureBits[texpane] do
		Segment.Destroy( index )
	end 
	myTextureButtons[texpane] = {}
	myTextureButtons[texpane].attribute = attribute
	myTextureBits[texpane] = {}

	local files = System.GetDirectoryContents( attribute.path,  attribute.filespec, 1)
	local exclude = {}
	if attribute.exclude ~= nil then
		exclude = System.GetDirectoryContents( attribute.path,  attribute.exclude, 1)
	end
	sort( files )
	-- nil excludes after sort cos else sort crashes
	for i,v in files do
		for ii, vv in exclude do
			if v == vv then
				files[i] = nil
				break
			end
		end
	end
	local nfiles = getn( files )
	
	-- resize view pane inside view window to include all images
	attribute.texturerows = Number.floor( (nfiles + (attribute.texturecolumns-0.5))/attribute.texturecolumns )
	GUI.Resize( attribute.view, 0, 0, attribute.texturesize * attribute.texturecolumns, attribute.texturesize * attribute.texturerows )
	GUI.SetParent( attribute.view )

	local ext = String.strsub(attribute.filespec, String.strlen(attribute.filespec)-3, String.strlen(attribute.filespec)) 
		
	for index, value in files do
		local l = Number.mod( (index-1), attribute.texturecolumns ) * attribute.texturesize
		local t = Number.floor( (index-1) / attribute.texturecolumns ) * attribute.texturesize
		local r = l + attribute.texturesize
		local b = t + attribute.texturesize
		if  ext == ".bmp" or ext == ".png" then
			local pic = GUI.CreatePicture( "texture_picture"..texpane.."_"..index, attribute.path.."/"..value, l, t, r, b )
		elseif ext == ".bmi" then
			local table = System.ReadArchiveTable(attribute.path.."/"..value, "")
			local index = GUI.CreatePicture( "texture_picture"..texpane.."_"..index,"", l, t, r, b )
			GUI.SetImageFromString(index, table.image)
		end
		local pic_seg = Segment.GetId( "texture_picture"..texpane.."_"..index )
		myTextureBits[texpane][ pic_seg ] = 1 -- holder to detroy index
		local frame_seg = GUI.CreatePicture( "texture_frame"..texpane.."_"..index, "./UI/"..Config.Get("ui_texture", "UI.png" ), l, t, r, b, 38, 89, 75, 125, 1 )
		myTextureBits[texpane][ frame_seg ] = 1 -- holder to detroy index
		local button_seg = GUI.CreateButton( "texture_button"..texpane.."_"..index, "", l, t, r, b+1 )
		if myFormat.texture_labels ~= nil then
			GUI.SetHelpText( button_seg, value )
		end
		GUI.SetButtonRects( button_seg, 56, 8, 56, 8, 56, 8, 56, 8 )
		myTextureButtons[texpane][ button_seg ] = {}
		myTextureButtons[texpane][ button_seg ].texture = value
		myTextureButtons[texpane][ button_seg ].attribute = attribute
		
		if attribute.maxphotos ~= nil and index == attribute.maxphotos then
			break
		end
	end
	GUI.SetParent()
end



function MessageUpdateAll()
	if myFormat.initalize_all then
		InitializeAll()
	end
	
	for index, value in mySliders do
		local v = GetAttribute( value )
		GUI.SetValue( index,
			(  v - value.min ) / (value.max - value.min ) )
		if value.scale ~= nil then
			v = v * value.scale
		end
		if myFormat.no_labels == 1 then
			GUI.SetHelpText( index, value.label..": "..String.format( "%.2f", v )  )
		else
			GUI.SetHelpText( index, String.format( "%.2f", v )  )
		end
	end
	for index, value in myEnums do
		local text = GetAttribute( value ) 
		if text ~= nil then
			GUI.SetText( index, GetAttribute( value ) )
		end
	end
	for index, value in myButtonEnums do
		UpdateButtonEnum( index, value )
	end
	for index, value in myEdits do
		local text = GetAttribute( value ) 
		if text ~= nil then
			GUI.SetText( index, GetAttribute( value ) )
		end
	end

	for index, value in myVectorXs do
		local v = GetAttribute( value )
		local scale = value.scale
		if scale == nil then scale = 1 end
		GUI.SetText( index, String.format( "%.2f", Vector.GetX( v ) * scale  ))
	end
	for index, value in myVectorYs do
		local v = GetAttribute( value )
		local scale = value.scale
		if scale == nil then scale = 1 end
		GUI.SetText( index, String.format( "%.2f", Vector.GetY( v ) * scale  ))
	end
	for index, value in myVectorZs do
		local v = GetAttribute( value )
		local scale = value.scale
		if scale == nil then scale = 1 end
		GUI.SetText( index, String.format( "%.2f", Vector.GetZ( v ) * scale  ))
	end

	for index, value in myTexts do
		local text = GetAttribute( value ) 
		if text ~= nil then
			GUI.SetText( index, GetAttribute( value ) )
		end
	end
	for index, value in myLists do
		local att = GetAttribute( value ) 
		if type( att ) == "string" then
			GUI.SetText( value.listSegment, att)
		else
			GUI.SetListText( value.listSegment, att)
		end
	end
	for index, value in myCheckBoxes do
		local a = GetAttribute( value )
		if a == nil then a = false end
		GUI.SetButtonPushed( index, a )
	end
	
end

function MessageEnableButton( name, value, enable )
	for segment, button in myButtonEnums do
		if button[1].name == name and button[2] == value then
			GUI.Enable( segment, enable )
		end
	end
end

function MessageUpdateTextures()
	for index, value in myTextureButtons do
		local attr = GetAttribute( value.attribute )
		if attr ~=nil then
			value.attribute.filespec =  attr
		end
		PopulateTexturePane(value.attribute, index)
	end
end

function MessageUpdateTexturePane(pane)
	for index, value in myTextureButtons do
		if value.attribute.name == pane then
			local attr = GetAttribute( value.attribute )
			if attr ~=nil then
				value.attribute.filespec =  attr
			end
			PopulateTexturePane(value.attribute, index)
			break
		end
	end
end

function MessageGetFocus()
	Input.SetFocus()
end

function MessageReleaseFocus()
	Input.ReleaseFocus()
end

function MessageSetEnumList(attribute, list)
	for index, value in myEnums do
		if attribute == value.name then
			GUI.SetListText(  index, list )
			break
		end
	end	
end

function MessageSetEnumText(attribute, text)
	for index, value in myEnums do
		if attribute == value.name then
			GUI.SetText(  index, text )
			break
		end
	end	
end


function MessageSetList(attribute, list)
	for index, value in myLists do
		if attribute == value.name then
			value.default = list
			GUI.SetListText(  value.listSegment, list )
			break
		end
	end	
end

function MessageSetListText(attribute, text)
	for index, value in myLists do
		if attribute == value.name then
			GUI.SetText(  value.listSegment, text )
			break
		end
	end	
end


function UpdateButtonEnum( segment, button )
	local enum = GetAttribute( button[1] ) 
	if enum ~= nil then
		-- radio button
		if enum == button[2] then
			GUI.SetButtonPushed( segment, 1 )
		else
			GUI.SetButtonPushed( segment, false )
		end
	else
		-- any can be on at any time
		local state = Agent.SendMessage( myMessagePrefix.."Get", myNotifyAgent,  button[1].name.."_"..button[2] ) 
		if state == nil then 
			state = false
		end
		GUI.SetButtonPushed( segment, state)
	end
		
end

function GetAttribute(value)
	local n = value.name
	local attr = Agent.SendMessage( myMessagePrefix.."Get", myNotifyAgent, value.name )
	--Trace( "Name %   Value %", value.name, attr )
	if attr == nil then
		attr = value.default
	end
	return attr
end

function Notify( name, value)
	Agent.SendMessage( myMessagePrefix.."Notify", myNotifyAgent, name, value)
end

function NotifyVectorX( name, value)
	Agent.SendMessage( myMessagePrefix.."NotifyVectorX", myNotifyAgent, name, value)
end

function NotifyVectorY( name, value)
	Agent.SendMessage( myMessagePrefix.."NotifyVectorY", myNotifyAgent, name, value)
end

function NotifyVectorZ( name, value)
	Agent.SendMessage( myMessagePrefix.."NotifyVectorZ", myNotifyAgent, name, value)
end

function NotifySlide( name, value)
	Agent.SendMessage( myMessagePrefix.."NotifySlide", myNotifyAgent, name, value)
end

function InitializeAll()
	if DefaultsInitialized == false then
		DefaultsInitialized = 1
		
		for index, value in mySliders do
			SetDefault( value )
		end
		for index, value in myEnums do
			SetDefault( value )
		end
		for index, value in myButtonEnums do
			SetDefault( value[1] )
		end
		for index, value in myEdits do
			SetDefault( value )
		end
		for index, value in myVectorXs do
			SetDefault( value )
		end
		for index, value in myVectorYs do
			SetDefault( value )
		end
		for index, value in myVectorZs do
			SetDefault( value )
		end
	
		for index, value in myTexts do
			SetDefault( value )
		end
		for index, value in myLists do
			if value.listtype == "edit" then
				SetDefault( value )
			end
		end
		for index, value in myCheckBoxes do
			SetDefault( value )
		end
	end
end

function SetDefault(value)
	local n = value.name
	local attr = Agent.SendMessage( myMessagePrefix.."Get", myNotifyAgent, value.name ) 
	if attr == nil then
		attr = value.default
		if attr ~= nil then
			Notify( value.name, attr )
		end
	end
end



function FieldHeight( parameters, index )
	if parameters[index].list ~= nil then
		if parameters[index].height ~= nil then
			return parameters[index].height+1
		else
			return 48
		end
	elseif parameters[index].button_enum ~= nil then
		return 32
	elseif parameters[index].check ~= nil then
		return 4
	elseif parameters[index].red ~= nil then
		return 128
	elseif parameters[index].texturesize ~= nil then
		local attribute = parameters[index]
		return attribute.texturesize * attribute.displayedrows
	elseif  parameters[index].button ~= nil then
		local attribute = parameters[index]
		if attribute.height == nil then
			return 24
		else
			return attribute.height+1 
		end
	else
		return 24
	end
end

function MessageUIForward( segment)
	SystemUIChange( segment )
end

function MakeGoodNumber( textIn )
	local textOut = ""
	local decFound = false
	for i = 1, String.strlen( textIn ) do
		local c = String.strsub( textIn, i, i )
		if String.strlen( textOut ) == 0 and c == "-" then
			textOut = textOut.."-"
		elseif not decFound and c == "." then
			decFound = 1
			textOut = textOut.."."
		elseif String.strfind( "0123456789", c, 1, 1 ) ~= nil then
			textOut = textOut..c
		end
	end
	return textOut
end

function TruncateNumber( text )
	Trace( "text 1 %", text )
	text = MakeGoodNumber( text )
	Trace( "text 2 %", text )
	local decimal = String.strfind( text, ".", 1, 1 )
	if decimal ~= nil then
		if String.strlen( text ) > decimal + 2 then
			text = String.strsub( text, 1, decimal + 2 )
		end
	end
	Trace( "text 3 %", text )
	return tonumber( text )
end

function SystemUIChange( segment )
	local modified  = false
	local doUpdate = 1
	local attr = mySliders[ segment ]
	if attr ~= nil then
		local v = GUI.GetValue( segment ) * ( attr.max - attr.min ) + attr.min  
		NotifySlide( attr.name, v )
		doUpdate = false
		if attr.scale ~= nil then
			v = v * attr.scale
		end
		if myFormat.no_labels == 1 then
			GUI.SetHelpText( segment, attr.label..": "..String.format( "%.2f", v )  )
		else
			GUI.SetHelpText( segment, String.format( "%.2f", v )  )
		end
	end
	local attr = myEnums[ segment ]
	if attr ~= nil then
		Sound.Play( "Sounds/Click.wav" )
		Notify( attr.name, GUI.GetText( segment )  )
	end
	local attr_button = myButtonEnums[ segment ]
	if attr_button ~= nil then
		Sound.Play( "Sounds/Click.wav" )
		local edit = false
		local attr = attr_button[1]
		if myButtonEnums[ segment ][ 6 ] ~= "sticky" or myButtonEnums[ segment ].state == false then
			Notify( attr.name, attr_button[2]  )
			if myButtonEnums[ segment ].state == false then
				myButtonEnums[ segment ].state = 1
			else
				myButtonEnums[ segment ].state = false
			end
		end
		
		for i, button in myButtonEnums do
			local name = button[1].name
			if button[1].name == attr.name then
				UpdateButtonEnum( i, button )
			end
		end
	end
	local edit = myEdits[ segment ]
	if edit ~= nil then
		Notify( edit.name, GUI.GetText( segment )  )
	end
	
	local xEdit = myVectorXs[ segment ]
	if xEdit ~= nil then
		local x, y, z = Vector.GetXYZ( GetAttribute( xEdit ) )
		x = TruncateNumber( GUI.GetText( segment ) )
		if xEdit.scale ~= nil then x = x / xEdit.scale end
		if x ~= nil then
			--Notify( xEdit.name, Vector.New( x, y, z ) )
			NotifyVectorX( xEdit.name, x )
		end
	end
	local yEdit = myVectorYs[ segment ]
	if yEdit ~= nil then
		local x, y, z = Vector.GetXYZ( GetAttribute( yEdit ) )
		y = TruncateNumber( GUI.GetText( segment ) )
		if yEdit.scale ~= nil then y = y / yEdit.scale end
		if y ~= nil then
			--Notify( yEdit.name, Vector.New( x, y, z ) )
			NotifyVectorY( yEdit.name, y )
		end
	end
	local zEdit = myVectorZs[ segment ]
	if zEdit ~= nil then
		local x, y, z = Vector.GetXYZ( GetAttribute( zEdit ) )
		z = TruncateNumber( GUI.GetText( segment ) )
		if zEdit.scale ~= nil then z = z / zEdit.scale end
		if z ~= nil then
			--Notify( zEdit.name, Vector.New( x, y, z ) )
			NotifyVectorZ( zEdit.name, z )
		end
	end

	local list = myLists[ segment ]
	if list ~= nil then
		if list.listtype == "edit" then
			myListSelection = segment
			Agent.Create("MultiPickList", Agent.Me(), list.label, list.list, GetAttribute(list) )
		else
			if list.report_index ~= nil then
				Notify( list.name, GUI.GetListSelection( segment ) )
			else
				Notify( list.name, GUI.GetListSelectedText(list.listSegment) )
			end
		end
	end
	
	local button = myButtons[ segment ]
	if button ~= nil then
		Sound.Play( "Sounds/Click.wav" )
		Notify( button.name, "" )
	end

	local check = myCheckBoxes[ segment ]
	if check ~= nil then
		local a = GetAttribute( check )
		if a == nil then a = false end
		Notify( check.name, not a )
		GUI.SetButtonPushed( segment, GetAttribute( check ) )
	end

	for index, tab in myTabs do
		if segment == Segment.GetId( tab.."_tab_button" ) then
			Sound.Play( "Sounds/Toggle.wav" )
			MessageShowTab( tab )
		end
	end
	
	local slider = myTextureSliders[ segment ]
	if slider ~= nil then
		local extra = (slider.texturerows - slider.displayedrows)*slider.texturesize
		if extra > 0 then
			GUI.Resize( slider.view, 0, -GUI.GetValue( segment ) * extra, 
			slider.texturesize * slider.texturecolumns, slider.texturesize * slider.texturerows - GUI.GetValue( segment ) * extra ) 
		end
	end
	
	for index, value in myTextureButtons do
		local texture = value[segment]
		if texture ~= nil then
			Notify( texture.attribute.name, texture.texture )
		end
	end

	if doUpdate	 then
		MessageUpdateAll() -- edited field may effect others
	end
end

function MessageShowTab( newTab )
	local good = false
	for index, tab in myTabs do
		if tab == newTab then good = 1 end
	end
	if good then
		for index, tab in myTabs do
			GUI.Show( Segment.GetId( tab.."_tab_layer" ), tab ==  newTab )
		end
		Agent.SendMessage( myMessagePrefix.."TabChange", myNotifyAgent, newTab )
	end
end

function SystemUIMouseLDown(segment)
	local colour = myColours[ segment ]
	if colour ~= nil then
		local x, y = Input.MousePosition()
		local r, g, b, a = GUI.GetPixel( myColoursPic[ segment ], x - myColoursX[ segment ], y - myColoursY[ segment ] )
		if a > 0.5 then
			Notify( colour.red, r )
			Notify( colour.green, g )
			Notify( colour.blue, b )
		end
	end
	if mySpinnersX[ segment ] ~= nil then
		myActiveSpinner = mySpinnersX[ segment ]
		mySpinOrd = 1
	end
	if mySpinnersY[ segment ] ~= nil then
		myActiveSpinner = mySpinnersY[ segment ]
		mySpinOrd = 2
	end
	if mySpinnersZ[ segment ] ~= nil then
		myActiveSpinner = mySpinnersZ[ segment ]
		mySpinOrd = 3
	end
end

function SystemUIMouseLUp(segment)
	myActiveSpinner = false
	local attr = mySliders[ segment ]
	if attr ~= nil then
		local v = GUI.GetValue( segment ) * ( attr.max - attr.min ) + attr.min  
		Notify( attr.name, v )
	end
end

function SystemMouse( xMouse, yMouse, wheel )
	if myActiveSpinner then
		local x, y, z = Vector.GetXYZ( GetAttribute( myActiveSpinner ) )
		local change = (xMouse - yMouse) * myActiveSpinner.vector
		if mySpinOrd == 1 then
			NotifyVectorX( myActiveSpinner.name, x + change )
		elseif mySpinOrd == 2 then
			NotifyVectorY( myActiveSpinner.name, y + change )
		elseif mySpinOrd == 3 then
			NotifyVectorZ( myActiveSpinner.name, z + change )
		end
		MessageUpdateAll()
	end
end

function SystemUIMouseRDown(segment)
	local attr = mySliders[ segment ]
	if attr ~= nil then
		local x, y = Input.MousePosition()
		local v  = GetAttribute( attr )
		if attr.scale ~= nil then
			v = v * attr.scale
		end
		
		Agent.Create( "PopUpEdit", x, y, String.format( "%.2f", v ), Agent.Me() )
		myPopUpAttribute = attr
	end
end

function MessagePopUpEditFinished( agent, text )
	local value = tonumber( text )
	if value ~= nil then
		if myPopUpAttribute.scale ~= nil then
			value = value / myPopUpAttribute.scale
		end
		if value < myPopUpAttribute.min then
			value = myPopUpAttribute.min
		end
		if value > myPopUpAttribute.max then
			value = myPopUpAttribute.max
		end
		Notify( myPopUpAttribute.name, value )
		MessageUpdateAll()
	end
end

function MessageMultiPickListOK(newlist)
	local list = myLists[ myListSelection ]
	Notify( list.name, newlist )
	GUI.SetListText( list.listSegment, GetAttribute(list) )
end	

function MessageTable()
	for index, value in myParameters do
		myTable[ value.name ] = tonumber( GUI.GetText( Segment.GetId( "text"..index ) ) )
	end
	return myTable
end

function MessageShow( show )
	GUI.Show( Segment.parent, show )
	for i,v in myButtons do
		GUI.Show(v.hide, show)
	end
end

function MessageSetTable( table )
	myTable = table
	for index, value in myParameters do
		GUI.SetText( Segment.GetId( "text"..index ), tostring( myTable[ value.name ] ) )
	end
end


function MessageDestroy()
	Agent.Destroy()
end

