# ContestRunner specializes UIAgent

CONTEST_PATH = Config.Get("product_directory", ".").."/Contests/"
VIDEO_PATH = Config.Get("product_directory", ".").."/Videos/"

function Initialize()
	local myDocs = System.GetLabeledPath( "MYDOCUMENTS" )
	System.CreateDirectory( myDocs.."/My BAMZOOKi" )
	System.CreateDirectory( myDocs.."/My BAMZOOKi/Motion Files" )
	
	
	
	ReadContestDefinitions()
	local ContestPackPath = Config.Get("product_directory", ".").."/ContestPacks/"
	Config.Set("texture_path", "./NewTeam/Textures")

	--~ local zooks = System.ReadTable( ContestPackPath.."Team.tab" )
	--~ if zooks ~= nil and getn(zooks) == 4 then
		--~ Agent.SendMessage( "SetZooks", myTeamPick, zooks )
	--~ end
	CreateUI()
	SetContestPicture()
	myContest = Agent.Create( "ContestRunnerContest", Agent.Me() )
	myZookSelector = Agent.Create( "ZookSelector", nil, nil, Agent.Me(), false, false, false, 1, false, false )
	myTeam = {}
	Agent.SendMessage("Show", myZookSelector, false)
end

function CreateUI()
	local width, height = GUI.Area()
	GUI.CreatePicture( "background", "white.png", 0, 0, width, height )
	local margin = 16
	--GUI.SetParent( Segment.background )
	GUI.CreateText( "contest_label", "Contests", margin, margin, margin, margin, "Fonts/Arial-32.met" )
	GUI.SetColour( Segment.contest_label, 0, 0, 0, 1 )
	GUI.CreatePicture( "contests_border", "white.png", margin, margin + 36, width / 2 - margin, height / 2 - margin )
	GUI.SetColour( Segment.contests_border, 0, 0, 0, 1 )
	GUI.CreateList( "contests", margin, margin + 36, width / 2 - margin-1, height / 2 - margin-1, "fonts/edit.met" )
	GUI.CreatePicture( "contest_picture_border", "white.png", margin, height/2 + margin, width / 2 - margin, height - 36 - margin * 2 )
	GUI.SetColour( Segment.contest_picture_border, 0, 0, 0, 1 )
	GUI.CreatePicture( "contest_picture", "white.png", margin+1, height/2 + margin+1, width / 2 - margin-1, height - 36 - margin * 2-1 )
	local names = {}
	local i = 0
	for name, contest in myContests do
		i = i + 1
		names[ i ] = name
	end
	sort( names )
	GUI.SetListText( Segment.contests, names )
	
	GUI.SetParent()
	GUI.CreateObject( "button_parent", 0, height - margin - 36, width, height, false )
	AddPanelButton( "go", "Go", width - margin - 100, 0, width - margin, 36, Segment.button_parent )
	AddPanelButton( "quit", "Exit", margin, 0, margin + 100, 36, Segment.button_parent )
	GUI.SetParent()

	myPreviews = {}
	myPreviewButtons = {}
	myPreviewLabels = {}
	local colours = { {0,0.7,0.4}, {1,0.1,0.1} }
	for i = 1, 2 do
		local x1 = width / 2 + margin
		local x2 = width - margin
		local y1 = ( i - 1 )* ( height - 36 - margin) / 2 + margin + 36
		local y2 = i * ( height -36 - margin ) / 2 - margin
		local pic = GUI.CreatePicture( "back"..i, "white.png", x1, y1, x2, y2 )
		GUI.SetColour( pic, colours[i][1], colours[i][2], colours[i][3], 1 )
		x1 = x1 + 8
		y1 = y1 + 8
		x2 = x2 - 8
		y2 = y2 - 8
		myPreviews[i] = Agent.Create("ZookPreview", x1, y1, x2, y2 )
		local image = "UI\\Buttons\\UI_Transparent_Up"

		myPreviewButtons[ GUI.CreateButtonEx( "button"..i, x1, y1, x2, y2, image, image, image ) ] = i
		myPreviewLabels[i] = GUI.CreateText( "label"..i, "Zook "..i, x1, y1 - 36  - 8, x1, y1 - 36 - 8, "Fonts/Arial-32.met" )
		GUI.SetColour( myPreviewLabels[i], 0, 0, 0, 1 )
	end
	myUIVisible = 1
		
end

function SystemUIResize( segment )
	if segment == Segment.background then
		MessageResize()
		--Agent.PostMessage( "Resize", Agent.Me(), 0.2 )
	end
end

function MessageResize()
	local width, height = GUI.Area()
	--GUI.Resize( Segment.background, 0, 0, width, height )
	local margin = 16
	GUI.Resize( Segment.contest_label, margin, margin, margin, margin )
	GUI.Resize( Segment.contests_border, margin, margin + 36, width / 2 - margin, height / 2 - margin )
	GUI.Resize( Segment.contests, margin, margin + 36, width / 2 - margin-1, height / 2 - margin-1 )
	GUI.Resize( Segment.contest_picture_border, margin, height/2 + margin, width / 2 - margin, height - 36 - margin * 2 )
	GUI.Resize( Segment.contest_picture, margin+1, height/2 + margin+1, width / 2 - margin-1, height - 36 - margin * 2-1 )

	GUI.SetParent()
	GUI.CreateObject( "button_parent", 0, height - margin - 36, width, height, false )
	AddPanelButton( "go", "Go", width - margin - 100, 0, width - margin, 36, Segment.button_parent )
	AddPanelButton( "quit", "Exit", margin, 0, margin + 100, 36, Segment.button_parent )
	GUI.SetParent()
	GUI.Show( Segment.button_parent, myUIVisible )

	for i = 1, 2 do
		local x1 = width / 2 + margin
		local x2 = width - margin
		local y1 = ( i - 1 )* ( height - 36 - margin) / 2 + margin + 36
		local y2 = i * ( height -36 - margin ) / 2 - margin
		GUI.Resize( Segment.GetId( "back"..i ), x1, y1, x2, y2  )
		x1 = x1 + 8
		y1 = y1 + 8
		x2 = x2 - 8
		y2 = y2 - 8
		Agent.SendMessage( "Resize", myPreviews[i] , x1, y1, x2, y2 )
		GUI.Resize( Segment.GetId( "button"..i ), x1, y1, x2, y2  )
		GUI.Resize( myPreviewLabels[i], x1, y1 - 36  - 8, x1, y1 - 36 - 8  )
	end
		
end

function ShowChoosingUI( show )
	myUIVisible = show
	for i = 1, 2 do
		Agent.SendMessage( "Show", myPreviews[i], show )
		GUI.Show( myPreviewLabels[i], show )
		GUI.Show( Segment.GetId( "label"..i ), show )
		GUI.Show( Segment.GetId( "back"..i ), show )
	end
	--GUI.Show( Segment.background, show )
	GUI.Show( Segment.button_parent, show )
	GUI.Show( Segment.contest_label, show )
	GUI.Show( Segment.contests, show )
	GUI.Show( Segment.contest_picture, show )
	GUI.Show( Segment.contests_border, show )
	GUI.Show( Segment.contest_picture_border, show )
end

function ReadContestDefinitions()
	local ContestPackPath = "ContestPacks/"
	myContests = {}
	local contestPacks =  System.GetDirectoryContents( ContestPackPath, "*.dat", 1)
	for index,value in contestPacks do	
		local pack = System.ReadTable(ContestPackPath..value)
		for name, contest in pack do
			myContests[name] = contest
		end
	end
end

function Finalize()
	Agent.SendMessage( "Destroy", myContest )
	Agent.SendMessage( "Destroy", myZookSelector )
	for i = 1, 2 do
		Agent.SendMessage( "Destroy", myPreviews[i] )
	end

end

function SystemUIChange( segment )
	local preview = myPreviewButtons[ segment ]
	if preview ~= nil then
		myZookChoosing = preview
		Agent.SendMessage( "SetTemporaryName", myZookSelector, "tempZook"..myZookChoosing..".zook" )
		Agent.SendMessage("Show", myZookSelector, 1)
	end

	if segment == Segment.quit then
		System.ExitMainLoop()
	elseif segment == Segment.go then
		RunContest()
	elseif segment == Segment.contests then
		SetContestPicture()
	end
	
end

function SetContestPicture()
		local contest = myContests[ GUI.GetListSelectedText( Segment.contests) ]
		if contest.picture ~= nil then
			GUI.Retexture( Segment.contest_picture, "./Contests/Contest Pack/"..contest.picture )
		else
			GUI.Retexture( Segment.contest_picture, "white.png" )
		end
end

function MessageContestFinished()
		ShowChoosingUI( 1 )
end

-- NOTE: Does not check version of Zook being downloaded
function MessageOKLoadCreature( team, creature, version )
	return 1
end

function MessageLoadCreature( team, creature, version, maxVersion )
	if team == "myZooks" then
		team = Config.Get("default_teams_directory", "")..team
	else
		team = System.GetLabeledPath("ROOT").."/Teams/"..team
	end
	myTeam[myZookChoosing] = {team = team, creature = creature, version = version}
	Agent.SendMessage("Load", myPreviews[myZookChoosing], myTeam[myZookChoosing].team, myTeam[myZookChoosing].creature, myTeam[myZookChoosing].version)
	GUI.SetText( myPreviewLabels[myZookChoosing], myTeam[myZookChoosing].creature )
end

-- DYLAN - trying to import
function MessageImport( fullpath, creature_name )
	myTeam[myZookChoosing] = {creature = fullpath}
	Agent.SendMessage("Load", myPreviews[myZookChoosing], myTeam[myZookChoosing].team, myTeam[myZookChoosing].creature, myTeam[myZookChoosing].version)
	GUI.SetText( myPreviewLabels[myZookChoosing], creature_name )
end

function LoadCreature( zookIndex )
end

function RunContest()
	local contest = myContests[ GUI.GetListSelectedText( Segment.contests) ]
	if myTeam[1] == nil then
		Agent.Create( "Alert", "Please select green contestant", 1, nil, nil )
		return
	end
	if myTeam[2] == nil then
		Agent.Create( "Alert", "Please select red contestant", 1, nil, nil )
		return
	end
	local contestants = {}
	for i = 1,2 do
		if myTeam[i].team == nil then
			contestants[i] = {fullname = myTeam[i].creature}
		else
			contestants[i] = {fullname = myTeam[i].team.."/Creatures/"..myTeam[i].creature.."/"..myTeam[i].version..".zook"}
		end
	end
	ShowChoosingUI( false )
	Agent.SendMessage( "BeginContest", myContest,  GUI.GetListSelectedText( Segment.contests), contest, contestants)
end
