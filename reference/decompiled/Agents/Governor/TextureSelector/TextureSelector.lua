# TextureSelector specializes Agent embeds Input, GUI

function Initialize(notifyAgent, directory, left, top, right, bottom )
	myNotifyAgent = notifyAgent
	myFiles = System.GetDirectoryContents( directory,  "*.png", 1)
	myButtons = {}
	sort( myFiles )

	GUI.CreatePicture( "loadpanel", "./UI/Grey", left, top, right, bottom)
	left = left + 8
	top = top + 8
	right = right - 8
	bottom = bottom -8
	local width = right - left
	local height = bottom - top
	local nRow = Number.floor( Number.sqrt( getn( myFiles )+1 ) + 0.9 )
	for index, value in myFiles do
		local texture = String.gsub( value, ".png", "" )
		local l = left + Number.mod( (index-1) , nRow ) * width / nRow
		local t = top + Number.floor( (index-1) / nRow ) * width / nRow
		local r = l + width / nRow
		local b = t + width / nRow
		GUI.CreateButton( "button"..index, " ", l, t, r, b )
		myButtons[ Segment.GetId("button"..index) ] = index
		GUI.CreatePicture( "texture"..index, "./"..directory.."/"..texture, l, t, r, b )
	end
	local l = left + Number.mod( getn( myFiles ) , nRow ) * width / nRow
	local t = top + Number.floor( getn( myFiles ) / nRow ) * width / nRow
	local r = l + width / nRow
	local b = t + width / nRow
	GUI.CreateButton( "close", "Close", l, t, r, b )
		
end

function SystemUIChange( segment )
	if myButtons[ segment ] ~= nil then
		local texture = String.gsub( myFiles[myButtons[ segment ]] , ".png", "" )
		Agent.SendMessage( "SetTexture", myNotifyAgent, texture )
	end
	Agent.Destroy()
end
