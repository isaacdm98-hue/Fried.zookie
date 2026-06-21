# ZookPassport specializes UIAgent embeds Input, Camera, Visual

constLabelHeight = 12
DEFAULT_ZOOK_OWNER_NAME = "Anonymous::ZookOwner"

function Initialize( middle, width, focus )

	screenWidth, screenHeight = GUI.Area()
	myMiddle = middle
	myWidth = width
	myFocus = focus
	
	myDistance = 5
	myYaw = 0
	myAngle = 30

	myWorld = World.Create()
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
	Camera.Create( 0,0,100,100)
	Camera.SetBackground( 1, 1, 1, 0 )
	myCurrentTab = "Hologram"
		
end
		

function Finalize()
	World.Destroy(myWorld)
	if myPropertyEdit ~= nil then
		Agent.SendMessage("Destroy", myPropertyEdit)
	end
end


function MessageDestroy()
	Agent.Destroy()
end




function MessageClear()
	MessageShow(false)
	if myPropertyEdit ~= nil then
		Agent.SendMessage("Destroy", myPropertyEdit)
		DestroyPreviewWindow()
		if Segment.close ~= nil then
			Segment.Destroy(Segment.close)
		end
		Segment.Destroy(Segment.focus)
		Segment.focus = nil
		myPropertyEdit = nil
	end
end

function MessageLoad(team, creature, creatureName, passport, image)

	myTeam = team
	myCreature = creature
	myCreatureName = creatureName
	myPassport = passport
	myImage = image
	
	MessageClear()
	LoadPreview()
	if myImage == nil then
		myImage = Agent.SendMessage("GetPassportImage", myBuilderParts)
	end
	if myPassport == nil then
		myPassport = Agent.SendMessage("Passport", myBuilderParts)
	end

	-- gui ------------------------------------------------------------------------

	
	local propertyDefs = {}
	local property = 0

	-- general
	local passport_pick_image_file = "passport_image.bmi"
	local full_path
	if team == nil then
		full_path = Config.Get("product_directory", ".")
		if myImage ~= nil and myImage.image ~= nil then
			System.WriteArchiveTable(full_path.."/"..passport_pick_image_file, "", "Image Version 1.0", myImage )
		end
	elseif team == "myZooks" then
		local photo_path = Config.Get("product", "BAMZOOKi") .. "/Teams/"..myTeam.."/Creatures/"..myCreature.."/".."PhotoAlbum"
		full_path = System.CreateHomeDirectory(photo_path)
		if System.IsValidPath(full_path.."/"..passport_pick_image_file) == false and myImage ~= nil then
			if myImage ~= nil and myImage.image ~= nil then
				System.WriteArchiveTable(full_path.."/"..passport_pick_image_file, "", "Image Version 1.0", myImage )
			end
		elseif System.IsValidPath(full_path.."/"..passport_pick_image_file) == 1 and myImage == nil then
			System.DeleteFile(full_path.."/"..passport_pick_image_file)
		end
	else
		--full_path = System.GetLabeledPath("ROOT").."/Teams/"..myTeam.."/Creatures/"..myCreature.."/".."PhotoAlbum"
		full_path = Config.Get("product_directory", ".")
		if myImage ~= nil and myImage.image ~= nil then
			System.WriteArchiveTable(full_path.."/"..passport_pick_image_file, "", "Image Version 1.0", myImage )
		end
	end
	
	local ownership = FindChildOfType( myPassport, "ownership" )
	local owner = ownership.children[getn(ownership.children)]
	local zookname = ""
	local ownername = ""
	local adoption_date = ""
	local notes = ""
	if owner ~= nil then
		zookname = owner.zookname
		ownername = owner.username
		adoption_date = owner.adoption_date
		notes = owner.notes
	end
	--propertyDefs[property+1] = { name = "pick_image", label = "Photo", tab = "General", texturesize = 38*2, displayedrows = 1, path = full_path, filespec = passport_pick_image_file, noslider = 1 }		
	if myImage ~= nil and myImage.image ~= nil then
		propertyDefs[property+1] = { name = "pick_image", label = "Photo", tab = "General", texturesize = 200, displayedrows = 1, path = full_path, filespec = passport_pick_image_file, noslider = 1 }		
	else
		propertyDefs[property+1] = { name = "pick_image", label = "", tab = "General", texturesize = 200, displayedrows = 0, path = full_path, filespec = passport_pick_image_file, noslider = 1 }
	end
	propertyDefs[property+2] = { name = "zookname", label = "Name", tab = "General", text = zookname }
	if  ownername == DEFAULT_ZOOK_OWNER_NAME then
		ownername = "You"
	end
	propertyDefs[property+3] = { name = "ownername", label = "Owner", tab = "General", text = ownername }
	propertyDefs[property+4] = { name = "date_adpoted", label = "Adopted/Born", tab = "General", text = adoption_date }
	--propertyDefs[property+4] = { name = "notes", label = "Notes", tab = "General", text = owner.notes }
	property = property + 4

	-- hologram
	propertyDefs[property+1] = { name = "hologram", label = "", tab = "Hologram", text = "" }
	property = property + 1

	-- owners
	myTotOwners = 1
	for i,v in ownership.children do
		myTotOwners = myTotOwners + 1
	end
	local owners = {}
	local ownersUIDs = {}
	for i,v in ownership.children do
		local name =  v.username
		if  name == DEFAULT_ZOOK_OWNER_NAME then
			name = "You"
		end
		owners[myTotOwners-i] = name
		ownersUIDs[v.uid] = name
	end
	myCurrentOwnersDisplay = myTotOwners - 1
	propertyDefs[property+1] = { name = "owners", label = "Owner", tab = "History", list = owners, report_index = 1, default = owners, height = 160 }
	propertyDefs[property+2] = { name = "owners_zookname", label = "Zook Name", tab = "History", text = "" }
	propertyDefs[property+3] = { name = "owners_date_adpoted", label = "Adopted/Born", tab = "History", text = "" }
	propertyDefs[property+4] = { name = "owners_mods", label = "Modifications", tab = "History", text = "" }
	--propertyDefs[property+5] = { name = "owners_notes", label = "Notes", tab = "History", text = "" }
	property = property + 4
	
	local categories = {}
	local totalCategories = 0
	local achivement = {}
	local totalAchivement = 0
	local details = FindChildOfType( myPassport, "details" )
	for i,node in details.children do
		local owner = ""
		if node.owner_uid ~= nil then
			owner = " (" ..ownersUIDs[node.owner_uid] .. ")"
		end
		if  node.category == "Achievement" then
			totalAchivement = totalAchivement + 1
			achivement[totalAchivement] = node.name .. ": " ..  node.data .." "..node.comment.. owner
		else
			property = property + 1
			propertyDefs[property] = { name =  "detail_" .. node.name,		
						label = node.name,
						tab = node.category,
						text = node.data .." "..node.comment.. owner }
		
			local foundCat = false
			for i,v in categories do
				if node.category == v then
					foundCat = 1
					break
				end
			end
			if foundCat == false then
				totalCategories= totalCategories +1
				categories[totalCategories] = node.category
			end
		end
	end
	property = property + 1
	for index, value in achivement do
		for i, v in achivement do
			if achivement[i+1] ~= nil then
				if String.Compare(achivement[i], achivement[i+1]) > 0 then
					local temp = achivement[i]
					achivement[i] = achivement[i+1]
					achivement[i+1] = temp
				end
			end
		end
	end
	propertyDefs[property] = { name = "achievement", label = "Achievement", height = 330, tab = "Achievement", list = achivement, default = achivement }
	
	
	myModifications = Agent.SendMessage("GetModifierCounts", myBuilderParts)
	
	-- add fillers so bigger for hologram size
	--~ propertyDefs[property+1] = { name = "dummy", label = "", tab = tabName, text = "" }
	--~ propertyDefs[property+2] = { name = "dummy", label = "", tab = tabName, text = "" }
	--~ propertyDefs[property+3] = { name = "dummy", label = "", tab = tabName, text = "" }
	--~ propertyDefs[property+4] = { name = "dummy", label = "", tab = tabName, text = "" }
	--~ property = property + 4

	local backingMarg = 8
	local header = 40
	local width = myWidth-(backingMarg*2)
	local centre = myMiddle
	if myMiddle == nil then
		centre = (screenWidth/2)
	end
	local left = centre-(width/2)
	local right = centre+(width/2)
	local height, tabName = CalcHeight(propertyDefs)
	local top = (screenHeight/2)-(height/2)- backingMarg
	local bottom = top+height+24
	
	local focus = GUI.CreateObject( "focus", 0, 0, screenWidth, screenHeight, myFocus )
	AddPanel(  left-backingMarg, top-header, right+backingMarg, bottom+backingMarg, 1, 1, 1, 1, Segment.focus,Segment.focus)
	GUI.SetParent(Segment.focus)
	GUI.CreateText("label", "Zook Passport", centre-100, top-header+2, centre-100, top-header+backingMarg, "Fonts/Arial-32.met" )
	GUI.SetColour( Segment.label, 0, 0, 0, 1 )
	
	myPropertyEdit = Agent.Create( "PropertyEdit", left, top, right, Agent.Me(), "PropertyEdit", {top_round = 1, align_topleft = 1}, propertyDefs )
	Agent.SendMessage("UpdateAll", myPropertyEdit)

	
	if myFocus == 1 then
		AddPanelButton( "close", "Close", right-48, top+height+10, right-6, top+height+30, Segment.focus)
	end
	
	
	local marg = 16
	CreatePreviewWindow( centre-(width/2)+marg, top+32,  centre+(width/2)-marg, bottom-32 )
	
	Camera.ToFront()
	myCurrentTab = "General"
	MessageShow(1)
	
	GUI.SetParent()
	
end


function MessageGetTab()
	return myCurrentTab
end

function MessageSetTab(tab)
	if myPropertyEdit ~= nil then
		Agent.SendMessage("ShowTab", myPropertyEdit, tab)
	end
end


function MessageShow(s)
	ShowPreview(s)
	if Segment.focus ~= nil then
		GUI.Show(Segment.focus, s)
	end
	if myPropertyEdit ~= nil then
		Agent.SendMessage("Show", myPropertyEdit, s)
	end
--	if s ~= false then
--		Input.SetFocus()
--	else
--		Input.ReleaseFocus()
--	end
end


function ShowPreview(s)
	if myCurrentTab ==  "Hologram" and s ~= false then
		s = 1
	else
		s = false
	end
	
	--~ if Segment.tv ~= nil then
		--~ GUI.Show(Segment.tv, s)
	--~ end
	Camera.Show(s)
end


function CreatePreviewWindow( left, top, right, bottom )

	local marg = 8
	local x1, y1, x2, y2 = left+marg, top+marg, right-marg, bottom-marg
	Camera.Resize(x1, y1, x2, y2)

	local aspect = (x2-x1)/(y2-y1)
	local verticalViewAngle = 67
	local horizontalViewAngle = 2 * Number.atan( aspect * Number.tan( verticalViewAngle / 2.0 ) )
	Camera.SetViewAngles( horizontalViewAngle, verticalViewAngle )

	--GUI.CreateBorder( "tv",  left, top, right, bottom, 64, 0, 128,64, 1 )
	--GUI.SetColour( Segment.tv, PanelColour() )

end


function DestroyPreviewWindow()
	--Segment.Destroy(Segment.tv)
	--Segment.tv = nil
end


function LoadPreview()
	SetTeamsDirectory()
	SetVersion()
	if theTeams ~= nil and myTeam ~= nil and myCreature ~= nil and myVersion ~= nil then
		-- load from given team path
		Agent.SendMessage( "Load", myBuilderParts, theTeams..myTeam.."/Creatures/"..myCreature.."/"..myVersion..".zook",
			theTeams..myTeam.."/Textures", myCreatureName, false )
	elseif myTeam == nil and myCreature ~= nil then
		-- presume creature is full path from app data
		local fullPath = Config.Get("product_directory", ".").."/"..myCreature
		local texturePath = System.GetLabeledPath("ROOT").."/NewTeam/Textures"
		Agent.SendMessage( "Load", myBuilderParts, fullPath, texturePath, myCreatureName, false )
	else 
		System.Throw("Zook does not exist - Team:%, Zook:%", myTeam, myCreature)
	end
	
end


function MessageGetDetails( team, creature )
	myTeam = team
	myCreature = creature
	SetTeamsDirectory()
	SetVersion()

	Agent.SendMessage("LoadDontExpress", myBuilderParts,
		theTeams..myTeam.."/Creatures/"..myCreature.."/"..myVersion..".zook",
		theTeams..myTeam.."/Textures", myCreature, false )
	
	local details, version = Agent.SendMessage("GetDetails", myBuilderParts)
	
	return details, version
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



-- ripped out of property edit agent
function  CalcHeight(parameters)
	local yTab = {}
	for index, value in parameters do
		if value.tab == nil then
			value.tab = "General"
		end
		if yTab[ value.tab ] == nil then
			yTab[ value.tab ] = 32
		end
		yTab[ value.tab ] = yTab[ value.tab ] + FieldHeight( parameters, index )
		if value.label ~= nil then
			yTab[ value.tab ] = yTab[ value.tab ] + constLabelHeight
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
	return height, tabName
end


-- ripped out of property edit agent
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
		return 14
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


function GetModString(node)
	if node == nil then
		return "None"
	end
	mods = ""
	-- Stats not working correctly. Fix for next release.
	if node.CREATIVE_MOD ~= nil then
		--~ name = "Created " .. node.CREATIVE_MOD .. "%, "
		name = "Creation, "
		mods = mods .. name 
	end
	if node.PHYSICAL_MOD ~= nil then
		--~ name = "Physical " .. node.PHYSICAL_MOD .. "%, "
		name = "Physical, "
		mods = mods .. name 
	end
	if node.DYNAMIC_MOD ~= nil then
		--~ name = "Movement " .. node.DYNAMIC_MOD .. "%, "
		name = "Movement, "
		mods = mods .. name 
	end
	if node.COSMETIC_MOD ~= nil then
		--~ name = "Cosmetic " .. node.COSMETIC_MOD .. "%, "
		name = "Cosmetic, "
		mods = mods .. name 
	end	
	if String.strlen(mods) > 0 then
		mods = String.strsub(mods, 1, String.strlen(mods)-2)
	end
	return mods
end	



function FindChildOfType( node, type )
	for index, value in node.children do
		if value.element_type == type then
			return value
		end
	end
	return nil
end
	


-- MESSAGE DISPATCHER ----------------------------------------------------------------------------------------------------------------------------

function MessagePropertyEditTabChange( value )

	myCurrentTab =  value
	ShowPreview()
	
end


function SystemUIChange( segment )
	if segment == Segment.close then
		MessageShow(false)
	else
		Agent.SendMessage("UIForward", myPropertyEdit, segment)
	end
end


function MessagePropertyEditNotify( field, value )
	if field == "owners" then
		myCurrentOwnersDisplay = myTotOwners - value
		--~ local ownership = FindChildOfType( myPassport, "ownership" )
		--~ for i,v in ownership.children do
			--~ if v.username == value or (v.username == DEFAULT_ZOOK_OWNER_NAME and value == "You")then
				--~ myCurrentOwnersDisplay = i
			--~ end
		--~ end
	end
end

function MessagePropertyEditGet( field )
	local ownership = FindChildOfType( myPassport, "ownership" )
	--Trace( "Current owner: %", myCurrentOwnersDisplay )
	local owner = ownership.children[myCurrentOwnersDisplay]
	if owner == nil then
		return nil
	end
	
	if field == "owners_zookname" then
		return owner.zookname
	elseif field == "owners_date_adpoted" then
		return owner.adoption_date
	elseif field == "owners_mods" then
		--local modifications = FindChildOfType( owner, "modifications" )
		for i, v in myModifications do
			if v.owner_uid == owner.uid then
				return GetModString(v)
			end
		end
		return "No modification information"
	elseif field == "owners_notes" then
		return owner.notes
	end
end
	
-- FILING -------------------------------------------------------------------------------------------------------------------------------------------

function MessageVersion()
	return myVersion, myMaxVersion
end

function SetTeamsDirectory()
	if myTeam == "myZooks" then
		theTeams = Config.Get("default_teams_directory", "") 
	else	--if myTeam == "examples" then
		-- examples
		theTeams = System.GetLabeledPath("ROOT").."/Teams/"
	--else
	--	theTeams = Config.Get("product_directory", "").."/Temp"
	end
end


function SetVersion()
	if myCreature ~= nil and myTeam ~= nil then
		local versions = GetVersions()
		myVersion = versions[1]
	else
		myVersion = nil
	end
	if myVersion == nil then
		myVersion = "1.0"
	end
end


function GetVersions()
	local versions = {}
	if myTeam ~= nil and myTeam ~= "" and myCreature ~= nil and myCreature ~= "" then
		versions = System.GetDirectoryContents( theTeams..myTeam.."/Creatures/"..myCreature,"*.zook", 1)
	
		myMaxVersion = 1
		for index, value in versions do
			versions[index] = String.gsub( value, "%.zook", "" )
			if tonumber( versions[index] ) > myMaxVersion then
				myMaxVersion = tonumber( versions[index] )
			end
		end

		if myTeam == "examples" then
			sort( versions, OldestVersionComparison )
		else
			sort( versions, NewestVersionComparison )
		end
	end
	return versions
end


function NewestVersionComparison( l, r )
	return tonumber( l ) > tonumber( r ) 
end

function OldestVersionComparison( l, r )
	return tonumber( l ) < tonumber( r ) 
end


function Find(table, key)
	for i,v in table do
		if v == key then
			return key
		end
	end
	return nil
end

	