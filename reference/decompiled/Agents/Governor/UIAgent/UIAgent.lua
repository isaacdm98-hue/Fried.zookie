# UIAgent specializes Agent embeds Input, Camera, GUI
myLastAnon = 0

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
	GUI.CreateBorder( AnySegment(), left - margin, top - margin, right + margin, bottom + margin, 129, 1, 199, 71, 1 )
end


function AddPanel( left, top, right, bottom, tlRound, trRound, blRound, brRound, glowLayer, panelLayer )
	if glowLayer ~= nil then
		GUI.SetParent( glowLayer )
	end
	AddPanelGlow( left, top, right, bottom )
	if  panelLayer ~= nil then
		GUI.SetParent( panelLayer )
	end
	GUI.CreateObject( AnySegment(), left, top, right, bottom )
	local size = 12
	if (bottom-top)/2 <12 then size = (bottom-top)/2 end
	local texture = "./UI/"..Config.Get("ui_texture", "UI.png" )
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
	GUI.CreateButtonEx( name, x, y, x2, y2, iconRoot.."_Up.png", iconRoot.."_Dn.png", iconRoot.."_Ov.png" )
	local width, height = GUI.MeasureText( label, "Fonts/Edit.met"  )
	GUI.CreateText(AnySegment(), label, (x + x2 - width)/2, (y+y2 - height)/2, x+16, y, "Fonts/Edit.met" )
	GUI.SetColour( LastSegment(), 0, 0, 0, 1 )
	return Segment.GetId( name )
end

function AddButton( name, x, y, iconRoot, helpText )
	iconRoot = "UI\\Buttons\\UI_"..iconRoot
	--GUI.CreateButtonEx( name, x, y, x + 32, y + 32, iconRoot.."_Up", iconRoot.."_Dn", iconRoot.."_Ov" )
	GUI.CreateButtonEx( name, x, y, x + 32, y + 32, iconRoot.."_Up.png", iconRoot.."_Ov.png", iconRoot.."_Dn.png" )
	GUI.SetHelpText( Segment.GetId( name ), helpText )
end

function AddTabButtons( left, top, right, bottom, names, labels, layer )
	GUI.SetParent( layer )
	--AddPanelGlow( left, top, right, bottom )
	local count = getn( names )
	local x = left
	local width = (right - left)/count
	for index, value in names do
		GUI.CreateBorder( value.."_tab_back",  x, top, x+width,  top+17, 24, 64, 48, 64+17, false )
		GUI.SetColour(Segment.GetId(value.."_tab_back"), PanelColour() )
		local iconRoot = "UI\\Buttons\\UI_Blank"
		GUI.CreateButtonEx( value.."_tab_button", x, top, x + width, top+17, iconRoot.."_Up.png", iconRoot.."_Dn.png", iconRoot.."_Ov.png" )
		local fwidth, fheight = GUI.MeasureText( labels[index], "Fonts/Edit.met"  )
		GUI.CreateText(AnySegment(), labels[index], x + (width-fwidth)/2, top+2, x+16, top, "Fonts/Edit.met" )
		GUI.SetColour( LastSegment(), .5, .5, .5, 1 )
		x = x + width
	end
	AddPanel( left, top+16, right, bottom, false, false, false, false, layer, layer )
	GUI.SetParent( layer )
	local x = left
	local swidth, sheight = GUI.Area()
	for index, value in names do
		GUI.CreateObject( value.."_tab_layer",  1, 0, swidth, sheight, false )
		GUI.SetParent( Segment.GetId( value.."_tab_layer" ) )
		GUI.CreateBorder( AnySegment(),  x, top, x+width,  top+18, 24, 64, 48, 64+17, false )
		GUI.SetColour( LastSegment(), PanelColour() )
		local fwidth, fheight = GUI.MeasureText( labels[index], "Fonts/Edit.met"  )
		GUI.CreateText( AnySegment(), labels[index], x + (width-fwidth)/2, top+2, 10,top, "Fonts/Edit.met" )
		GUI.SetColour( LastSegment(), 0, 0, 0, 1 )
		x = x + width
		GUI.SetParent( layer )
		GUI.Show( Segment.GetId( value.."_tab_layer" ), false )

	end
	GUI.Show( Segment.GetId( names[1].."_tab_layer" ), 1 )
	GUI.SetParent()
end


