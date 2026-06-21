# ZookSelector specializes ZookList embeds Visual

TEMP_CREATURE = "tempZookSelector.zook"
--~ TEST_LOCAL_ONLINECONFIG = 1
--~ TEST_LOCAL_ZOOKHERDER = 1
TEST_LOCAL_ONLINECONFIG = false
TEST_LOCAL_ZOOKHERDER = false

function Initialize( team, creature, notifyAgent, allowNew, allowCancel, allowImport, allowInternet, destroyOnSelect, selectTeams )

	allowInternet = 1
	
	myNotifyAgent = notifyAgent
	mySelectTeams = selectTeams
	myDestroyOnSelect = destroyOnSelect

	mySelectTeams = false

	myDownloadTeam = false
	myShowPassportDownload = false
		

	local screenWidth, screenHeight = GUI.Area()
	local width = 780
	local height = 500
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	local x = left
	local xRight = x + 320
	local y = top + 16
	local xLeft = x + 16
	local sortStart =  ((xRight - xLeft)-12)/3

	GUI.CreateObject( "modal", 0, 0, screenWidth, screenHeight, 1 )
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, Segment.modal,Segment.modal)
	GUI.SetParent(Segment.modal)
	
	if mySelectTeams == 1 then
		-- allow team selection
		GUI.CreateText("team_label", "Team", x + 16, y + 3, x+16, y, "Fonts/Edit.met" )
		GUI.SetColour( Segment.team_label, 0, 0, 0, 1 )
		if allowNew then
			AddPanelButton( "new_team", "New", xRight - 64 , y, xRight, y+24 )
		end
	
		y = y + 30
		GUI.CreateCombo( "team_list", "", x + 16, y, xRight,y + 20 ,  "Fonts/Edit.met" )
		y = y + 26
	else
		local buttonWidth = (xRight - xLeft)/2
		if allowInternet == 1 then
			buttonWidth = ((xRight - xLeft)-12)/3
			AddPanelButton( "internet", "Website Zooks", xLeft+(buttonWidth+12)+(buttonWidth+12) , y, xLeft+(buttonWidth+12)+(buttonWidth+12)+(buttonWidth), y+24,Segment.modal )
		end
		AddPanelButton( "myzooks", "My Zooks", xLeft , y, xLeft+(buttonWidth-12), y+24, Segment.modal )
		AddPanelButton( "examples", "Examples", xLeft+(buttonWidth+12) , y, xLeft+(buttonWidth+12)+(buttonWidth-12), y+24, Segment.modal )
		y = y + 40
	end

	GUI.CreateText("creature_categorylabel", "List", xLeft+(sortStart+12), y + 3, xLeft+(sortStart+12), y, "Fonts/Edit.met" )
	GUI.SetColour( Segment.creature_categorylabel, 0, 0, 0, 1 )
	GUI.CreateCombo( "category_combo", "", xLeft+(sortStart+12)+30, y+3, xRight, y+23,  "Fonts/Editsmall.met")
	GUI.Show( Segment.creature_categorylabel, false )
	GUI.Show( Segment.category_combo, false )

	y = y + 30
	GUI.CreateText("creature_label", "Zook", x + 16, y + 3, x+16, y, "Fonts/Edit.met" )
	GUI.SetColour( Segment.creature_label, 0, 0, 0, 1 )
	GUI.CreateText("creature_sortlabel", "Sort", xLeft+(sortStart+12), y + 3, xLeft+(sortStart+12), y, "Fonts/Edit.met" )
	GUI.SetColour( Segment.creature_sortlabel, 0, 0, 0, 1 )
	GUI.CreateCombo( "sort_combo", "", xLeft+(sortStart+12)+30, y+3, xRight, y+23,  "Fonts/Editsmall.met")


	y = y + 30
	GUI.SetParent(Segment.modal)
	GUI.CreateList("creature_list",  x + 16, y, xRight, bottom - 40 ,  "Fonts/Editsmall.met")
	GUI.SetTabStops( Segment.creature_list, { (sortStart+12)+100} )
	y = y + 30

	AddButton("check_button", x + 16, bottom - 32, "check", "Download and display Zook Passorts for Zooks on the Internet" )
	GUI.CreateText("check_button_label", "View internet passports", x + 40,  bottom - 32, x+16,  bottom - 32+23, "Fonts/Edit.met" )

	local buttonAlign = 0
	local buttonWidth = 70
	local buttonLeft = xRight+16
	if allowNew then
		AddPanelButton( "new_creature", "New", buttonLeft, bottom - 32, buttonLeft + buttonWidth, bottom - 8, Segment.modal)
		buttonLeft = buttonLeft+buttonWidth+16
	end	
	if allowImport then
		AddPanelButton( "import_button", "Desktop", buttonLeft, bottom - 32, buttonLeft + buttonWidth, bottom - 8, Segment.modal )
		buttonLeft = buttonLeft +buttonWidth+16
	end
	AddPanelButton( "load_button", "Open", buttonLeft, bottom - 32, buttonLeft + buttonWidth, bottom - 8, Segment.modal )
	buttonLeft = buttonLeft +buttonWidth+16
	AddPanelButton( "delete_button", "Delete", buttonLeft, bottom - 32, buttonLeft + buttonWidth, bottom - 8, Segment.modal )

	if allowCancel then 
		buttonLeft = buttonLeft +buttonWidth+16
		AddPanelButton( "cancel_button", "Cancel", buttonLeft, bottom - 32, buttonLeft + buttonWidth, bottom - 8, Segment.modal )
	end	

	if myTeam == nil then
		local path = Config.Get("product_directory", ".")
		local lastLoaded = System.ReadTable(path .. "/TeamSelection.dat")
		myTeam = lastLoaded.team
		myCreature = lastLoaded.creature
	end
	
	local marg = 16
	local passWidth = ((right - marg)-(xRight + marg))
	myPassport = Agent.Create("ZookPassport", (xRight + marg)+(passWidth/2), passWidth, false )
	
	MessageLoad( team, creature)
end

function MessageSetTemporaryName(name)
	TEMP_CREATURE = name
end

function Finalize()
	Agent.SendMessage("Destroy", myPassport)
	if Agent.IsValid(myZookHerder) == 1 then
		Agent.SendMessage("Destroy", myZookHerder)
	end
end


function MessageDestroy()
	Agent.Destroy()
end


function MessageLoad( team, creature)
	myTeam = team
	myCreature = creature
	InitSelection()
	ShowPassport()
end


function MessageShow(s)
	GUI.Show(Segment.modal, s)
	Agent.SendMessage("Show", myPassport, s)
	if s then
		ShowPassport()
	end
end


function InitSelection()
	
	if myDownloadTeam == false then
		
		GUI.Show( Segment.creature_categorylabel, false )
		GUI.Show( Segment.category_combo, false )

		if mySelectTeams == 1 then
			
			theTeams = System.GetLabeledPath("ROOT").."/Teams/"
			PopulateTeamList()
	
		else
			if myTeam == nil then
				myTeam = "myZooks"
			end
	
			if myTeam == "myZooks" then
				theTeams = Config.Get("default_teams_directory", "") 
				GUI.SetButtonPushed(Segment.myzooks, 1)
				GUI.SetButtonPushed(Segment.examples, false)
				GUI.SetButtonPushed(Segment.internet, false)
			else
				-- examples
				theTeams = System.GetLabeledPath("ROOT").."/Teams/"
				GUI.SetButtonPushed(Segment.myzooks, false)
				GUI.SetButtonPushed(Segment.examples, 1)
				GUI.SetButtonPushed(Segment.internet, false)
			end
		end
		
		Config.Set("current_teams_directory", theTeams)
		LoadCreatureDetails()
		SortBy(mySort)
	else
		GUI.Show( Segment.creature_categorylabel, 1 )
		GUI.Show( Segment.category_combo, 1 )
	
		DownloadListCategories()
		GUI.SetButtonPushed(Segment.myzooks, false)
		GUI.SetButtonPushed(Segment.examples, false)
		GUI.SetButtonPushed(Segment.internet, 1)
	end
end



-- TEAM LIST ------------------------------------------------------------------------------------------------------

function PopulateTeamList()
	local teams = System.GetDirectoryContents( theTeams,  "*.*", 2)
	RemoveCVS( teams )
	sort( teams )
	GUI.SetListText( Segment.team_list, teams )
	if not ListContainsItem( teams, myTeam ) then
		if getn( teams ) > 0 then
			myTeam = teams[1]
		end
	end
	if myTeam ~= nil then
		GUI.SetText( Segment.team_list, myTeam )
	end
end


function ListContainsItem( list, item )
	for index, value in list do
		if value == item then
			return 1
		end
	end
	return false
end


-- CREATURE LIST -------------------------------------------------------------------------------------------------

function MessageSetListCategories(categories)
		
	myZookListCategories = categories
	
	local names = {}
	local sorts = {}
	for i,v in myZookListCategories.children do
		names[getn(names)+1] = v.name
	end
	
	GUI.SetListText( Segment.category_combo, names )	
	GUI.SetText( Segment.category_combo, names[1] )
	SystemUIChange(Segment.category_combo)
	
end


function SortBy(s)
	mySort = s
	if mySort == nil then
		mySort = "Name"
	end
	GUI.SetText( Segment.sort_combo, mySort )
	PopulateCreatureList()
end


function Less( l, r )
	local ln = tonumber( l[mySort] )
	local rn = tonumber( r[mySort] ) 
	if ln ~= nil and rn ~= nil then
		return ln < rn
	elseif ln == nil and rn == nil then
		return l.name < r.name
	elseif ln == nil and rn ~= nil then
		return false
	elseif ln ~= nil and rn == nil then
		return 1
	end
end
function More( l, r )
	local ln = tonumber( l[mySort] )
	local rn = tonumber( r[mySort] ) 
	if ln ~= nil and rn ~= nil then
		return ln > rn
	elseif ln == nil and rn == nil then
		return l.name > r.name
	elseif ln == nil and rn ~= nil then
		return 1
	elseif ln ~= nil and rn == nil then
		return false
	end
end


function PopulateCreatureList()
	
	-- Far from ideal; need to have sort order decided by list contents
	if mySort == "Name" then
		sort( myCreatureDetails, Less )
	else
		sort( myCreatureDetails, More )
	end
	
	-- Build 'creatures' list of sorted Zooks
	local sortComment = mySort.."_comment"
	local creatures = {}
	for i,v in myCreatureDetails do
		local idstring = "";
		if v.dbid ~= nil then
			-- These Zooks are from the Zook Database as they have DB IDs.
			-- We need to have these displayed to distinguish between like-named Zooks
			idstring = String.format(" [%d]", v.dbid);
		end
		if mySort == "Name" or v[mySort]  == nil then
			creatures[i] = v.name .. idstring 
		else
			creatures[i] = v.name .. idstring .. " \t" .. v[mySort] .. " " .. v[sortComment]
		end
	end
		
	GUI.SetListText( Segment.creature_list, creatures )
	
	if not ListContainsItem( creatures, myCreature ) then
		if getn(  creatures ) > 0 then
			-- Preselect the first Zook if the last Zook name is not on this list
			mySelected = 1
			myCreature = myCreatureDetails[1].name
			myCreatureDBID = myCreatureDetails[1].dbid
		else
			-- Select nothing if there are no zooks in list
			mySelected = nil
			myCreature = nil
			myCreatureDBID = nil
		end
	end
	
	-- Select the first Zook that matches the name of the current Zook
	if myCreature ~= nil then
		mySelected = nil
		for i,v in myCreatureDetails do 
			if v.name == myCreature then
				if v.dbid ~= nil then
					-- Dealing with internet Zooks from the server DB
					if v.dbid == myCreatureDBID then
						GUI.SetText( Segment.creature_list, creatures[i] )
						mySelected = i
						break
					end
				else
					GUI.SetText( Segment.creature_list, creatures[i] )
					mySelected = i
					break
				end
			end
		end
	end
	
	ShowPassport()
end





function LoadCreatureDetails()
	local zook_list = LoadZookList()
	MessageSetCreatureDetails(zook_list)
end


function MessageSetCreatureDetails(zook_list)
	myDetailNames = {}
	myDetailNames[1] = "Name"	
	myCreatureDetails = {}
	local last_creature = 0
	for i,v in zook_list.children do
		
		last_creature = last_creature + 1
		myCreatureDetails[last_creature] = {};
		local creatureD = myCreatureDetails[last_creature]
		creatureD.name = v.name
		creatureD.version = v.version
		creatureD.dbid = v.dbid	-- database ID which is included in zooklists from server
		local details =v.children[1]
		if details ~= nil then
			for index, value in details.children do
				AddIfNotPresent(value.name, myDetailNames)
				creatureD[value.name] = value.data
				creatureD[value.name.."_comment"] = value.comment
			end
		end
	end
		
	GUI.SetListText( Segment.sort_combo, myDetailNames )	
	for i,v in myDetailNames do
		if v == mySort then
			SortBy(mySort)
			return
		end
	end
	SortBy(myDetailNames[1])
end


function AddIfNotPresent(name, list)
	local found = false
	for di,dv in list do
		if dv == name then
			found = 1
			break
		end
	end
	if found == false then 
		local nextName = getn(list) + 1
		list[nextName] = name
	end
end


-- PASSPORT -----------------------------------------------------------------------------------------------------


function ShowPassport()	
	if myDownloadTeam== 1 and myShowPassportDownload == 1 and myCreatureDBID ~= nil then
		-- download zook to preview
		myLastTab = Agent.SendMessage("GetTab", myPassport)
		DownloadZook("DownloadPassportZookComplete")
	elseif myDownloadTeam == false  and theTeams ~= nil and myTeam ~= nil and myCreature ~= nil then
		-- local zook to preview
		local tab = Agent.SendMessage("GetTab", myPassport)
		Agent.SendMessage("Load", myPassport, myTeam, myCreature, myCreature, nil, nil)
		Agent.SendMessage("SetTab", myPassport, tab)		
	else
		-- no preview
		Agent.SendMessage("Clear", myPassport)
	end
end


function MessageDownloadPassportZookComplete(ok)
	if ok == false then
		myShowPassportDownload = false
		ShowPassport()
		GUI.SetButtonPushed( Segment.check_button, myShowPassportDownload )
		return
	end
	Agent.SendMessage("Load", myPassport, nil, TEMP_CREATURE, myCreature, nil, nil)
	Agent.SendMessage("SetTab", myPassport, myLastTab)
end


function MessageGetTab()
	return Agent.SendMessage("GetTab", myPassport)
end

function MessageSetTab(tab)
	Agent.SendMessage("SetTab", myPassport, tab)	
end

-- GUI CONTROL  -----------------------------------------------------------------------------------------------------------------

function SystemUIChange( segment )
	if segment == Segment.check_button then
		if myShowPassportDownload == 1 then
			myShowPassportDownload = false
		else
			myShowPassportDownload = 1
		end
		GUI.SetButtonPushed( Segment.check_button, myShowPassportDownload )
		if myDownloadTeam== 1 then
			ShowPassport()	
		end
	elseif segment == Segment.new_team then
		myNewTeamEntry = Agent.Create( "TextEntry", Agent.Me(), "New team name", "", "TextEntryOK", 1 )
	elseif segment == Segment.new_creature then
		if myTeam ~= "myZooks" then
			myDownloadTeam = false
			myTeam = "myZooks"
			InitSelection()
		end
		Agent.SendMessage("NewCreature", myNotifyAgent, "myZooks", Agent.Me())
	elseif segment == Segment.import_button then
		Agent.Create("ImportSelector", myNotifyAgent )
	elseif segment == Segment.load_button then
		LoadCreature()			
	elseif segment == Segment.delete_button then
		DeleteCreature()
	elseif segment == Segment.cancel_button then
		MessageDestroyOnSelect()
		return
	elseif segment == Segment.category_combo then
		local cat = GUI.GetText( Segment.category_combo )
		myCategoryKey = nil
		for i, v in myZookListCategories.children do
			if v.name == cat then
				myCategoryKey = v.key
				break
			end
		end
		DownloadCreatureDetails()
	elseif segment == Segment.team_list then
		myTeam = GUI.GetText( Segment.team_list )
		InitSelection()
	elseif segment == Segment.creature_list then
		mySelected = GUI.GetListSelection( Segment.creature_list ) 
		if mySelected ~= nil and mySelected ~= false then
			myCreature = myCreatureDetails[mySelected].name
			myCreatureDBID = myCreatureDetails[mySelected].dbid
		else
			mySelected = nil
			myCreature = nil
			myCreatureDBID = nil
		end
		ShowPassport()
	elseif segment == Segment.myzooks then
		myDownloadTeam = false
		myTeam = "myZooks"
		InitSelection()	
	elseif segment == Segment.examples then
		myDownloadTeam = false
		myTeam = "examples"
		InitSelection()
	elseif segment == Segment.internet then
		myDownloadTeam = 1
		myTeam = nil
		InitSelection()
	elseif segment == Segment.sort_combo then
		local sort =  GUI.GetText(Segment.sort_combo)
		SortBy(sort)
	end
end


function LoadCreature()
	if myCreature == nil or myCreature == false then
		Agent.Create( "Alert", "Please select or create a Zook", 1 , nil, nil)
		return
	end
	if myDownloadTeam == false then
		-- laod from disk
		if myTeam == nil or myTeam == false then
			Agent.Create( "Alert", "Please select or create a team", 1 , nil, nil)
			return
		end
		local version, maxVersion = Agent.SendMessage("Version", myPassport)
		if Agent.SendMessage("OKLoadCreature", myNotifyAgent, myTeam, myCreature, version ) ~= false then
			local lastLoaded = {}
			lastLoaded.team =  myTeam
			lastLoaded.creature = myCreature
			local path = Config.Get("product_directory", ".")
			System.WriteTable(path .. "/TeamSelection.dat", lastLoaded)
			Agent.SendMessage( "LoadCreature", myNotifyAgent, myTeam, myCreature, version, maxVersion )
			MessageDestroyOnSelect()
			return
		end
	else
		-- load from internet
		local version = myCreatureDetails[mySelected].version
		if Agent.SendMessage("OKVersion", myNotifyAgent, tonumber(version)) ~= false then
			if myShowPassportDownload == 1 then
				MessageDownloadZookComplete(nil, 0)
			else
				DownloadZook("DownloadZookComplete")
			end	
		end
	end
end

-- Called on successful download of a Zook as a temporary file
function MessageDownloadZookComplete(ok)
	if ok == false then
		return
	end	
	local creature = myCreature
	local notifyAgent = myNotifyAgent
	MessageDestroyOnSelect()
	Agent.SendMessage( "Import", notifyAgent, Config.Get("product_directory", ".").."/"..TEMP_CREATURE, creature..".zook")
end


function DeleteCreature()
	if myDownloadTeam == 1 then
		Agent.Create( "Alert", "You can not delete a zook from the website.", 1, nil, nil )
		return
	end
	if myTeam == nil or myTeam == false then
		Agent.Create( "Alert", "Please select a team.", 1, nil, nil )
		return
	end
	if myCreature == nil or myCreature == false then
		Agent.Create( "Alert", "Please select a Zook.", 1, nil, nil )
		return
	end
	theTeams = Config.Get("current_teams_directory", "") 
	if theTeams ~= Config.Get("default_teams_directory", "") then
		Agent.Create( "Alert", "You can not delete example Zooks.", 1 , nil, nil)
	else
		Agent.Create( "UserChoice", "Are you sure you want to delete Zook "..myCreature,
				   {"Delete","Cancel"},
				    Agent.Me(), "ConfirmDelete" )
	end
end


function MessageConfirmDelete( dialogAgent, choiceIndex )
	if choiceIndex == 1 then
		local loadedTeam, loadedCreature = Agent.SendMessage("LoadedDetails", myNotifyAgent)
		if myTeam == loadedTeam and myCreature ==loadedCreature then
			local path = Config.Get("product_directory", ".")
			System.DeleteFile(path .. "/TeamSelection.dat")
			Segment.Destroy(Segment.cancel_button)
		end
		System.DeleteFile(theTeams..myTeam.."/Creatures/"..myCreature)
		MessageRemoveEntry( myCreature )
		Trace( "Saved file" )
		myCreature = ""
		InitSelection()
		Trace( "Redone selection" )
		--GetSavedVersion()
	end
end
	
function MessageTextEntryOK(newText )
	local agent = Agent.From()
	if Equals( agent, myNewTeamEntry ) and newText ~= "" then
		local product = Config.Get("product_directory", ".");
		local root = System.GetLabeledPath("ROOT")
		System.CopyDirectory( root.."/NewTeam", product .. "/Teams/"..newText, 0 )
		myTeam = newText
		InitSelection()	
		GUI.SetText( Segment.creature_list, "[no zooks]" )
	end
	
end

function MessageNewCreatureCreated(name)
	MessageModifyEntry(name)
	MessageDestroyOnSelect()
end

function MessageDestroyOnSelect()
	if myDestroyOnSelect == 1 then
		Agent.Destroy()
	else
		MessageShow(false)
	end
end

-- DOWNLOAD ----------------------------------------------------------------------------------------------------------------------------------------

-- Set up for web download. First requirement is the online configuration agent.
function ConfigureWeb()
	Trace("ZookSelector::ConfigureWeb")
	Execute("WebConfiguration", 1)
	ReconfigureMyHttp()
	--if Agent.IsValid(myHttp) == false then
	--	local server = Config.Get("web_server", "")
	--	myHttp = Agent.Create("Http", server)
	--end
	local object = Config.Get("web_agent_path", "") .. Config.Get("web_online_configuration_agent", "") .. ".sax"
	TheAlert = Agent.Create("Alert", "Online configuration, please wait...", false, nil, nil)
	Agent.SendMessage("Get", myHttp, object, Agent.Me(), "DownloadWebConfigComplete")
end

function MessageDownloadWebConfigComplete(recieved, error)
	Trace("ZookSelector::DownloadWebConfigComplete")
	Agent.SendMessage("Destroy", TheAlert)
	if error ~= 0 then
		MessageDownloadError()
		Agent.Create("Alert", {"Failed to access BAMZOOKi server files.", "Please check your Internet connection","and try again.", "", "Return error " .. error, "whilst looking for " .. Config.Get("web_online_configuration_agent", "<onlineconf>")}, 1, nil, nil)
		return
	end	
	
	if TEST_LOCAL_ONLINECONFIG == false then
		Agent.DestroyClass(Config.Get("web_online_configuration_agent", ""))
		Agent.CreateClassFromString(Bin.DecryptScript(recieved))
	end
	
	if myConfigureWebOptions == nil then
		myConfigureWebOptions = {}
	end
	myOnlineConfigAgent = Agent.Create(Config.Get("web_online_configuration_agent", ""), myConfigureWebOptions)
	Agent.SendMessage("Configure", myOnlineConfigAgent)
	myConfigureWebOptions = nil
end

function MessageExecuteWebConfigComplete(data)
	if Agent.IsValid(myOnlineConfigAgent) == 1 then
		Agent.SendMessage("Destroy", myOnlineConfigAgent)
		ReconfigureMyHttp()
	end
	local call = myWebFunctionCall
	myWebFunctionCall = nil
	if data.webConfigured == 1 then
		if call ~= nil then
			call()
		end
	else
		MessageDownloadError()
	end
end


-- Called after the web server (Config "web_server") may have changed
function ReconfigureMyHttp()
	if Agent.IsValid(myHttp) ~= false then
		-- a live HTTP connection
		local server = Agent.SendMessage("GetServer", myHttp)
		if server ~= Config.Get("web_server", "") then
			-- change server
			Agent.SendMessage("Destroy",myHttp)
			myHttp = Agent.Create("Http", Config.Get("web_server", ""))
		end
	else
		-- new HTTP connection
		local server = Config.Get("web_server", "")
		myHttp = Agent.Create("Http", server)
	end
end


-- Download the list of Zook list categories available, e.g. for each trial
function DownloadListCategories()
	if myZookHerder == nil then
		myWebFunctionCall = DownloadZookHerder
		myPostHerderDownloadCall = DownloadListCategoriesB
		ConfigureWeb()
	else
		DownloadListCategoriesB()
	end
end

function DownloadListCategoriesB()
	Agent.SendMessage("GetZookListCategories", myZookHerder, {http = myHttp, notify_message = "SetListCategories"} )
end


-- Download a list of Zooks in a single category.
function DownloadCreatureDetails()
	if myZookHerder == nil then
		myWebFunctionCall = DownloadZookHerder
		myPostHerderDownloadCall = DownloadCreatureDetailsB
		ConfigureWeb()
	else
		DownloadCreatureDetailsB()
	end
end

function DownloadCreatureDetailsB()
	Agent.SendMessage("GetZookList", myZookHerder, {http = myHttp, notify_message = "SetCreatureDetails", key = myCategoryKey} )
end


-- Download a Zook, the notify message will be the one that
-- gets called when the download has been completed.
function DownloadZook(notifyMessage)
	myDownloadZookNotifyMessage = notifyMessage 
	if myZookHerder == nil then
		myWebFunctionCall = DownloadZookHerder
		myPostHerderDownloadCall = DownloadZookB
		ConfigureWeb()
	else
		DownloadZookB()
	end
end

function DownloadZookB()
	local full_path = Config.Get("product_directory", ".") .. "/" .. TEMP_CREATURE
	Agent.SendMessage("Download", myZookHerder, {http = myHttp, file = full_path, zookid = myCreatureDBID, notify_message = myDownloadZookNotifyMessage} )
end


-- Download the ZookHerder - required before pretty much anything 
-- can be downloaded or uploaded, e.g. Zooks, lists, etc.
function DownloadZookHerder()
	local object = Config.Get("web_agent_path", "") .. Config.Get("web_zookherder_agent", "") .. ".sax"
	TheAlert = Agent.Create("Alert", "Contacting BAMZOOKi server, please wait...", false, nil, 400)
	Agent.SendMessage("Get", myHttp, object, Agent.Me(), "DownloadZookHerderComplete")
end

function MessageDownloadZookHerderComplete(recieved, error)
	Agent.SendMessage("Destroy", TheAlert)
	if error ~= 0 then
		Agent.Create("Alert", {"Failed to access BAMZOOKi server files.", "Please check your Internet connection","and try again.", "", "Return error " .. error, "whilst looking for " .. Config.Get("web_zookherder_agent", "<zookherder>")}, 1, nil, nil)
		return
	end	
	
	if TEST_LOCAL_ZOOKHERDER == false then
		Agent.DestroyClass(Config.Get("web_zookherder_agent", ""))
		Agent.CreateClassFromString(Bin.DecryptScript(recieved))
	end
	
	if Agent.IsValid(myZookHerder) then
		Agent.SendMessage("Destroy", myZookHerder)
	end
	myZookHerder = Agent.Create(Config.Get("web_zookherder_agent", ""))
	myPostHerderDownloadCall()
end

function MessageDownloadError()
	SystemUIChange( Segment.myzooks )
end
