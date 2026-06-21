# ZookList specializes UIAgent embeds XML

function Initialize( team )
	
	myTeam = team
	
	if myTeam == "myZooks" then
		theTeams = Config.Get("default_teams_directory", ".") 
	else
		-- examples
		theTeams = System.GetLabeledPath("ROOT").."/Teams/"
	end
	
	local width, height = GUI.Area()
	GUI.CreateObject( "progress_parent", 0, 0, width, height )
	local w, h = 200, 60
	local left, top, right, bottom = width/2 - w, height/2 - h, width/2 + w, height/2 + h
	AddPanel( left, top, right, bottom, 1, 1, 1, 1, Segment.progress_parent, Segment.progress_parent )
	GUI.SetParent( Segment.progress_parent )
	GUI.CreateText( "label", "", left + 32, top + 20, left + 60, top + 20, "Fonts/Edit.met" )
	GUI.SetParent()
	GUI.Show( Segment.progress_parent, false )
end


function GetDiskZooks()
	local creatures = {}
	if myTeam ~= nil and myTeam ~= "" then
		creatures = System.GetDirectoryContents( theTeams..myTeam.."/Creatures",  "*.*", 2)
		RemoveCVS( creatures )
	end
	
	-- remove counter AND HARD SAVE FILES (this occurs when zooklist and selector replace the older team selector)
	for i, v in creatures do
		local hardsave = theTeams..myTeam.."/Creatures/"..v.."/hardsaved.tab"
		if System.IsValidPath(hardsave) then
			System.DeleteFile(hardsave)
		end
		if tonumber(i) == nul then
			creatures[i] = nil
		end
	end
	return creatures
end

function GenerateZookList()
	
	local creatures = GetDiskZooks()

	local zook_list = {}
	zook_list.children = {}
	zook_list.element_type = "zook_list"
	if myPassport == nil then 	
		myPassport = Agent.Create("ZookPassport", 0, 0, false )
	end
	GUI.ToFront( Segment.progress_parent )
	GUI.Show( Segment.progress_parent, 1 )
	for i,name in creatures do
		GUI.SetText( Segment.label, "Scanning zook: "..name )
		GUI.Refresh()
		local details, version = Agent.SendMessage("GetDetails", myPassport, myTeam, name)
		local zook = AddChild(zook_list, "zook")
		zook.name = name
		zook.version = tostring(version)
		AppendChild(zook, details)		
	end
	GUI.Show( Segment.progress_parent, false )
	return zook_list
end


function MessageModifyEntry(name)
	if myPassport == nil then 	
		myPassport = Agent.Create("ZookPassport", 0, 0, false )
	end
	
	local zook_list
	--local file = theTeams..myTeam.."/zook_list.xml"
	local file = theTeams..myTeam.."/zook_list.tab"
	if System.IsValidPath(file) then
		--zook_list = XML.LoadDirectToTable(file, "")
		zook_list = System.ReadTable(file)
		for i,zook in zook_list.children do
			if zook.name == name then
				local details, version = Agent.SendMessage("GetDetails", myPassport, myTeam, name)
				zook.version = tostring(version)
				zook.children[ 1 ] = details	
				--XML.SaveDirectFromTable(file, zook_list)
				System.WriteTable(file, zook_list)
				return
			end
		end
		-- dont exist so add new entry
		local details, version = Agent.SendMessage("GetDetails", myPassport, myTeam, name)
		local zook = AddChild(zook_list, "zook")
		zook.name = name
		zook.version = tostring(version)
		AppendChild(zook, details)	
		System.WriteTable(file, zook_list)
		--XML.SaveDirectFromTable(file, zook_list)
	end
end

function MessageRemoveEntry(name)
	local zook_list
	--local file = theTeams..myTeam.."/zook_list.xml"
	local file = theTeams..myTeam.."/zook_list.tab"
	Trace( "Removing entry" )
	if System.IsValidPath(file) then
		--zook_list = XML.LoadDirectToTable(file, "")
		zook_list = System.ReadTable(file)
		for i,zook in zook_list.children do
			if zook.name == name then
				--~ Trace( "About to remove entry" )
				tremove( zook_list.children, i )
				zook_list.children.n = nil
				--XML.SaveDirectFromTable(file, zook_list)
				System.WriteTable(file, zook_list)
				return
			end
		end
	end
end

function Exists( table, element )
	for i, item in table do
		if item.name == element then
			return 1
		end
	end
	return false
end

function CompareZookList(zook_list)
	local creatures = GetDiskZooks()
	if getn( creatures ) ~= getn( zook_list.children ) then
		return false
	end
	for i,name in creatures do
		if not Exists( zook_list.children, name ) then
			return false
		end
	end
	return 1
end

function LoadZookList()
	local zook_list = nil
	--local file = theTeams..myTeam.."/zook_list.xml"
	local file = theTeams..myTeam.."/zook_list.tab"
	if System.IsValidPath(file) then
		--zook_list = XML.LoadDirectToTable(file, "")
		zook_list = System.ReadTable(file)
		if not CompareZookList(zook_list) then
			zook_list = nil
		end
	end

	if zook_list == nil then
		zook_list = GenerateZookList()
		System.WriteTable(file, zook_list)
	end
	return zook_list
end


function RemoveCVS(list)
	for index, value in list do
		if String.strlower( value ) == "cvs" then
			tremove( list, index )
			return
		end
	end
end


function MessageDestroy()
	if myPassport ~= nil then
		Agent.SendMessage( "Destroy", myPassport )
	end
	Agent.Destroy()
end



-- SUPPORT FUNCTIONS -----------------------------------------------------------------------------------------------------------------------------

function AddChild( node, element_type )
	local nextChild = getn( node.children ) + 1
	return NewNode(node, nextChild , element_type)
end


function NewNode(parent, index, element_type)
	parent.children[ index ] = {}
	parent.children[ index ] .children = {}
	parent.children[ index ] .element_type = element_type
	return parent.children[ index ] 
end
	
function AppendChild(parent, node)
	local nextChild = getn( parent.children ) + 1
	parent.children[ nextChild ]  = node
	return parent.children[ nextChild ]
end
	