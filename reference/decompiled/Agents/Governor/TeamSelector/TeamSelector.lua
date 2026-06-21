# TeamSelector specializes UIAgent embeds Input, Camera, Visual

function Initialize( notifyAgent, team, creature, version, allowNew, selectTeams, allowCancel )

	mySelectTeams = selectTeams
	mySelectTeams = false
	
	
	myTeam = team
	myCreature = creature
	myNotifyAgent = notifyAgent
	myVersion = version
	myMaxVersion = 1
	myLastAnon = 0

	local screenWidth, screenHeight = GUI.Area()
	GUI.CreateObject( "team_modal", 0, 0, screenWidth, screenHeight )
	local width = 600
	local height = 400
	local middle = screenWidth / 2
	local left = middle - width / 2
	local right = left + width
	local top = screenHeight/2 - height / 2
	local bottom = top + height
	--GUI.CreatePicture( "panel", "./UI/Grey", left, top, right, bottom)
	AddPanel(  left, top, right, bottom, 1, 1, 1, 1, 0,0)
	local x = left
	local xRight = x + 220
	local y = top + 16

	if mySelectTeams == 1 then
		GUI.CreateText("team_label", "Team", x + 16, y + 3, x+16, y, "Fonts/Edit.met" )
		GUI.SetColour( Segment.team_label, 0, 0, 0, 1 )
		if allowNew then
			AddPanelButton( "new_team", "New", xRight - 64 , y, xRight, y+24 )
		end
	
		y = y + 30
		GUI.CreateCombo( "team_list", "", x + 16, y, xRight,y + 20 ,  "Fonts/Edit.met" )
		y = y + 26
	else
		local xLeft = x + 16
		local width = (xRight - xLeft)/2
		AddPanelButton( "myzooks", "My Zooks", xLeft , y, xLeft+(width-12), y+24 )
		AddPanelButton( "examples", "Examples", xLeft+(width+12) , y, xRight, y+24 )
		y = y + 40
	end
	
	GUI.CreateText("creature_label", "Zook", x + 16, y + 3, x+16, y, "Fonts/Edit.met" )
	GUI.SetColour( Segment.creature_label, 0, 0, 0, 1 )
	if allowNew then
		AddPanelButton( "new_creature", "New", xRight - 64 , y, xRight, y+24 )
	end
	y = y + 30
	GUI.CreateList("creature_list",  x + 16, y, xRight, bottom - 40 ,  "Fonts/Edit.met" )
	y = y + 30
	
		
	--GUI.CreateText("version_label", "Version", x + 16, y + 3, x+16, y, "Fonts/Edit.met" )
	--GUI.SetColour( Segment.version_label, 0, 0, 0, 1 )
	--local y = y + 30
	--GUI.CreateList("version_list", x + 16, y, xRight, bottom - 40 ,  "Fonts/Edit.met" )
	
	AddPanelButton( "load_button", "Open", xRight+16, bottom - 32, xRight +84, bottom - 8 )
	AddPanelButton( "load_button", "Open", xRight+100, bottom - 32, xRight +168, bottom - 8 )
	AddPanelButton( "delete_button", "Delete", xRight+184, bottom - 32, xRight +248, bottom - 8 )

	if allowCancel then 
		AddPanelButton( "cancel_button", "Cancel", xRight+268, bottom - 32, xRight +328, bottom - 8 )
	end	
	local marg = 8
	CreatePreview( xRight + 16 + marg, top + 16 + marg, right - 16 - marg, bottom - 40- marg )
	GUI.CreateBorder( "tv",  xRight + 16, top + 16, right - 16, bottom - 40, 64, 0, 128,64, 1 )
	GUI.SetColour( Segment.tv, PanelColour() )
	
	if myTeam == nil then
		local path = Config.Get("product_directory", ".")
		local lastLoaded = System.ReadTable(path .. "/TeamSelection.dat")
		myTeam = lastLoaded.team
		myCreature = lastLoaded.creature
	end
	
	InitSelection()
	
	
	Input.SetFocus()

end

function Finalize()
	World.Destroy( myWorld )
end

function MessageDestroy()
	Agent.Destroy()
end


function InitSelection()
	
	if mySelectTeams == 1 then
		
		theTeams = System.GetLabeledPath("ROOT").."/Teams/"
		PopulateTeamList()

	else
		if myTeam == nil then
			myTeam = "myZooks"
		end

		if myTeam == "myZooks" then
			theTeams = Config.Get("default_teams_directory", "") 
			--GUI.Show(Segment.new_creature, 1)
			GUI.SetButtonPushed(Segment.myzooks, 1)
			GUI.SetButtonPushed(Segment.examples, false)
		else
			-- examples
			theTeams = System.GetLabeledPath("ROOT").."/Teams/"
			--GUI.Show(Segment.new_creature, false)
			GUI.SetButtonPushed(Segment.myzooks, false)
			GUI.SetButtonPushed(Segment.examples, 1)
		end
	end
	
	Config.Set("current_teams_directory", theTeams)			
	PopulateCreatureList()
	GetSavedVersion()

end
	

function CreatePreview( left, top, right, bottom )
	myWorld = World.Create()
	myDistance = 5
	myYaw = 0
	myAngle = 30

	World.OpenAccess(myWorld)
		myBuilderParts = Agent.Create( "BuilderParts", Vector.New( 0, 0, 0 ), nil )
		local light = Visual.CreateLight( Visual.LIGHT_SOFTSPOT )
		local transform = Matrix.New()
	
		Matrix.SetTranslation( transform, Vector.New( 0, 20, 0 ) )
		Matrix.LookAt( transform, Vector.New( 0, 0, 0 ), Vector.New( 1, 0, 0 ) )
		Visual.SetLightTransform( light, transform )
		Visual.SetLightRadius( light, 50 )
		Visual.SetLightConeAngle( light, 20 )
	
		light = Visual.CreateLight( Visual.LIGHT_AMBIENT )
		Visual.SetLightColour( light, .2, .2, .2 )
		
	World.CloseAccess()
	Camera.Create( left, top, right, bottom )
	Camera.SetBackground( 1, 1, 1, 0 )
end

function SystemCamera( frametime )
	myYaw = myYaw + frametime * 30
	local y = Number.sin( myAngle ) * myDistance
	local r = Number.cos( myAngle ) * myDistance
	local z = r * Number.cos( myYaw )
	local x = r * Number.sin( myYaw )
	Camera.SetPosition( Vector.New( x, y, z ) )
	Camera.SetTarget( Vector.New( 0, 0, 0 ), Vector.New( 0, 1, 0 ) )
end


function ShowPreview()
	if theTeams ~= nil and myTeam ~= nil and myCreature ~= nil and myVersion ~= nil then
		Agent.SendMessage( "Load", myBuilderParts, theTeams..myTeam.."/Creatures/"..myCreature.."/"..myVersion..".zook",
			theTeams..myTeam.."/Textures", "", false )
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

function ListContainsItem( list, item )
	for index, value in list do
		if value == item then
			return 1
		end
	end
	return false
end

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

function PopulateCreatureList()
	local creatures = {}
	if myTeam ~= nil and myTeam ~= "" then
		creatures = System.GetDirectoryContents( theTeams..myTeam.."/Creatures",  "*.*", 2)
		RemoveCVS( creatures )
	end
	GUI.SetListText( Segment.creature_list, creatures )
	if not ListContainsItem( creatures, myCreature ) then
		if getn(  creatures ) > 0 then
			myCreature = creatures[1]
		else
			myCreature = nil
		end
	end
	if myCreature ~= nil then
		GUI.SetText( Segment.creature_list, myCreature )
	else
		GUI.SetText( Segment.creature_list, "[no zooks]" )
	end
end

function NewestVersionComparison( l, r )
	return tonumber( l ) > tonumber( r ) 
end

function OldestVersionComparison( l, r )
	return tonumber( l ) < tonumber( r ) 
end

function GetVersions()
	local versions = {}
	myMaxVersion = nil
	if myTeam ~= nil and myTeam ~= "" and myCreature ~= nil and myCreature ~= "" then
		versions = System.GetDirectoryContents( theTeams..myTeam.."/Creatures/"..myCreature,"*.zook", 1)
		RemoveCVS( versions )

		myMaxVersion = 1
		for index, value in versions do
			versions[index] = String.gsub( value, "%.zook", "" )
			if tonumber( versions[index] ) > myMaxVersion then
				myMaxVersion = tonumber( versions[index] )
			end
		end
		myMaxVersion = Number.floor( myMaxVersion )
		if myTeam == "examples" then
			sort( versions, OldestVersionComparison )
		else
			sort( versions, NewestVersionComparison )
		end
	end
	return versions
end


	
function PopulateVersionList()
	local versions = GetVersions()
	GUI.SetListText( Segment.version_list, versions )
	myVersion = nil
end


function SystemUIChange( segment )
	if segment == Segment.new_team then
		myNewTeamEntry = Agent.Create( "TextEntry", Agent.Me(), "New team name", "", "TextEntryOK", 1 )
	end
	if segment == Segment.new_creature then
		Agent.SendMessage("NewCreature", myNotifyAgent, "myZooks", Agent.Me())
	end
	if segment == Segment.import_button then
		Agent.Create("ImportSelector", myNotifyAgent )
	end
	if segment == Segment.load_button then
		if myTeam == nil or myTeam == false then
			Agent.Create( "Alert", "Please select or create a team", 1 , nil, nil)
			return
		end
		if myCreature == nil or myCreature == false then
			Agent.Create( "Alert", "Please select or create a Zook", 1 , nil, nil)
			return
		end
		if myVersion == nil or myVersion == false then
			Agent.Create( "Alert", "Please select a version", 1, nil, nil )
			return
		end
		
		if Agent.SendMessage("OKLoadCreature", myNotifyAgent, myTeam, myCreature, myVersion ) ~= false then
			local lastLoaded = {}
			lastLoaded.team =  myTeam
			lastLoaded.creature = myCreature
			local path = Config.Get("product_directory", ".")
			System.WriteTable(path .. "/TeamSelection.dat", lastLoaded)
			Agent.SendMessage( "LoadCreature", myNotifyAgent, myTeam, myCreature, myVersion, myMaxVersion )
			Agent.Destroy()
		end
	end
	if segment == Segment.delete_button then
		if myTeam == nil or myTeam == false then
			Agent.Create( "Alert", "Please select a team", 1, nil, nil )
			return
		end
		if myCreature == nil or myCreature == false then
			Agent.Create( "Alert", "Please select a Zook", 1, nil, nil )
			return
		end
		if myVersion == nil or myVersion == false then
			Agent.Create( "Alert", "Please select a version", 1, nil, nil )
			return
		end
		theTeams = Config.Get("current_teams_directory", "") 
		if theTeams ~= Config.Get("default_teams_directory", "") then
			Agent.Create( "Alert", "You can not delete examples", 1 , nil, nil)
		else
			Agent.Create( "UserChoice", "Are you sure you want to delete "..myCreature,
			                   {"Delete","Cancel"},
			                    Agent.Me(), "ConfirmDelete" )
		end
	end
	if segment == Segment.cancel_button then
		Agent.Destroy()
	end
	if segment == Segment.team_list then
		myTeam = GUI.GetText( Segment.team_list )
		InitSelection()
	end
	if segment == Segment.creature_list then
		myCreature = GUI.GetText( Segment.creature_list )
		GetSavedVersion()
	end
	if segment == Segment.myzooks then
		myTeam = "myZooks"
		InitSelection()	
	end
	if segment == Segment.examples then
		myTeam = "examples"
		InitSelection()
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
		PopulateCreatureList()
		GetSavedVersion()
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
	Agent.Destroy()
end



function GetSavedVersion()
	if myCreature ~= nil then
		
		local versions = GetVersions()
		myVersion = versions[1]
		
		ShowPreview()
	else
		Agent.SendMessage( "Clear", myBuilderParts)		
	end
	
end



function Find(table, key)
	for i,v in table do
		if v == key then
			return key
		end
	end
	return nil
end

	