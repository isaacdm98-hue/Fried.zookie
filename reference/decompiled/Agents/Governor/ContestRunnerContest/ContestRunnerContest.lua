# ContestRunnerContest specializes UIAgent embeds Input, Visual

function Initialize(notify)
	--VIDEO_PATH = System.GetLabeledPath("EXPORT") .. "/"
	VIDEO_PATH = System.GetLabeledPath("MYDOCUMENTS") .. "/My BAMZOOKi/Motion Files/"
	TMP_VIDEO_PATH = Config.Get("product_directory", ".").."/Videos/"

	myNotify = notify
	local width, height = GUI.Area()
	GUI.SetParent()
	GUI.CreateObject( "resizer", 0, 0, width, height, false )
	CreateUI()
end

function SystemUIResize( segment )
	if segment == Segment.resizer then
		MessageResize()
		--Agent.PostMessage( "Resize", Agent.Me(), 0.2 )
	end
end

function MessageResize()
	CreateUI()
	Agent.SendMessage( "Resize", myCountdown )
end

function CreateUI()
	local width, height = GUI.Area()
	local margin = 4
	GUI.SetParent()
	GUI.CreateObject( "parent", 0, 0, width, margin + 80, false )
	AddPanel( 4, 4, 414, 62, false, false, false, 1, Segment.parent, Segment.parent )
	AddPanelButton( "stop", "Stop", margin+10, 8, margin + 40, 30, Segment.parent )
	GUI.SetParent( Segment.parent )
	GUI.CreateText( "time_text", "Simulation time: "..String.format( "%4.1f", 0 ).."0", 75, 12, 0, 0, "Fonts/edit.met" )
	GUI.SetColour( Segment.time_text, 0, 0, 0, 1 )
	GUI.CreateText( "green_score", "", 250, 12, 0,0, "Fonts/edit.met" )
	GUI.SetColour( Segment.green_score, 0,0.7,0.4, 1 )
	GUI.CreateText( "red_score", "", 325, 12, 0, 0, "Fonts/edit.met" )
	GUI.SetColour( Segment.red_score, 1,0.1,0.1, 1 )
	GUI.CreateText( "pointless_warning", "Recording simulation! This may run slowly on some machines.", margin+10, margin + 32, 0, 0, "Fonts/edit.met" )
	GUI.SetColour( Segment.pointless_warning, 1,0,0, 1 )
	GUI.SetParent()
	GUI.Show( Segment.parent, myWorld ~= nil )
end

function SystemKeyDown( key )
	if key == Input.KEY_1 then
		MessageContestFinished( )
	end
	if key == Input.KEY_2 then
		MessageContestFinished(  )
	end
	if key == Input.KEY_3 then
		MessageContestFinished(  )
	end
end

function SystemUIChange( segment )
	if segment == Segment.stop then
		if myRecording then
			myStopped = 1
			Agent.StopTimer( Agent.Me(), "writevis" )
			World.CloseVisualOutput()
			local sel = Agent.Create("FileSelector", Agent.Me(), "RecordThenGo", "Save motion file", "Save", VIDEO_PATH, ".bvz", 1, false)
			Agent.SendMessage("Filename", sel, Filename())
		else
			EndContest()
		end
			--Agent.SendMessage("Filename", sel, Filename())
	end
end

function Filename()
	local root = myContestName.." "
	versions = System.GetDirectoryContents( VIDEO_PATH,root.."*.bvz", 1)
	local maxVersion = 0
	for iFile, file in versions do
		local version = Version( file )
		if version ~= nil and version > maxVersion then
			maxVersion = version
		end
	end
	return root..(maxVersion+1)
end

function Version( file )
	local lastNumber = String.strlen( file )-4
	for iCh = lastNumber, 1, -1 do
		if String.strsub( file, iCh, iCh ) == " " then
			return tonumber( String.strsub( file, iCh + 1, lastNumber ) )
		end
	end
	return 0
end


function EndContest()
	CleanUp()
	GUI.Show( Segment.parent, false )
	Agent.SendMessage( "ContestFinished", myNotify )
end

function MessageRecordThenGo(file, fileWithExtension)
	if file == nil then
		EndContest()
		return
	end
	local files =  System.GetDirectoryContents( VIDEO_PATH, "*.bvz", 1)
	local exists = false
	for i,v in files do 
		if v == fileWithExtension then
			exists = 1
			break
		end
	end
	myVideoRecordFilename = VIDEO_PATH..fileWithExtension
	if exists ~= false then
		Agent.Create("OKCancel", "Movie already exists. Replace?", Agent.Me(), "OKRecordThenGo")
	else
		MessageOKRecordThenGo(1)
	end
end

function MessageOKRecordThenGo(ok)
	if ok == 1 then
		System.Zip( TMP_VIDEO_PATH.."TempSaveVideo.bmv", myVideoRecordFilename, 6 )
	else
		local sel = Agent.Create("FileSelector", Agent.Me(), "RecordThenGo", "Save motion file", "Save", VIDEO_PATH, ".bvz", 1, false)
		Agent.SendMessage("Filename", sel, Filename())
		return
	end
	EndContest()
end


function Finalize()
	CleanUp()
end

function MessageBeginContest( name, contest, contestants )
	myContestName = name
	myContestDef = contest
	myContestants = contestants
	myRound = 1
	Scores = {}

	BeginRound()
	GUI.Show( Segment.parent, 1 )
end

function CleanUp()
	if myWorld ~= nil then
		Agent.SendMessage( "Destroy", myCamera )
		Agent.SendMessage( "Destroy", myCountdown )
		Agent.SendMessage( "Destroy", myContest )
		--Agent.SendMessage( "Destroy", myKeys )
		Agent.StopTimer( Agent.Me(), "timer" )
		Segment.Destroy( Segment.ambient )
		Segment.Destroy( Segment.directional )
		World.Destroy( myWorld )
		myWorld = nil
	end
end

function BeginRound()
	CleanUp()

	myWorld = World.Create()

	local camera = myContestDef.camera
	if camera == nil then
		camera = {}
	end
	camera.no_margin = 1
	myCamera = Agent.Create( "SplitScreen", myWorld, camera )

	World.OpenAccess(myWorld)
		--Agent. Create("BAMZOOKiSeriesOneSet", {position = Vector.New(352.4,-20,-283.2), scale = Vector.New(.025,.025,.025)})
		local round = myContestDef.rounds[myRound]
		local contestFile = round.contest
		local contestPath= "Contests/Contest Pack/"
		local contestData = System.ReadTable( contestPath..contestFile..".contest" )
		selectedContestants = {}
		for i,v in round.contestants do
			selectedContestants[i] = myContestants[v]
		end
		myContest = Agent.Create("Contest", nil, contestData, selectedContestants, Agent.Me())
		CreateLights()
	World.CloseAccess()
	--myKeys = Agent.Create("GlobalKeys", myWorld)
	myCountdown = Agent.Create( "VideoCountdown", world )
	--myLightManager = Agent.Create("LightManager", myWorld)
	--Config.Set("stencil_shadows", 1 ) -- Config.Get("simulation_stencil_shadows", false))
	Agent.SetTimer("Update", Agent.Me(), "timer", 0.1)
	myRecording = false
	myGoing = false
	myStopped = false
	GUI.SetText( Segment.time_text, "Simulation time: "..String.format( "%4.1f", 0 ).."0" )
	if myContestDef.score == "green" or myContestDef.score == "both" then
		GUI.SetText( Segment.green_score, "Green: 0" )
	else
		GUI.SetText( Segment.green_score, "" )
	end
	if myContestDef.score == "red" or myContestDef.score == "both" then
		GUI.SetText( Segment.red_score, "Red: 0"  )
	else
		GUI.SetText( Segment.red_score, "" )
	end
	GUI.ToFront( Segment.parent )
	--World.Pause(TestWorld)
end

function CreateLights()
	Visual.CreateShadowSource( Vector.New( 2, 10, 2 ), .2 )
	Visual.CreateLight( 0, "ambient" )
	Visual.SetLightColour( Segment.ambient, 0.3, 0.3, 0.3 )
	Visual.CreateLight( 1, "directional" )
	Visual.SetLightColour( Segment.directional, 0.7, 0.7, 0.7 )
	local trans = Matrix.New()
	Matrix.SetTranslation( trans, Vector.New( 1, 1, 0.8 ) )
	Matrix.LookAt( trans, Vector.New(0, 0, 0 ), Vector.New( 0, 1, 0 ) )
	Visual.SetLightTransform( Segment.directional, trans )
end

function TimerUpdate()
	World.OpenAccess(myWorld)
		local time = World.SimTime()
		if ( not myRecording ) and time > 1 then
			local update_rate = World.OpenVisualOutput(TMP_VIDEO_PATH.."TempSaveVideo.bmv")
			--Trace( "Update Rate %", update_rate )
			myRecording = 1
			Agent.PostMessage( "StartRecordTimer", Agent.Me(), 0.1,  update_rate)
		end
		Agent.SendMessage( "Update", myCountdown, time )
		if (not myGoing ) and time >= 4 then
			Agent.SendMessage( "Go", myContest )
			myGoing = 1
		end
		if myGoing then
			GUI.SetText( Segment.time_text, "Simulation time: "..String.format( "%4.1f", time - 4 ).."0" )
		end
	World.CloseAccess()
end

function MessageStartRecordTimer(update_rate)
	if not myStopped then --may have canceled
		Agent.SetTimer("Record", Agent.Me(), "writevis", update_rate)
	end
end

function TimerRecord()
	World.OpenAccess(myWorld)
		--Trace( "Updating" )
		World.WriteVisual()
	World.CloseAccess()
end

function MessageInstantiateContest()
	Agent.SendMessage("InstantiateAll", myContest)
end


function MessageDestroy()
	Agent.Destroy()
end


function MessageBehaviourReport(message)
	if message.scoreboard ~= nil then
		if myContestDef.score == "green" and message.scoreboard.score[1] ~= nil then
			GUI.SetText( Segment.green_score, "Green: "..message.scoreboard.score[1] )
		end
		if myContestDef.score == "red" and message.scoreboard.score[1] ~= nil then
			GUI.SetText( Segment.red_score, "Red: "..message.scoreboard.score[1] )
		end
		if myContestDef.score == "both" and message.scoreboard.score[1] ~= nil then
			if message.scoreboard.score[1] ~= nil then
				GUI.SetText( Segment.green_score, "Green: "..message.scoreboard.score[1] )
			end
			if message.scoreboard.score[2] ~= nil then
				GUI.SetText( Segment.red_score, "Red: "..message.scoreboard.score[2] )
			end
		end
	end
end

function MessageBehaviourReportOld(message)
	if message.scoreboard ~= nil then
		Scores[myRound] = {}
		for i,v in message.scoreboard.contestant do
			-- get team id from contestant id
			local teamID = myContestDef.rounds[myRound].contestants[v]
			local team = myContestDef.agents[teamID].team
	
			if Scores[myRound][teamID]  == nil then
				Scores[myRound][teamID]  = 0
			end
			Scores[myRound][teamID] = Scores[myRound][teamID] + message.scoreboard.score[i]
		end
	end
		
	if message.name == "finish" then

		local highScore = 0
		local highTeam
		for i, v in Scores[myRound] do
			if v > highScore then
				highScore =v
				highTeam = myContestDef.agents[i].team
			end
		end

		Agent.PostMessage("EndRound", Agent.Me(), 0.01)
	end
	return 

end

function MessageEndRound()
	
	myRound = myRound + 1
	if myContestDef.rounds[myRound] ~= nil then
		BeginRound()
	else
		Agent.SendMessage("EndContest", myNotify)
	end
end

