# ToolTips specializes UIAgent embeds Input

constLabelHeight = 15

function Initialize()
	GUI.SetParent()
	GUI.CreatePicture( "help_shad", "white.bmp", 0,0,0,0 )
	GUI.CreatePicture( "help_out", "white.bmp", 0,0,0,0 )
	GUI.CreatePicture( "help_back", "white.bmp", 0,0,0,0 )
	GUI.CreateText( "help_text", "", 0,0,0,0, "Fonts/Edit.met" )
	GUI.SetColour( Segment.help_shad, 0,0,0, 0.5 )
	GUI.SetColour( Segment.help_out, 0,0,0, 1 )
	GUI.SetColour( Segment.help_back, 1,1,0.75, 1 )
	GUI.SetColour( Segment.help_text, 0, 0, 0, 1 )
	Agent.SetTimer( "UpdateHelp",  Agent.Me(), "update", .10)
end

function TimerUpdateHelp()
	--Trace( "Tooltip %", GUI.GetTooltipString() )
	local toolText =GUI.GetTooltipString()
	if toolText ~= myToolText then
		if toolText ~= "" then
			GUI.SetText( Segment.help_text, toolText )
			GUI.ToFront( Segment.help_shad )
			GUI.ToFront( Segment.help_out )
			GUI.ToFront( Segment.help_back )
			GUI.ToFront( Segment.help_text )
			local width, height = GUI.MeasureText( toolText, "Fonts/Edit.met" )
			local x, y = Input.MousePosition()
			local screenWidth, screenHeight = GUI.Area()
			x = x - 16
			y = y + 24
			if x + width > screenWidth then
				x = screenWidth - width
			end
			if x < 0 then x = 0 end
			if y  + height > screenHeight then
				y = screenHeight - height - 24
			end
			if y < 0 then y = 0 end
			local shad_off = 4
			GUI.Resize( Segment.help_back, x-2, y-2, x+width+2, y+height+2 )
			GUI.Resize( Segment.help_shad, x-3+shad_off-1, y-3+shad_off-1, x+width+3+shad_off, y+height+3+shad_off )
			GUI.Resize( Segment.help_out, x-3, y-3, x+width+3, y+height+3 )
			GUI.Resize( Segment.help_text, x, y, x+width, y+height )
		end
		GUI.Show( Segment.help_shad, toolText ~= "")
		GUI.Show( Segment.help_back, toolText ~= "" )
		GUI.Show( Segment.help_out, toolText ~= "")
		GUI.Show( Segment.help_text, toolText ~= "" )
		 myToolText = toolText
	end 
end

function MessageDestroy()
	Agent.Destroy()
end

