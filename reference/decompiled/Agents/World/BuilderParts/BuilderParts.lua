# BuilderParts specializes Agent embeds Visual, Genome, Karma

-- modifuctation types
COSMETIC_MOD = "COSMETIC_MOD"
PHYSICAL_MOD = "PHYSICAL_MOD"
DYNAMIC_MOD = "DYNAMIC_MOD"
CREATIVE_MOD = "CREATIVE_MOD"

function Initialize( pos, ownerName)
	
	-- user details
	DEFAULT_ZOOK_OWNER_NAME = "Anonymous::ZookOwner"
	ZOOK_OWNER_NAME = ownerName
	if ZOOK_OWNER_NAME == nil then
		ZOOK_OWNER_NAME = DEFAULT_ZOOK_OWNER_NAME
	end
	
	myNewCreatureFlag = false
	
	myParts = {}
	mySegments = {}
	myNextBodyPart = 1
	myRootPosition = pos
	myRootRotation = Quatn.New()
	myIntersectionVector = Vector.New(0,0,100)
	myGenomeName = ""
	myHistory = {}
	myHistoryCount = 0
	myHistoryCurrent = 0

	myExpressedCreature = nil
	myHues = { {1,1,1}, {1,0,0}, {1,1,0}, {0,1,0}, {0,1,1}, {0,0,1}, {1,0,1}, {1,0,0} }

	--GetNewPart( 0, Vector.New(), Vector.New(1,1,1) )
	myAttributeGroups =
	{
		{
			name = "Shape", pane = 1, attributes = {
				--~ { name = "scalex", label = "Width", top = 1, icon = "WidthObj", default = 1, min = .1, max = 3, scale = 4 },
				--~ { name = "scaley", label = "Height", icon = "HeightObj", default = 1, min = .1, max = 3, scale = 4 },
				--~ { name = "scalez", label = "Length", bottom = 1, icon = "DepthObj",  default = 1, min = .1, max = 3, scale = 4 },
				{ name = "scalex", label = "Width", top = 1, icon = "WidthObj", default = 1, min = .1, max = 3, scale = 4 },
				{ name = "scaley", label = "Height", icon = "HeightObj", default = 1, min = .1, max = 3, scale = 4 },
				{ name = "scalez", label = "Length", bottom = 1, icon = "DepthObj",  default = 1, min = .1, max = 3, scale = 4 },
				{ name = "bias", label = "Pointiness",  top = 1, icon = "PinchObj", default = 0.5, min = 0, max = 1 },
				{ name = "flatness", label = "Flatten End", icon = "RelaxObj", default = 0.0, min = 0, max = 1 },
				{ name = "asymmetry", label = "Flatten Side", icon = "Asymmetry", default = 0.0, min = 0, max = 1 },
				{ name = "cubosity", label = "Squareness", bottom = 1, icon = "CubeObj", default = 0.0, min = 0, max = 1 }
			}
		},
		{
			name = "Position", pane = 1, attributes = {
				{ name = "theta", label = "\128 Up/Down", icon ="Elevation", top = 1, default = 0, min = -90, max = 90 } ,
				{ name = "phi", label = "\128 Left/Right", icon = "Position", bottom = 1, default = 0, min = -180, max = 180 }, 
				{ name = "roll", label = "Twist", icon = "Twist", top = 1, default = 0, min = -180, max = 180  },
				{ name = "pitch", label = "\127 Up/Down", icon = "UpDown", default = 0, min = -180, max = 180  },
				{ name = "yaw", label = "\127 Left/Right", icon = "LeftRight", bottom = 1, default = 0, min = -180, max = 180  }
			}
		},
		{
			name = "Joint", pane = 2, attributes = {
				{ name = "leg_type", label = "Movement Type", top = 1, default = "0", button_enum = { {"0", "IkX", "No movement"} , {"1", "Ik1", "Single part movement" }, {"2", "Ik2", "Two part movement" } }  },
				{ name = "ik_side", label = "Movement Type", icon = "IKLimbControl", bottom = 1, default = "Auto", enum = {"Auto", "Left side", "Right side", "Always"}  },
				{ name = "leg_phase", label = "Movement Cycle", icon = "Phase", top = 1, default = 0, min = 0, max = 1  },
				{ name = "spine", label = "Part Targeting", icon = "IKSpineControl", bottom = 1, default = "Off",  enum = {"Normal", "Inverted", "Off"} }	
			}
		},
		{
			name = "Master IK Control", pane = 2, attributes = {
				{ name = "zook_speed", label = "Cycle Speed", icon = "FrequenceyIK", top = 1, default = 0.5,  min = 0, max = 1 } ,	
				{ name = "turn_sharpness", label = "Turn Sharpness", icon = "TurnAmp", default = 0.25,  min = 0, max = 1 },
				{ name = "turn_smoothness", label = "Turning Smoothness", icon = "Angle2TargIK", default = 0.5,  min = 0, max = 1 } ,
				{ name = "max_spine_angle", label = "Part Targeting Angle", bottom = 1,icon = "Angle2ObjIK", default = 45,  min = 0, max = 90 } 
			}
		},
		{
			name = "Colour", pane = 3, attributes = {
				--~ { name = "colourPick", label = "Team Colour", top = 1, default = "Custom",  enum = {"Custom", "Red", "Blue"} } ,	
				--~ { name = "colour", label = "Colour", top = 1, default = 0.0,  min = 0, max = 1 } ,	
				{ name = "brightness", label = "Brightness", icon = "Brightness", bottom = 1, default = 1.0,  min = 0, max = 1 },
				{ name = "colour", label = "Colour", red = "colour_red", green = "colour_green", blue = "colour_blue" },
				{ name = "texture", label = "Texture", texturesize = 38, displayedrows = 6, filespec = "*.bmp", bottom = 1 }
			}
		}
	}


	myRequiredAttributes = {
		{name = "name", label = "Name", default = "",  enum = {} },
		{name = "mesh", label = "Mesh", default = "Blob", enum = {
			"Cube",
			"Sphere",
			"Blob",
			} },
		{ name = "scalex", label = "Width", default = 1, min = .1, max = 3 },
		{ name = "scaley", label = "Height", default = 1, min = .1, max = 3 },
		{ name = "scalez", label = "Length",  default = 1, min = .1, max = 3 },
		{ name = "theta", label = "Elevation", default = 0, min = -90, max = 90 } ,
		{ name = "phi", label = "Position", default = 0, min = -180, max = 180 }, 
		{ name = "roll", label = "Twist", default = 0, min = -180, max = 180  },
		{ name = "pitch", label = "Up/Down", default = 0, min = -180, max = 180  },
		{ name = "yaw", label = "Left/Right", default = 0, min = -180, max = 180  },
		{ name = "bias", label = "Blob shape", default = 0.5, min = 0, max = 1 },
		{ name = "flatness", label = "Blob shape 2", default = 0.0, min = 0, max = 1 },
		{ name = "asymmetry", label = "Asymmetry", default = 0.0, min = 0, max = 1 },
		{ name = "cubosity", label = "Cubosity", default = 0.0, min = 0, max = 1 },
		{ name = "muscle_damping", label = "Damping", default = 1000, min = 1, max = 10000  },
		{ name = "muscle_stiffness", label = "Stiffness", default = 1000, min = 1, max = 10000  },
		{ name = "leg_phase", label = "Phase", default = 0, min = 0, max = 1  },
		{ name = "max_spine_angle", label = "Max Angle", default = 30,  min = 0, max = 90 } ,	
		{ name = "min_spine_target_angle", label = "Target Angle", default = 180,  min = 0, max = 180 },
		{ name = "colour", label = "Colour", default = 0,  min = 0, max = 1, number = 1 },
		{ name = "colour_red", label = "Red", default = 1,  min = 0, max = 1, number = 1 },
		{ name = "colour_green", label = "Green", default = 1,  min = 0, max = 1, number = 1 },
		{ name = "colour_blue", label = "Blue", default = 1,  min = 0, max = 1, number = 1 },
		{ name = "brightness", label = "Brightness", default = 1,  min = 0, max = 1, number = 1 },
		{ name = "texture", label = "Texture", default = "bare", enum = {}  } }

	myScalingVectors = {
		Vector.New( 1, 0, 0 ),
		Vector.New( 0, 1, 0 ),
		Vector.New( 0, 0, 1 ),
		Vector.New( -1, 0, 0 ),
		Vector.New( 0, -1, 0 ),
		Vector.New( 0, 0, -1 )
		}

	--Visual.Create("selector", "UnitCube_BB", Vector.New(0,0,0), Quatn.New(), Vector.New(1, 1, 1), 1, 1)
	--local mesh = { vertices = { Vector.New( -.5, -.5, -.5 ), Vector.New( -.5, -.5, .5 ), Vector.New( .5, -.5, .5 ), Vector.New( .5, -.5, -.5 ), 
	--	Vector.New( -.5, .5, -.5 ), Vector.New( -.5, .5, .5 ), Vector.New( .5, .5, .5 ), Vector.New( .5, .5, -.5 ) },
	--	indices = { 0,1,0, 1,2,1, 2,3,2, 3,0,3, 0,4,0, 1,5,1, 2,6,2, 3,7,3, 4,5,4, 5,6,5, 6,7,6, 7,4,7 }
	--	}
	--Visual.Create("selector", mesh, Vector.New(0,0,0), Quatn.New(), Vector.New(1, 1, 1), 1, 1)
	--Visual.Create("selector", "Scale", Vector.New(-500, -500, -500 ), Quatn.New(), Vector.New(1.05, 1.05, 1.05), 1)
	Visual.Create("selector", 1, Vector.New(-500, -500, -500 ), Quatn.New(), Vector.New(1.05, 1.05, 1.05), 1)
	Visual.SetVisible( Segment.selector, false )
	Visual.SetColour( Segment.selector, 1, 0, 0, 0.2 )
	Visual.SetTransparent( Segment.selector, 1 )
	myStrobeColour = 0
	myStrobeBlue = 0
	
	Visual.CreateLines( "ik_path" )
end


function MessageDestroy()
	Agent.Destroy()
end


function MessageModify()
	myHistoryCurrent = myHistoryCurrent + 1
	myHistoryCount = myHistoryCurrent
	myHistory[ myHistoryCurrent ] = Clone( myHistory[ myHistoryCurrent - 1 ] )

	myGenomeTable = myHistory[ myHistoryCurrent ]
	myRootNode = FindFirstDescendantOfType( myGenomeTable, "bodysolid" )
	UpdateParts( myRootNode )
end

function UpdateNosePosition()
	local xMin, yMin, zMin, xMax, yMax, zMax = MessageBoundingBox()
	local rootPosition = myRootPosition
	local rootRotation = myRootRotation
	myRootPosition = Vector.New(0,0,0)
	myRootRotation = Quatn.New()
	UpdatePositions( myRootNode, false )
	xMin, yMin, zMin, xMax, yMax, zMax = MessageBoundingBox()
	myRootRotation = rootRotation
	myRootPosition = rootPosition - Vector.New( 0, yMin, zMin ) * rootRotation
	UpdatePositions( myRootNode, false )
end

function MessageSetNoseBottomPosition( pos )
	local rootRotation = myRootRotation
	myRootRotation = Quatn.New()
	myRootPosition = Vector.New(0,0,0)
	UpdatePositions( myRootNode, false )
	local xMin, yMin, zMin, xMax, yMax, zMax = MessageBoundingBox()
	myRootRotation = rootRotation
	myRootPosition = pos - Vector.New( 0, yMin, zMin ) * rootRotation
	UpdatePositions( myRootNode, false )
end

function MessageSetRootPosition( pos )
	myRootPosition = pos
	UpdatePositions( myRootNode, false )
end

function MessageSetRootRotation( rot )
	local xMin, yMin, zMin, xMax, yMax, zMax = MessageBoundingBox()
	local x, y, z = Vector.GetXYZ( myRootPosition )
	local nosePos = myRootPosition + Vector.New( 0, yMin-y, zMin-z ) * myRootRotation
	myRootRotation = rot
	UpdatePositions( myRootNode, false )
	MessageSetNoseBottomPosition(nosePos)
end

function MessageSetContestStart( pos, rot )
	myRootRotation = Quatn.New()
	myRootPosition = Vector.New(0,0,0)
	UpdatePositions( myRootNode, false )
	local xMin, yMin, zMin, xMax, yMax, zMax = MessageBoundingBox()
	myRootRotation = rot
	myRootPosition = pos - Vector.New( 0, yMin, zMin ) * rot
	UpdatePositions( myRootNode, false )
end

function MessageUndo()
	if myHistoryCurrent > 2 then
		myHistoryCurrent = myHistoryCurrent - 1
		myHistory[ myHistoryCurrent ] = Clone( myHistory[ myHistoryCurrent-1 ] )

		myGenomeTable = myHistory[ myHistoryCurrent ]
		myRootNode = FindFirstDescendantOfType( myGenomeTable, "bodysolid" )
		MessageClear()
		CreateVisuals( myRootNode )
		UpdatePositions( myRootNode, false )
	end
end

function MessageRedo()
	if myHistoryCurrent < myHistoryCount then
		myHistoryCurrent = myHistoryCurrent + 1
		myHistory[ myHistoryCurrent - 1] = Clone( myHistory[ myHistoryCurrent] )

		myGenomeTable = myHistory[ myHistoryCurrent ]
		myRootNode = FindFirstDescendantOfType( myGenomeTable, "bodysolid" )
		MessageClear()
		CreateVisuals( myRootNode )
		UpdatePositions( myRootNode, false )
	end
end

function MessageCanUndo()
	return myHistoryCurrent > 2
end

function MessageCanRedo()
	return myHistoryCurrent < myHistoryCount
end

-- FILING ---------------------------------------------------------------------------------------------------------------------------------------------

function MessageExpress( fixed, position, dontStart )
	if myStartCallback ~= nil then
		Agent.SendMessage( "Destroy", myStartCallback )
		myStartCallback = nil
	end

	Genome.SetFromTable( myGenomeTable )
--	Genome.Express( myRootPosition, Quatn.New(), Vector.New( 1, 1, 1 ) )
	--Genome.( "Agents/World/Evo/temptemptemp.zook" )
	if myExpressedCreature ~= nil then
		Agent.SendMessage("Destroy", myExpressedCreature)
	end
	Config.Set( "evo_script",  myGenomeName )
	--myExpressedCreature = Agent.Create("Evo", myRootPosition, Quatn.New(), "temptemptemp.zook", 0,0) -- ,1) for boxes
	--myExpressedCreature = Agent.Create("Evo", myRootPosition, Quatn.New(), myGenomeName, 0,0, fixed) -- ,1) for boxes
	--myExpressedCreature = Agent.Create("Evo", myRootPosition + Vector.New( 6, -2, 6), Quatn.New(), myGenomeName, 0,0, fixed) -- ,1) for boxes
	--myExpressedCreature = Agent.Create("Evo", myRootPosition, Quatn.New(), myGenomeName, 0,0, fixed) -- ,1) for boxes
	local pos = position --Clone( myRootPosition )
	if not fixed then
		local minx, miny, minz, maxx, maxy, maxz = MessageBoundingBox()
		pos = pos + Vector.New( 0, Vector.GetY(myRootPosition) -miny, 0 )
	else
		pos = pos + Vector.New( 0, 30, 0 )
	end
	--local texturePath = String.strsub( myGenomeName, 1, String.strfind( myGenomeName, "Creatures" )-1 ).."Textures"
	local texturePath = myTextureDirectory
	Config.Set("texture_path", texturePath)
	local tempFile = Config.Get("product_directory", ".").."/tempExpressed.zook"
	SaveGenome( tempFile )
	myExpressedCreature = Agent.Create("Evo", pos, Quatn.New(), tempFile, 2,0, fixed) -- ,1) for boxes
	Agent.SendMessage( "SmoothStop", myExpressedCreature )
	if not dontStart then
		myStartCallback = Agent.Create( "DelayedCallback", Agent.Me(), "StartCreature", 1 )
		--Agent.PostMessage( "StartCreature", Agent.Me(), 1 )
	end
	Config.Set( "evo_script",  "" )
end

function MessageStartCreature()
	Agent.SendMessage( "SmoothStart", myExpressedCreature )
	myStartCallback = nil
end

function MessageGetExpressedCreature()
	return myExpressedCreature
end

function MessageSave(filename)
	myGenomeName = filename
	Genome.SetFromTable( myGenomeTable )
	SaveGenome( filename )
	--System.WriteTable( filename..".tab", myGenomeTable )
end


function MessageExport(filename)
	Genome.SetFromTable( myGenomeTable )
	SaveGenome( filename )
end

function SaveGenome(filename)
	if (System.UsingEncryption() == 1 or Config.Get("genome_force_save_archive", false) == 1) and Config.Get("genome_current_version", 1) > 1 then
		-- external above version 1 genome
		Genome.SaveArchived(filename, Config.Get("genome_rhesus_macaque", ""), Config.Get("genome_archive_header", ""))
	else
		-- in house use or version 1 application (unarchived)
		Genome.Save(filename)
	end
end

function MessageVersion( teams, team, creature, version )
	local filename = teams..team.."/Creatures/"..creature.."/"..version..".zook"
	local data = Genome.LoadDirectToTable(filename, Config.Get("genome_rhesus_macaque", ""))
	local file_version = tonumber(data.version)
	if System.IsArchive(filename) == false and System.UsingEncryption() == 1 and file_version > 1 then
		-- cant have nonarchive file > version 1 unless inhouse
		return false
	elseif System.IsArchive(filename) == 1 and file_version == 1 then
		-- cant have version encrypted
		return false
	end
		
	return file_version
end

function MessageLoadingNewCreature()
	-- flag that i am about to load a new creature 
	myNewCreatureFlag = 1
end

function MessageLoad( filename, textureDirectory, zookName, update )
	
	MessageLoadDontExpress( filename, textureDirectory, zookName, update )
	
	--express
	myNextMirrorGroup = 1
	FindNextMirrorGroup( myRootNode )
	AssignEmptyMirrorGroups( myRootNode )
	CreateVisuals( myRootNode )
	UpdatePositions( myRootNode, false )
	
	return MessageValidate()
	
end

function MessageLoadDontExpress( filename, textureDirectory, zookName, update )
	
	myZookName = zookName

	
	MessageClear()
	myGenomeName = filename
	myTextureDirectory = textureDirectory
	Genome.Load( filename, Config.Get("genome_rhesus_macaque", "") )
	myGenomeTable = Genome.GetAsTable()
	UpgradeGenomeVersion(filename)
	if update == 1 then
		UpdateOwnerDetails()
	end
	myHistory[ 1 ] = Clone( myGenomeTable )
	myHistory[ 2 ] = Clone( myGenomeTable )
	myGenomeTable = myHistory[ 2 ] 
	myRootNode = FindFirstDescendantOfType( myGenomeTable, "bodysolid" ) 
	myHistoryCurrent = 2
	myHistoryCount = 2
	
	if myNewCreatureFlag == 1 then
		-- must force save, new creatures are copied from a version 1 genome and updated to version 2, 
		-- if not saved as version 2 genome now they will be load as a version 1 next time and presumed
		-- to be a stray cos there is no flag to say otherwise
		RecordModification(myRootNode, "add")		
		Genome.SetFromTable( myGenomeTable )
		SaveGenome(filename)	
		myNewCreatureFlag = false 	--unset flag
	end
	
	

	
end

function MessageSetOwnershipDetails(details)
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local ownership = FindChildOfType( passport, "ownership" )
	ownership.children = {}
	ownership.children[1] = details
	ownership.children[1].uid = GenerateUID(8)
end

function UpgradeGenomeVersion(filename)
	
	local current = Config.Get("genome_current_version", 1)
	local genomeVersion = tonumber(myGenomeTable.version)
	if genomeVersion == nil then
		return
	end
	if genomeVersion ~= current then
				
		if current >= 2 and genomeVersion < 2 then
			-- add version 2 data
			local passport = InsertChild(myGenomeTable, 1, "passport")
			
			-- owner
			AddChild(passport, "ownership")
			
			if myNewCreatureFlag ~= 1 then
				--if not a nw creature must be a stray
				local stray = AddPassportOwnerNode("CBBC::STRAY")
				stray.notes = "There is no information about the zook before its adoption at which time it was a stray."
			end
			
			--details (stats, achievements etc)
			AddChild(passport, "details")
			
			-- photo album (first photo is the passport photo
			InsertChild(myGenomeTable, 2, "photo_album")
			
		end
		
		-- keep as latest version
		myGenomeTable.version = tostring(current)
		Genome.SetFromTable( myGenomeTable )
		if myNewCreatureFlag ~= 1 then
			myRootNode = FindFirstDescendantOfType( myGenomeTable, "bodysolid" ) -- requires setting for upgrade
			myNextMirrorGroup = 1
			FindNextMirrorGroup( myRootNode )
			AssignEmptyMirrorGroups( myRootNode )
			CreateVisuals( myRootNode )
			UpdatePositions( myRootNode, false )
			MessageSetPhysicalProperties()
			MessageClear()
		end
		
		
	end
end



function MessageClear()
	for index, value in myParts do
		Segment.Destroy( value.segment )
	end
	myParts = {}
	myNextBodyPart = 1
end


function MessageGetTable()
	return myGenomeTable
end

function MessageSetTable( table )
		myGenomeTable = table
		myRootNode = FindFirstDescendantOfType( myGenomeTable, "bodysolid" )
		MessageClear()
		myNextMirrorGroup = 1
		FindNextMirrorGroup( myRootNode )
		AssignEmptyMirrorGroups( myRootNode )
		CreateVisuals( myRootNode )
		UpdatePositions( myRootNode, false )
end

-- PASSPORT  ----------------------------------------------------------------------------------------------------------

function MessagePassport()
	local passport = FindChildOfType( myGenomeTable, "passport" )
	return passport
end

function AddPassportOwnerNode(username)
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local ownership = FindChildOfType( passport, "ownership" )
	local owner = AddChild( ownership, "owner" ) 
	owner.username = username
	owner.uid = GenerateUID(8)
	Trace( "Zookname: %", myZookName )
	owner.zookname = myZookName
	owner.adoption_date = System.GMDateTimeString() .. " (GMT)"
	owner.notes = ""
	return owner
end

function GetCurrentOwner()
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local ownership = FindChildOfType( passport, "ownership" )
	local ownerNumber = getn(ownership.children)
	return ownership.children[ownerNumber] -- should always have one owner
end

function MessageAddMoniker()
	GetCurrentOwner().moniker = GenerateUID(16)
end

function MessageSetName(name)
	myZookName = name
	GetCurrentOwner().zookname = name
end


function GenerateUID(noDigits)
	local uid = ""
	for a = 1, noDigits do
		uid = uid .. GenerateHexDigit()
	end
	return uid
end
	
	
function GenerateHexDigit()
	local number = Number.floor(Number.random()*16)
	local string = tostring(number)
	if number == 10 then
		string = "A"
	elseif number == 11 then
		string = "B"
	elseif number == 12 then
		string = "C"
	elseif number == 13 then
		string = "D"
	elseif number == 14 then
		string = "E"
	elseif number >= 15 then
		string = "F"
	end
	return string
end


function MessageUpdateOwnerDetails( owner )
	ZOOK_OWNER_NAME = owner
	UpdateOwnerDetails()
end

function UpdateOwnerDetails()
	if myGenomeTable.version == nil or tonumber(myGenomeTable.version) == 1 then
		-- not applicable to version 1
		return
	end
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local ownership = FindChildOfType( passport, "ownership" )
	local ownerNumber = getn(ownership.children)
	local owner = ownership.children[ownerNumber] -- should always have one owner
	
	-- if last owner is not default (not user set yet so is you) and not current user then take ownership of this zook
	if owner == nil or (owner.username ~= DEFAULT_ZOOK_OWNER_NAME and owner.username ~= ZOOK_OWNER_NAME) then
		local newOwner = AddPassportOwnerNode(ZOOK_OWNER_NAME)
		if owner ~= nil and owner.username == "CBBC::STRAY" then
			newOwner.notes = "This zook was a stray before being adopted by " .. ZOOK_OWNER_NAME .. "."
		end
		owner = newOwner
		myOwnerUID = owner.uid
	elseif owner ~= nil then
		myOwnerUID = owner.uid
		if owner.username == DEFAULT_ZOOK_OWNER_NAME and ZOOK_OWNER_NAME ~= DEFAULT_ZOOK_OWNER_NAME then
			-- username wasnt set when this zook was made so set it now
			owner.username = ZOOK_OWNER_NAME 
			local modifiers = {}
			GetNodesOfType( myGenomeTable, "modifier", modifiers)
			for index, modifier in modifiers do
				if modifier.owner_uid == myOwnerUID then
					modifier.username = ZOOK_OWNER_NAME
				end
			end
		end
	end
	
end


function MessageAddDetail(category, name, data, comment, volatileModTable)
	if myGenomeTable.version == nil or tonumber(myGenomeTable.version) == 1 then
		-- not applicable to version 1
		return
	end
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local details = FindChildOfType( passport, "details" )
	local node = FindChildWithName( details, name )
	if node == nil then
		node = AddChild(details, "detail")
	end
	
	-- set details
	node.category = category
	node.name = name
	node.data = data
	node.comment = comment
	if category ~= "Physical" then
		node.owner_uid = myOwnerUID
	end
	-- add a list of reasons for which this may become volatile
	for i,v in volatileModTable do
		local found = false
		for i,exists in node.children do
			if exists.mod == v then
				found = 1
				break
			end
		end
		if found == false then
			local modtype = AddChild(node, "volatile")
			modtype.mod = v
		end
	end

end



function MessageGetDetails()
	if myGenomeTable.version == nil or tonumber(myGenomeTable.version) == 1 then
		-- not applicable to version 1
		return nil
	end
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local details = FindChildOfType( passport, "details" )
	if details ~= nil then
		return details, myGenomeTable.version
	end
	return nil, 1
end


function RecordModificationsInPassport(modTable)
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local ownership = FindChildOfType( passport, "ownership" )
	local currentOwner = ownership.children[getn(ownership.children)]
	local modifications = FindChildOfType( currentOwner, "modifications" )
	if modifications == nil then
		modifications = AddChild(currentOwner, "modifications")
	end
	TagModifications(modifications, modTable)
	
	-- keep only details which are not volatile to the mods made
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local details = FindChildOfType( passport, "details" )
	local newDetails = {}
	local nextDetail = 1
	for i,v in details.children do
		if IsVolatile(v, modTable) == false then
			newDetails[nextDetail] = v
			nextDetail = nextDetail + 1
		end
	end
	details.children = newDetails
	
end


function IsVolatile(detail, modTable)
	for i,mod in modTable do
		for i,volatile in detail.children do
			if volatile.mod == mod then
				return 1
			end
		end
	end
	return false
end


function MessageGetPassportImage()
	if tonumber( myGenomeTable.version ) == 1 then
		return nil
	end
	local album = FindChildOfType( myGenomeTable, "photo_album" )
	local node = Clone(album.children[1])
	if node ~= nil then
		node.children = nil
		node.element_type = nil
	end
	return node
end

function RemovePassportImage()
	local album = FindChildOfType( myGenomeTable, "photo_album" )
	if album ~= nil then
		album.children[1] = nil
	end
end
	
function MessageSetPassportImage(image)
	if tonumber( myGenomeTable.version ) == 1 then
		return nil
	end
	local album = FindChildOfType( myGenomeTable, "photo_album" )
	local node = NewNode(album, 1 , "image")
	--node.image = image.image
	--node.date = image.date
	--node.photographer = image.photographer	
	--if node.photographer == nil then
	--	node.photographer = myOwnerUID
	--end
	node.image = image
	node.date = System.GMDateTimeString().." (GMT)"
	node.photographer = myOwnerUID	
end	


-- BLOODLINE -------------------------------------------------------------------------------------------------------

function MessageRecordCreatedPart(part)
	local solids = {}
	GetNodesOfType( myParts[part], "bodysolid", solids )
	for i,v in solids do
		local modifications = FindChildOfType( v, "modifications" )
		if modifications ~= nil then
			local created = FindFirstDescendantOfType( modifications, CREATIVE_MOD )
			if created == nil then
				RecordModification(v, "add")
			end
		else
			RecordModification(v, "add")
		end
	end
			
end

function RecordModification(node, name)
	if myGenomeTable.version == nil or tonumber(myGenomeTable.version) == 1 then
		-- not applicable to version 1
		return
	end
	
	if name == "roll" or name == "pitch" or name == "yaw" or name == "theta" or name == "phi" or 
		name == "delete" or name == "mirror" then
		-- oriantation as like add and delete, they are mods recorded to the parent as they bear not effect on the child if pruned
		node = FindParent(node)
	end
	
	local mod = nil
	if name == "scalex" or name == "scaley" or name == "scalez" or name == "theta" or name == "phi" or 
		name == "roll" or name == "pitch" or name == "yaw" or name == "bias" or name == "flatness" 
		or name == "asymmetry" or name == "cubosity" or 
		name == "delete" or name == "mirror" then
		mod = PHYSICAL_MOD
	elseif name == "leg_type" or  name == "ik_side" or name == "leg_phase" or name == "spine" or
		name == "zook_speed" or name == "turn_sharpness"or name == "turn_smoothness" or name == "max_spine_angle" or
		name == "ik_positions" then
		mod = DYNAMIC_MOD
	elseif name == "colour" or name == "colour_red" or name == "colour_green" or
		name == "colour_blue" or name == "brightness" or name == "texture" then
		mod = COSMETIC_MOD
	elseif name == "add"  then
		mod = CREATIVE_MOD
	else
		return
	end
	
	
	local modTable = GetModifcationRepecusionTable(mod)
	local lastUserModifier = nil
	local modifications = FindChildOfType( node, "modifications" )
	if modifications == nil then
		modifications = AddChild(node, "modifications")
	else
		lastUserModifier = modifications.children[getn(modifications.children)]
	end
	if lastUserModifier == nil or lastUserModifier.username ~= ZOOK_OWNER_NAME then
		lastUserModifier = AddChild(modifications, "modifier")
		lastUserModifier.username = ZOOK_OWNER_NAME
		lastUserModifier.zookname = myZookName
		lastUserModifier.owner_uid = myOwnerUID
	end
	TagModifications(lastUserModifier, modTable)
	if mod ~= DYNAMIC_MOD then
		RemovePassportImage()
	end
	RecordModificationsInPassport(modTable)
end
	

function GetModifcationRepecusionTable(mod)
	if mod == CREATIVE_MOD then
		return { CREATIVE_MOD, PHYSICAL_MOD }
	else
		return { mod }
	end
end
	
	
function TagModifications(node, modTable)
	for i,mod in modTable do 
		local modified = FindChildOfType( node, mod )
		if modified == nil then
			modified = AddChild( node, mod )
		end
		-- clear percentage as this now needs recalculating (done before save)
		modified.percentage = nil
	end
end



function MessageSetPhysicalProperties()
	
	-- dimentsions
	local count, weight = MessageCountAndWeigh()
	local minx, miny, minz, maxx, maxy, maxz = MessageBoundingBox()
		
	MessageAddDetail("Physical", "Height", String.format("%0.1f", (maxy-miny)*4),  "cm", {"PHYSICAL_MOD"})
	MessageAddDetail("Physical", "Length", String.format("%0.1f", (maxz-minz)*4), "cm", {"PHYSICAL_MOD"})
	MessageAddDetail("Physical", "Width", String.format("%0.1f", (maxx-minx)*4), "cm", {"PHYSICAL_MOD"})
	MessageAddDetail("Physical", "Weight", String.format("%0.3f", weight/1000), "kg", {"PHYSICAL_MOD"})
	MessageAddDetail("Physical", "Components", count, "", {"PHYSICAL_MOD"})

	-- modifier counts
	local solids = {}
	GetNodesOfType( myGenomeTable, "bodysolid", solids )
	
	local modlist = {}
	local totalDynamic = 0

	-- Count the number of dynamic sections
	for i, body in solids do
		local iks = FindChildOfType( body, "ik1_positions" )
		if iks ~= nil then
			totalDynamic = totalDynamic +1
		end
		iks = FindChildOfType( body, "ik2_positions" )
		if iks ~= nil then
			totalDynamic = totalDynamic +1
		end
	end
	local total = getn(solids)

	-- Scan through totting up all modifications made in genome
	for i, body in solids do
		local modifications = FindChildOfType( body, "modifications" )
		if modifications ~= nil then
			for i,modifier in modifications.children do
				for i,mod in modifier.children do 
					IncrementMod(modlist, modifier.owner_uid, mod.element_type)
				end
			end
		end
	end
	
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local ownership = FindChildOfType( passport, "ownership" )
	
	for i, v in modlist do
		if v.owner_uid ~= nil then -- dodgy lua getn
			local owner = FindChildWithAttribute( ownership, "uid", v.owner_uid )
			if owner == nil then
				Trace("Could not find owner uid % in zook's owner list\n", v.owner_uid)
			else
				local modifications = FindChildOfType( owner, "modifications" )
				if modifications ~= nil then
					for i,mod in modifications.children do
						if mod.element_type == DYNAMIC_MOD then
							mod.percentage = BodyPartPercentage(v[mod.element_type], totalDynamic)
						else
							mod.percentage = BodyPartPercentage(v[mod.element_type], total)
						end
					end
				else
					Trace("No modifications found for owner uid %\n", v.owner_uid)
				end
			end
		end
	end
end


function IncrementMod(mods, owner_uid, type)
	for i,v in mods do
		if v.owner_uid ==owner_uid then
			if v[type] == nil then
				v[type]  = 1
			else
				v[type] = v[type]+1
			end
			return
		end
	end
	local total = getn(mods)
	mods[total+1] = { owner_uid = owner_uid }
	mods[total+1][type] = 1
end
	

function BodyPartPercentage(value, total)
	local val = 0
	if value ~= nil and total ~= nil and total ~= 0 then
		val = (value/total)*100
	end
	return String.format ("%1.1f" ,val)
end


function MessageGetModifierCounts()
	local passport = FindChildOfType( myGenomeTable, "passport" )
	local ownership = FindChildOfType( passport, "ownership" )
	
	local modlist = {}
	for i, owner in ownership.children do
		local index = getn(modlist)+1
		modlist[index] = {  owner_uid = owner.uid }
		
		local modifications = FindChildOfType( owner, "modifications" )
		if modifications ~= nil then
			for i,mod in modifications.children do
				if mod.percentage ~= nil then
					modlist[index][mod.element_type] = mod.percentage
				else
					modlist[index][mod.element_type] = -1
				end
			end
		end
	end
	
	return modlist
end
	
	
-- BUILDER CONTROL  ----------------------------------------------------------------------------------------------------------

function MessageCreaturePosition()
	return Agent.SendMessage("Position", myExpressedCreature)
end


function MessageSetCreatureTarget(target)
	if myExpressedCreature ~= nil then
		Agent.SendMessage("SetTarget", myExpressedCreature, { target = target, segment = Agent.SendMessage("TargetSegmentID", target) } )
	end
end

function MessageSetGenomeVisibility( visible )
	if myGenomeTable ~= nil then
		DoSetGenomeVisibility( myGenomeTable, visible )
	end
end

function DoSetGenomeVisibility( node, visible )
	for index, value in node.children do
		DoSetGenomeVisibility( value, visible )
	end
	if  node.segment ~= nil then
		Visual.SetVisible( node.segment, visible )
	end
	if visible then
		if myExpressedCreature ~= nil then
			Agent.SendMessage("Destroy", myExpressedCreature)
		end
	end
end

function MessageSelectorSegment()
	return Segment.selector
end

function MessageSetGravity(gravity)
	Karma.SetGravity( Vector.New( 0, -gravity, 0 ) )
end

function MessageGravity()
	local g = Karma.GetGravity()
	return -Vector.GetY( g )
end

function NodeCountAndWeigh( node )

	local density = 1
	local count = 1
	local weight = ((node.scalex*4) * (node.scaley*4) * (node.scalez*4)) * density
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			local c, w = NodeCountAndWeigh( value )
			count = count + c
			weight = weight + w
		end
	end
	return count, weight
end


function MessageCountAndWeigh()
	return NodeCountAndWeigh( myRootNode )
end


	
-- PARTS AND ATTRIBUTES ---------------------------------------------------------------------------------------------------------------------------------------

function MessageAttributes()
	return myRequiredAttributes
end

function FindAttributeGroup( name )
	for index, value in myAttributeGroups do
		if value.name == name then
			return value
		end
	end
	return nil
end

function MessagePartAttributes( part )
	local attributes = {}
	local node = myParts[ part ]
	if node ~= nil then
		Trace( "Getting part attributes" )
		local attributeGroups = FindChildOfType( node, "attribute_groups" )
		if attributeGroups ~= nil then
			Trace( "Part has attributes" )
			for index, value in attributeGroups.children do
				Trace( "adding attribute group: %", value.name )
				attributes[ index ] = FindAttributeGroup( value.name )
			end
		end
	end
	return attributes
end

function MessageAttribute( part, name )
	return myParts[ part ][name]
end

function AddRequiredAttributes( node )
	for index, value in myRequiredAttributes do
		if node[ value.name ] == nil then
			node[ value.name ] = value.default
		end
		if value.number ~= nil then
			node[ value.name ] = tonumber( node[ value.name ] )
		end
	end
end

function SetAttributeInMirrorGroup( node, mirrorGroup, name, value, phi )
	
	if node.mirror_group == mirrorGroup then
		
		RecordModification(node, name)
		
		if phi * node.phi < 0 then -- Different side
			if ( name == "phi" or name == "yaw" or name == "roll" ) then
				node[name] = -value
			elseif name == "side" and value == "Right" then
				node[name] = "Left"
			elseif name == "side" and value == "Left" then
				node[name] = "Right"
			elseif name ~= "leg_phase" and name ~= "ik_side" then
				node[name] = value
			end
		else
			node[name] = value
		end
		if name == "mesh" or name == "bias" or name == "flatness" or name == "asymmetry" or name == "cubosity" or name == "texture" then
			if node.mesh == "Sphere" then
				Visual.Create(Segment.GetName( node.segment ), 0,
					Vector.New( 0, 0, 0 ), Quatn.New(), Vector.New(1, 1, 1), 1)
			else
				if node.mesh == "Cube" then
					Visual.Create(Segment.GetName( node.segment ), 1,
						Vector.New( 0, 0, 0 ), Quatn.New(), Vector.New(1, 1, 1), 1)
				else
					if node.mesh == "Blob" then
						Visual.Create(Segment.GetName( node.segment ), 2,
							Vector.New( 0, 0, 0 ), Quatn.New(), Vector.New(1, 1, 1), 1, false, node.bias,
							myTextureDirectory.."/"..node.texture, node.flatness, node.asymmetry, node.cubosity )
						--Visual.SetShadow( node.segment, 1 )
					else
						Visual.Create(Segment.GetName( node.segment ), "../Evo/Libraries/BodyParts/"..node.mesh,
							Vector.New( 0, 0, 0 ), Quatn.New(), Vector.New(1, 1, 1), 1)
					end
				end
			end
		end
		--if name == "mesh" or name == "bias" or name == "flatness" or name == "asymmetry" or name == "cubosity" or name == "texture" then
	end
	for index, child in node.children do
		if child.element_type == "bodysolid" then
			SetAttributeInMirrorGroup( child, mirrorGroup, name, value, phi )
		end
	end
end


function AddAttributeGroup( node, group )
	local attrs = FindChildOfType( node, "attribute_groups" )
	if attrs == nil then
		attrs = AddChild( newNode, "attribute_groups" )
	end
	local control = FindChildWithName( attrs, group )
	if control == nil then
		control = AddChild( attrs, "attribute_group" )
		control.name = group
	end
end

function MessageSetAttribute( part, name, value )
	local node = myParts[ part ]
	
	RecordModification(node, name)
	
	--We don't want phi to be equal to zero or it will screw up mirroring stuff
	if name == "phi" and Number.abs( value ) < 0.001 then
		value = 0.001
	end
	if name == "leg_type" then
		if value == "1" then
			if not CanBeIK1( node ) then
				return
			end
		elseif value == "2" then
			if not CanBeIK2( node ) then
				return
			end
		end
	end
	if name == "colourPick" then
		if value == "Red" then
			SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "colour", 0.9/7, node.phi )
			SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "brightness", 1, node.phi )
		elseif value == "Blue" then
			SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "colour", 4/7, node.phi )
			SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "brightness", 222/256, node.phi )
		end
	else
		if name == "leg_phase" or name == "ik_side" then
			node[name] = value
		else
			SetAttributeInMirrorGroup( myRootNode, node.mirror_group, name, value, node.phi )
		end
	end
	UpdatePositions( myRootNode, false )
end

function CanBeIK1( node )
	local parent = FindParent( node )
	if parent == nil then
		return false
	end
	for index, child in node.children do
		if child.leg_type == "2" then
			return false
		end
	end
	return 1
end


function MessageCanBeIK1( part )
	return CanBeIK1( myParts[part] )
end

function CanBeIK2( node )
	if node.leg_type == "2" then
		return 1
	end
	local parent = FindParent( node )
	if parent == nil then
		return false
	end
	if parent.leg_type == "1" or parent.leg_type == "2" then
		return false
	end
	local grandparent = FindParent( parent )
	if grandparent == nil or grandparent.element_type ~= "bodysolid" then
		return false
	end
	for index, child in node.children do
		if child.leg_type == "2" then
			return false
		end
	end
	for index, child in parent.children do
		if child.leg_type == "2" then
			return false
		end
	end
	return 1
end
	
function MessageCanBeIK2( part )
	return CanBeIK2( myParts[part] )
end




function MessageNewPart( parent, point, scale )

	local hAngle, vAngle = 0, 0
	local node = myGenomeTable
	if parent ~= 0 then
		local invParent = Clone( myParts[parent].worldTrans )
		Matrix.FastInverse( invParent )
		local relPoint = point * invParent
		local x, y, z = Vector.GetX( relPoint ) / myParts[parent].scalex , Vector.GetY( relPoint ) / myParts[parent].scaley, Vector.GetZ( relPoint ) / myParts[parent].scalez
		hAngle = Number.atan2( x, z )
		local r = Number.sqrt( x * x + z * z )
		vAngle = -Number.atan2( y, r )
		node = AddChild( myParts[parent], "bodysolid" )
		node.theta = vAngle
		node.phi = hAngle
	end
	if parent ~= 0 then
		AddChild( node, "cardanconnector" )
	end
	RemovePartIds( node )
	CreateVisuals( node )

	UpdatePositions( myRootNode, false )

	return node.partId
end



function MessagePartPosition( part )
	return Matrix.GetTranslation( myParts[ part ].worldTrans )
end

function MessagePartTransform( part )
	return myParts[ part ].worldTrans
end

function MessagePartConnect( part )
	return Vector.New( 0, 0, -0.5 * myParts[ part ].scalez) *  myParts[ part ].worldTrans
end

function MessagePartEnd( part )
	return Vector.New( 0, 0, 0.5 * myParts[ part ].scalez) *  myParts[ part ].worldTrans
end

function MessagePartExists( part )
	return myParts[ part ] ~= nil
end

function MessageGetPartScale( part )
	local node = myParts[ part ]
	return Vector.New( node.scalex, node.scaley, node.scalez )
end

function MessagePartScale( part, scale )
	local node = myParts[ part ]
	local x, y, z = Vector.GetXYZ( scale )
	SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "scalex", x, node.phi )
	SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "scaley", y, node.phi )
	SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "scalez", z, node.phi )
	UpdatePositions( myRootNode, false )
end

function MessageAngles( part )
	return myParts[ part ].vAngle, myParts[ part ].hAngle,
		myParts[ part ].roll, myParts[ part ].pitch, myParts[ part ].yaw
end

function MessageSetAngles( part, elevation, position, roll, pitch, yaw )
	myParts[ part ].vAngle = elevation
	myParts[ part ].hAngle = position
	myParts[ part ].roll = roll
	myParts[ part ].pitch = pitch
	myParts[ part ].yaw = yaw
	UpdatePart( part )
end

function MessageSetColour( part, r, g, b )
	Visual.SetColour( myParts[part].segment, r, g, b )
end

function MessageSetSelected( part )
	if part and myParts[part] ~= nil then
		Visual.SetVisible( Segment.selector, 1 )
		Visual.SetTransform( Segment.selector, Visual.GetTransform( myParts[part].segment ) )
		Visual.SetScale( Segment.selector, Visual.GetScale( myParts[part].segment ) )
	else
		Visual.SetVisible( Segment.selector, false )
		Visual.MoveTo( Segment.selector, Vector.New( -500, -500, -500 ) )
		Visual.SetScale( Segment.selector, Vector.New( 0.0001, 0.0001, 0.0001 ) )
	end
end


function MessageClonePart( partTable, parentPart )
	Trace( "BuilderParts Parent %", parentPart )
	
	local part
	if parentPart == 0 then
		MessageClear()
		myGenomeTable = partTable
		myRootNode = FindFirstDescendantOfType( myGenomeTable, "bodysolid" )
		RemovePartIds( myGenomeTable )
		CreateVisuals( myGenomeTable )
		myNextMirrorGroup = 1
		FindNextMirrorGroup( myRootNode )
		part = myGenomeTable.partId
	else
		local groups = {}
		ReassignMirrorGroups( partTable, groups )
		local nextChild = getn( myParts[parentPart].children ) + 1
		myParts[parentPart].children[nextChild] = partTable
		RemovePartIds( partTable )
		CreateVisuals( partTable )
		--ReassignMirrorGroups( partTable, groups )
		CloneInMirrorGroup( myParts[parentPart], myRootNode, partTable )
		part = partTable.partId
		
		if myParts[parentPart] == myRootNode then
			newNode = myParts[part]
			
			local attrs = FindChildOfType( newNode, "attribute_groups" )
			if attrs == nil then
				attrs = AddChild( newNode, "attribute_groups" )
			end
			local control = FindChildWithName( attrs, "IK Control" )
			if control == nil then
				control = AddChild( attrs, "attribute_group" )
				control.name = "IK Control"
			end
		end
	
	end
	
	UpdatePositions( myRootNode, false )
	return part
end

function ReverseAngles( node )
	node.phi = -node.phi
	node.roll = -node.roll
	node.yaw = -node.yaw
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			ReverseAngles( value )
		end
	end
end



function MessagePartTable( part )
	if part == 0 then
		return myGenomeTable
	else
		return myParts[part]
	end
end

function MessageSetPartPosition( part, point )
	Trace( "New position %", point )
	local partNode = myParts[part]
	if partNode ~= nil then
		local parentNode = FindParent( myParts[part] )
		if parentNode ~= nil then
			if parentNode.worldTrans ~= nil then
				local invParent = Clone( parentNode.worldTrans )
				Matrix.FastInverse( invParent )
				local relPoint = point * invParent
				local x, y, z = Vector.GetX( relPoint ) / parentNode.scalex , Vector.GetY( relPoint ) / parentNode.scaley, Vector.GetZ( relPoint ) / parentNode.scalez
				local hAngle = Number.atan2( x, z )
				local r = Number.sqrt( x * x + z * z )
				local vAngle = -Number.atan2( y, r )
				SetAttributeInMirrorGroup( myRootNode, partNode.mirror_group, "theta", vAngle, partNode.phi )
				SetAttributeInMirrorGroup( myRootNode, partNode.mirror_group, "phi", hAngle, partNode.phi )
				UpdatePositions( myRootNode, false )
				--partNode.theta = vAngle
				--partNode.phi = hAngle
				--UpdatePositions( partNode, parentNode )
			end
		end
	end
end

function MessageSetPartRotation( part, endPoint )
	local node = myParts[part]
	if node ~= nil then
		local parent = FindParent( node )
		if parent ~= nil then
			if parent.worldTrans ~= nil then
				local parentPos = Matrix.GetTranslation( parent.worldTrans )
				local localTrans = Matrix.New()
				Matrix.RotateX( localTrans, node.theta )
				Matrix.RotateY( localTrans, node.phi )
				local startRel = myIntersectionVector * localTrans
				local startScaled = Vector.New( Vector.GetX( startRel ) * parent.scalex, Vector.GetY( startRel ) * parent.scaley, Vector.GetZ( startRel ) * parent.scalez )
				local agent, segment, point = Visual.Ray( startScaled * parent.worldTrans, parentPos, Agent.Me(), parent.segment )
				if Agent.IsValid(agent) then
					local invParent = Clone( parent.worldTrans )
					Matrix.FastInverse( invParent )
					Matrix.SetTranslation( localTrans, point * invParent )
				end
				local unRotatedTrans = localTrans * parent.worldTrans
				Matrix.FastInverse( unRotatedTrans )
				local relPoint = endPoint * unRotatedTrans
				--local x, y, z = Vector.GetX( relPoint ), Vector.GetY( relPoint ), Vector.GetZ( relPoint )
				local x, y, z = Vector.GetXYZ( relPoint )
				local hAngle = Number.atan2( x, z )
				local r = Number.sqrt( x * x + z * z )
				local vAngle = -Number.atan2( y, r )
				--node.pitch = vAngle
				--node.yaw = hAngle
				--UpdatePositions( node, parent )
				SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "pitch", vAngle, node.phi )
				SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "yaw", hAngle, node.phi )
				UpdatePositions( myRootNode, false )
			end
		end
	end
end

function DoDeletePart( node )
	for index, value in node.children do
		DoDeletePart( value )
	end
	if  node.segment ~= nil then
		Segment.Destroy( node.segment )
	end
	if node.partId ~= nil then
		myParts[node.partId] = nil
	end
end


function MessageDeletePart( part )
	local node = myParts[ part]
	if node == myRootNode then
		return
	end
	local parts = {}
	
	RecordModification(node, "delete")
	
	BodyPartsInMirrorGroup( myRootNode, node.mirror_group, parts )
	for index, value in parts do
		DoDeletePart( value )
		local p = FindParent( value )
		if p ~= 0 then
			local childIndex = nil
			for index, child in p.children do
				if value == child then
					childIndex = index
				end
			end
			if childIndex ~= nil then
				local lastChild = getn( p.children )
				for i = childIndex, lastChild- 1 do
					p.children[ i ]  = p.children[ i + 1 ]
				end
				p.children[ lastChild ] = nil
			end
		end
	end
end


-- MIRRORING ----------------------------------------------------------------------------------------------------------------------------------------

function FindNextMirrorGroup( node )
	if node.mirror_group ~= nil then
		node.mirror_group = node.mirror_group + 0
		if node.mirror_group >= myNextMirrorGroup then
			myNextMirrorGroup = node.mirror_group + 1
		end
	end
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			FindNextMirrorGroup( value )
		end
	end
end

function AssignEmptyMirrorGroups( node )
	if node.mirror_group == nil then
		node.mirror_group = myNextMirrorGroup
		myNextMirrorGroup = myNextMirrorGroup + 1
	end
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			AssignEmptyMirrorGroups( value )
		end
	end
end

function ReassignMirrorGroups( node, groups )
	if node.mirror_group == nil then
		node.mirror_group = myNextMirrorGroup
		myNextMirrorGroup = myNextMirrorGroup + 1
	end
	if groups[ node.mirror_group ] == nil then
		groups[ node.mirror_group ] = myNextMirrorGroup
		myNextMirrorGroup = myNextMirrorGroup + 1
	end
	node.mirror_group = groups[ node.mirror_group ]
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			ReassignMirrorGroups( value, groups )
		end
	end
end

function CloneInMirrorGroup( parent, node, source )
	--Trace( "Parent: %  Mirror group: %   Node: %  Mirror Group: %", parent.partId, parent.mirror_group, node.partId, node.mirror_group )
	if node ~= parent and node.mirror_group == parent.mirror_group then
		local nextChild = getn( node.children ) + 1
		node.children[nextChild] = Clone( source )
		if parent.phi * node.phi < 0 then
			ReverseAngles( node.children[nextChild] )
		end
		RemovePartIds( node.children[nextChild] )
		CreateVisuals( node.children[nextChild] )
	end
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			CloneInMirrorGroup( parent, value, source )
		end
	end
end


function MessageMirrorPart( part )
	local node = myParts[part]
	
	--Can't mirror root node!
	if node == myRootNode then
		return 1
	end
	
	--Check we're not mirroring something which has already been mirrored
	local parent = FindParent( node )
	for index, value in parent.children do
		if value.mirror_group == node.mirror_group and value ~=  node then
			return 2
		end
	end
	
	RecordModification(node, "mirror")

	
	local parts = {}
	BodyPartsInMirrorGroup( myRootNode, node.mirror_group, parts )
	for index, value in parts do
		local parent = FindParent( value )
		local nextChild = getn( parent.children ) + 1
		local clone = Clone( value )
		parent.children[nextChild] = clone
		ReverseAngles( clone )
		RemovePartIds( clone )
		CreateVisuals( clone )
	end
	UpdatePositions( myRootNode, false )
end

function BodyPartsInMirrorGroup( node, mirrorGroup, parts )
	if node.mirror_group == mirrorGroup then
		local lastChild = getn( parts )
		parts[ lastChild + 1 ] = node
	end
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			BodyPartsInMirrorGroup( value, mirrorGroup, parts )
		end
	end
end

-- VALIDATION STUFF ------------------------------------------------------------------------------------------------------------------------------
function MessageValidate()
	--Trace( "Validating" )
	myLastZookInvalid = false
	Validate( myRootNode )
	if myLastZookInvalid then
		CreateVisuals( myRootNode )
		UpdatePositions( myRootNode, false )
	end
	return myLastZookInvalid
end

function Validate( node )
	--Trace( "Validating %", node.partId )
	local attributeGroups = MessagePartAttributes( node.partId )
	Trace( "attributeGroups %", attributeGroups )
	for iGroup, group in attributeGroups do
		--Trace( "Checking attribute group: %", iGroup )
		for iAttribute, attribute in group.attributes do
			Trace( "Checking attribute: %", attribute.name )
			local value = tonumber( node[attribute.name] )
			if value ~= nil then
				if attribute.min ~= nil then
					--Trace( "Checking attribute: %  value: %  min: %", attribute.name, value, attribute.min )
					if value < attribute.min then
						myLastZookInvalid = 1
						node[attribute.name] = attribute.min
					end
				end
				if attribute.max ~= nil then
					--Trace( "Checking attribute: %  value: %  max: %", attribute.name, value, attribute.max )
					if value > attribute.max then
						myLastZookInvalid = 1
						node[attribute.name] = attribute.max
					end
				end
			end
		end
	end
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			Validate( value )
		end
	end
end

-- POSITIONAL STUFF ------------------------------------------------------------------------------------------------------------------------------

function UpdatePositions( node, parent )
	local nextParent = false
	if node.element_type == "bodysolid" then
		if parent then
			--Find intersection of ray from parents centre at specified angles
			local parentPos = Matrix.GetTranslation( parent.worldTrans )
			local localTrans = Matrix.New()
			Matrix.RotateX( localTrans, node.theta )
			Matrix.RotateY( localTrans, node.phi )

			local offset = Vector.New( 0, 0, node.scalez / 2 )
			local rotTrans = Matrix.New()
			Matrix.RotateZ( rotTrans, node.roll )
			Matrix.RotateX( rotTrans, node.pitch )
			Matrix.RotateY( rotTrans, node.yaw )

			local startRel = myIntersectionVector * localTrans
			local startScaled = Vector.New( Vector.GetX( startRel ) * parent.scalex, Vector.GetY( startRel ) * parent.scaley, Vector.GetZ( startRel ) * parent.scalez )
			local agent, segment, point = Visual.Ray( startScaled * parent.worldTrans, parentPos, Agent.Me(), parent.segment )
			local position
			if Agent.IsValid( agent ) then
				local invParent = Clone( parent.worldTrans )
				Matrix.FastInverse( invParent )
				position = point * invParent +offset * rotTrans * localTrans
			else
				position = offset * rotTrans * localTrans
			end
			Matrix.SetTranslation( localTrans, position )
			
			node.worldTrans = rotTrans * localTrans * parent.worldTrans
			node.posx, node.posy, node.posz = Vector.GetXYZ( position )
		else
			node.worldTrans = Matrix.New( Vector.New( 1,1,1 ), myRootRotation, myRootPosition )
			--~ Matrix.RotateZ( node.worldTrans, node.roll )
			--~ Matrix.RotateX( node.worldTrans, node.pitch )
			--~ Matrix.RotateY( node.worldTrans, node.yaw )
			--~ Matrix.SetTranslation( node.worldTrans, myRootPosition )
		end
		Visual.SetTransform( node.segment, node.worldTrans )
		Visual.SetScale( node.segment, Vector.New( node.scalex, node.scaley, node.scalez )  )
		local b = node.brightness
		Visual.SetColour( node.segment, b*node.colour_red, b*node.colour_green, b*node.colour_blue ) --CalculateColour( node.colour, node.brightness ) )
		nextParent = node
	end
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			UpdatePositions( value, nextParent )
		end
	end
end


-- INVERSE KINEMATICS ------------------------------------------------------------------------------------------------------------------------------------------------------

function MessageIk2Able( part )
	local node = myParts[ part ]
	if node == nil then return false end
	local parent = FindParent( node )
	if parent == nil then return false end
	local grandparent = FindParent( parent )
	if grandparent == nil then return false end
	return 1
end

function MessageIk1Able( part )
	local node = myParts[ part ]
	if node == nil then return false end
	local parent = FindParent( node )
	if parent == nil then return false end
	local grandparent = FindParent( parent )
	if grandparent == nil then return false end
	return 1
end

function MessageIKPositions(part)
	local node = myParts[ part]
	if node.leg_type == "1"  then
		local p = FindChildOfType( node, "ik1_positions" )
		if p == nil then
			p = FindChildOfType( node, "ik_positions" )
		end
		if p == nil then
			p = AddChild( node, "ik1_positions" )
			p.gait = "gait_1"
			p.children[1] = { element_type = "point", children = {}, x = 0, y = 0, z = 2.373677492141724 }
			p.children[2] = { element_type = "point", children = {}, x = -0.5331680178642273, y = 0, z = 2.31031608581543 }
			p.children[3] = { element_type = "point", children = {}, x = 0, y = 0.6, z = 2.296311616897583 }
			p.children[4] = { element_type = "point", children = {}, x = 0.5633578300476074, y = 0, z = 2.302533626556397 }
		end
		local relPoints = Clone( p.children )
		--~ local invTrans = Clone( node.worldTrans )
		--~ Matrix.SetTranslation( invTrans, MessagePartConnect( part ) )
		--~ Matrix.FastInverse( invTrans )
		local trans = Clone( node.worldTrans )
		Matrix.SetTranslation( trans, Vector.New( 0, 0, 0 ) )
		for index, value in relPoints do
			if node.phi < 0 then value.x = - value.x end
			relPoints[index].x, relPoints[index].y, relPoints[index].z  = Vector.GetXYZ( Vector.New( value.x+0, value.y+0,value.z+0) * trans )
		end
		return relPoints
	elseif node.leg_type == "2"  then
		local p = FindChildOfType( node, "ik2_positions" )
		if p == nil then
			p = FindChildOfType( node, "ik_positions" )
		end
		if p == nil then
			p = AddChild( node, "ik2_positions" )
			p.gait = "gait_1"
			p.children[1] = { element_type = "point", children = {}, x = 0, y = 0, z = 0 }
			p.children[2] = { element_type = "point", children = {}, x = 0, y = 0, z = 0.5 }
			p.children[3] = { element_type = "point", children = {}, x = 0, y = 0.5, z = 0 }
			p.children[4] = { element_type = "point", children = {}, x = 0, y = 0, z = -0.5 }
		end
		return p.children
	else
		return {}
	end
end

function MessageElbowPositions()
	return myDebugElbowPositions
end

function MessageSetIKPositions( part, ikPositions )
	local mainNode = myParts[ part]
	local parts = {}
	BodyPartsInMirrorGroup( myRootNode, mainNode.mirror_group, parts )
	for index, node in parts do
		--~ Trace( "Setting Ik Points" )
		--~ local ikData = FindChildOfType( node, "ik_positions" )
		--~ if ikData == nil then
			--~ ikData = AddChild( node, "ik_positions" )
			--~ ikData.gait = "gait_1"
		--~ end

		RecordModification(node, "ik_positions")
		
		if node.leg_type == "1"  then
			local ikData = FindChildOfType( node, "ik1_positions" )
			if ikData == nil then
				ikData = FindChildOfType( node, "ik_positions" )
			end
			if ikData == nil then
				ikData = AddChild( node, "ik1_positions" )
				ikData.gait = "gait_1"
			end
			local invTrans = Clone( mainNode.worldTrans )
			Matrix.SetTranslation( invTrans, Vector.New( 0, 0, 0 ) )
			Matrix.FastInverse( invTrans )
			local ikTransformed = Clone( ikPositions )
			for i, value in ikPositions do
				Trace( "Setting Ik Point %", i )
				ikTransformed[i].x, ikTransformed[i].y,ikTransformed[i].z  = Vector.GetXYZ( Vector.New( value.x+0, value.y+0, value.z+0) * invTrans )
				if mainNode.phi < 0 then ikTransformed[i].x = -ikTransformed[i].x end
			end
			ikData.children = ikTransformed
		elseif node.leg_type == "2"  then
			local ikData = FindChildOfType( node, "ik2_positions" )
			if ikData == nil then
				ikData = FindChildOfType( node, "ik_positions" )
			end
			if ikData == nil then
				ikData = AddChild( node, "ik2_positions" )
				ikData.gait = "gait_1"
			end
			ikData.children = ikPositions
		end
	end
end



function MessageScalingVector( point )
	local selmatrix = Visual.GetTransform( Segment.selector )
	local scale = Visual.GetScale( Segment.selector )
	Matrix.FastInverse( selmatrix )
	local relPoint = point * selmatrix
	local x, y, z = Vector.GetXYZ( relPoint )
	local xs, ys, zs= Vector.GetXYZ( scale )
	relPoint = Vector.New( x / xs, y / ys, z / zs )
	local scalingVector = myScalingVectors[1]
	local best = Vector.Dot( scalingVector, relPoint )
	for index, value in myScalingVectors do
		local dot = Vector.Dot( value, relPoint )
		if dot > best then
			best = dot
			scalingVector = value
		end
	end
	return scalingVector, scalingVector * Visual.GetTransform( Segment.selector ) - Visual.GetPosition( Segment.selector )
end
	



--VISUALS --------------------------------------------------------------------------------------------------------------------------------------------


function UpdateParts( node )
	if node.element_type == "bodysolid" then
		myParts[ node.partId ] = node
		mySegments[ node.segment ] = node
	end
	for index, value in node.children do
		UpdateParts( value )
	end
end

function CreateVisuals( node )
	if node.element_type == "bodysolid" then
		AddRequiredAttributes( node )
		AddAttributeGroup( node, "Colour" )
		if node.partId == nil then
			node.partId = myNextBodyPart
			myNextBodyPart = myNextBodyPart + 1
		else
			node.partId = tonumber( node.partId )
			if node.partId >= myNextBodyPart then
				myNextBodyPart = node.partId + 1
			end			
		end
		local partName = "part" .. node.partId
		if node.mesh == "Sphere" then
			Visual.Create(partName, 0, Vector.New( 0, 0, 0 ),
				Quatn.New(), Vector.New(1, 1, 1), 1)
		else
			if node.mesh == "Cube" then
				Visual.Create(partName, 1, Vector.New( 0, 0, 0 ),
					Quatn.New(), Vector.New(1, 1, 1), 1)
			else
				if node.mesh == "Blob" then
					Visual.Create(partName, 2, Vector.New( 0, 0, 0 ),
						Quatn.New(), Vector.New(1, 1, 1), 1,false, node.bias,
						myTextureDirectory.."/"..node.texture, node.flatness, node.asymmetry, node.cubosity )
					--Visual.SetShadow( Segment.GetId( partName ), 1 )
					--Visual.Create(partName, 2, Vector.New( 0, 0, 0 ),
					--	Quatn.New(), Vector.New(1, 1, 1), 1,false, node.bias )
				else
					Visual.Create(partName, "../Evo/Libraries/BodyParts/"..node.mesh, Vector.New( 0, 0, 0 ),
						Quatn.New(), Vector.New(1, 1, 1), 1)
				end
			end
		end
		--Visual.Create(partName, 1, Vector.New( 0, 0, 0 ), Quatn.New(), Vector.New(1, 1, 1), 1)
		node.segment = Segment.GetId( partName )
		myParts[ node.partId ] = node
		mySegments[ node.segment ] = node
	end
	for index, value in node.children do
		CreateVisuals( value )
	end
end


function CalculateColour( colour, brightness )
	local ind = colour * (getn( myHues )-1) + 1
	local bottom = Number.floor( ind )
	if bottom == getn( myHues ) then
		bottom = bottom - 1
	end
	ind = ind - bottom
	local r = myHues[bottom][1] * (1-ind) + myHues[bottom + 1][1] * ind
	local g = myHues[bottom][2] * (1-ind) + myHues[bottom + 1][2] * ind
	local b = myHues[bottom][3] * (1-ind) + myHues[bottom + 1][3] * ind
	return r * brightness, g * brightness, b * brightness 
end



-- BOUNDING AREAS -----------------------------------------------------------------------------------------------------------------------------------

function MessageBoundingSphere()
	return NodeBoundingSphere( myRootNode )
end

function NodeBoundingSphere( node )
	local c = Matrix.GetTranslation( node.worldTrans )
	local r = Number.sqrt( node.scalex * node.scalex + node.scaley * node.scaley + node.scalez * node.scalez ) / 2 
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			c, r = SphereUnion( c, r, NodeBoundingSphere( value ) )
		end
	end
	return c, r
end

function SphereUnion( c1, r1, c2, r2 )
	local diff = c2 - c1
	local dist = Vector.GetLength( diff )
	if dist + r2 <= r1 then
		return c1, r1
	elseif dist + r1 <= r2 then
		return c2, r2
	end
	local dir = Vector.Normalise( diff )
	local e1 = c1 - r1 * dir
	local e2 = c2 + r2 * dir
	return ( e1 + e2 ) / 2, Vector.GetLength( e2 - e1 ) / 2
end

function MessageBoundingBox()
	return NodeBoundingBox( myRootNode )
end

function NodeBoundingBox( node )
	local xMin, yMin, zMin = Vector.GetXYZ( Matrix.GetTranslation( node.worldTrans ) )
	local xMax, yMax, zMax = xMin, yMin, zMin
	for x = -1, 1, 2 do
		for y = -1, 1, 2 do
			for z = -1, 1, 2 do
				local p = Vector.New( 0.5 * x * node.scalex, 0.5 * y * node.scaley, 0.5 * z * node.scalez ) * node.worldTrans
				xMin = Number.min( xMin, Vector.GetX( p ) ) 
				yMin = Number.min( yMin, Vector.GetY( p ) ) 
				zMin = Number.min( zMin, Vector.GetZ( p ) ) 
				xMax = Number.max( xMax, Vector.GetX( p ) ) 
				yMax = Number.max( yMax, Vector.GetY( p ) ) 
				zMax = Number.max( zMax, Vector.GetZ( p ) ) 
			end
		end
	end
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			xMin, yMin, zMin, xMax, yMax, zMax = BoxUnion( xMin, yMin, zMin, xMax, yMax, zMax, NodeBoundingBox( value ) )
		end
	end
	return xMin, yMin, zMin, xMax, yMax, zMax
end

function BoxUnion( xMin1, yMin1, zMin1, xMax1, yMax1, zMax1,   xMin2, yMin2, zMin2, xMax2, yMax2, zMax2 )
	return Number.min( xMin1, xMin2 ), Number.min( yMin1, yMin2 ), Number.min( zMin1, zMin2 ), 
		Number.max( xMax1, xMax2 ), Number.max( yMax1, yMax2 ), Number.max( zMax1, zMax2 )
end




-- TREE SEARCHING and PART/SEGMENT HELPER FUNCITONS -----------------------------------------------------------------------------------------------------------------------

function FindChildOfType( node, type )
	for index, value in node.children do
		if value.element_type == type then
			return value
		end
	end
	return nil
end

function FindFirstDescendantOfType( node, type )
	if node.element_type == type then
		return node
	end
	for index, value in node.children do
		local ret = FindFirstDescendantOfType( value, type )
		if ret ~= nil then
			return ret
		end
	end
	return nil
end


function GetNodesOfType( node, type, nodes )
	if node.element_type == type then
		local lastChild = getn( nodes )
		nodes[ lastChild + 1 ] = node
	end
	for index, value in node.children do
		GetNodesOfType( value, type, nodes )
	end
end

function FindChildWithName( node, name )
	for index, value in node.children do
		if value.name == name then
			return value
		end
	end
	return nil
end

function FindChildWithAttribute( node, attr, name )
	for index, value in node.children do
		if value[attr] == name then
			return value
		end
	end
	return nil
end


function DoFindParent( parent, node )
	for index, value in parent.children do
		if value == node then
			return parent
		end
	end
	for index, value in parent.children do
		local p = DoFindParent( value, node )
		if p ~= nil then
			return p
		end
	end
	return nil
end

function FindParent( node )
	return DoFindParent( myGenomeTable, node )
end

function MessageAncestorChildOfRoot(node)
	
	local parent = node
	local child
	while parent ~= myRootNode do
		child = parent
		parent = FindParent( child )
	end
	
	return child
end

function FindAncestorOfType(node, type)
	
	local parent = node
	local child
	while parent ~= myGenomeTable do
		child = parent
		parent = FindParent( child )
		if parent.element_type == type then
			return parent
		end
	end
	
	return nil
end


function MessagePartFromSegment( segment )
	if mySegments[ segment ] ~= nil then
		return mySegments[ segment ].partId
	else
		return false
	end
end

function RemovePartIds( node )
	node.partId = nil
	for index, value in node.children do
		if value.element_type == "bodysolid" then
			RemovePartIds( value )
		end
	end
end

function RemoveModifierIds( node )
	local nodes = {}
	GetNodesOfType( node, "modifier", nodes )
	for index, value in nodes do
		value.owner_id = nil
	end
end

function MessagePartSegment( part )
	return myParts[ part ].segment
end

function MessageParentSegment( part )
	local parent = FindParent( myParts[ part ] )
	if parent ~= nil then
		if parent.segment ~= nil then
			return parent.segment
		end
	end
	return false
end

function MessagePartId( segment )
	for index, value in myParts do
		if value.segment == segment then
			return index
		end
	end
end

function MessagePartIsRoot( part )
	return myParts[part] == myRootNode
end

function RemoveChild( node, removeIndex )
	local lastChild = getn( node.children ) 
	for move = removeIndex+1,lastChild do
		node.children[ move -1 ] = node.children[move]
	end
end
	
function InsertChild( node, insertIndex, element_type )
	local lastChild = getn( node.children ) 
	for move = lastChild, insertIndex,-1 do
		node.children[ move+1 ] = node.children[move]
	end
	return NewNode(node, insertIndex , element_type)	
end

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

function Gause( init, spread)
	local r = 0
	local nRan = 5
	for i = 1, nRan do
		r = r + Number.random()
	end
	r = ( ( r / nRan ) - 0.5 ) * spread + 0.5
	if init < 0.5 then
		r = r ^ ( Number.log( init ) / Number.log( 0.5 ) )
	else
		r = 1 - ( 1 - r ) ^ ( Number.log( 1 - init ) / Number.log( 0.5 ) )
	end
	return r
end

function Mutate( node, mutateParams )
	if node.element_type == "bodysolid" then
		local shapeParams = { "bias", "flatness", "cubosity", "asymmetry" }
		for i, param in shapeParams do
			if Number.random() < mutateParams.rate and node[ param ] ~= nil then
				SetAttributeInMirrorGroup( myRootNode, node.mirror_group, param, Gause( node[ param ], mutateParams.shapeChange ), node.phi )
			end
		end
		local scaleParams = {"scalex", "scaley", "scalez"}
		for i, param in scaleParams do
			if Number.random() < mutateParams.rate and node[ param ] ~= nil then
				local new = Gause( ( node[ param ] - 0.1 ) / ( 3 - 0.1 ), mutateParams.scaleChange ) * ( 3 - 0.1 ) + 0.1
				SetAttributeInMirrorGroup( myRootNode, node.mirror_group, param, new, node.phi )
			end
		end
		if Number.random() < mutateParams.rate and node.theta ~= nil then
			local new = Gause( ( node.theta + 90 ) / 180, mutateParams.positionChange ) * 180 - 90
			SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "theta", new, node.phi )
		end
		if Number.random() < mutateParams.rate and node.phi ~= nil and Number.abs( node.phi ) > 2 then
			local new = Gause( ( node.phi + 180 ) / 360, mutateParams.positionChange ) * 360 - 180
			SetAttributeInMirrorGroup( myRootNode, node.mirror_group, "phi", new, node.phi )
		end

		local scaleParams = {"scalex", "scaley", "scalez"}
		for i, param in scaleParams do
			if Number.random() < mutateParams.rate and node[ param ] ~= nil then
				local new = Gause( ( node[ param ] - 0.1 ) / ( 3 - 0.1 ), mutateParams.scaleChange ) * ( 3 - 0.1 ) + 0.1
				SetAttributeInMirrorGroup( myRootNode, node.mirror_group, param, new, node.phi )
			end
		end
	end
	for index, value in node.children do
		if value.element_type == "bodysolid" and Number.random() < mutateParams.cloneRate then
			local new = Clone( value )
			new.theta = Gause( ( new.theta + 90 ) / 180, 1 ) * 180 - 90
			local offCentre = Number.abs( new.phi ) > 2
			if offCentre then
				new.phi = Gause( ( new.phi + 180 ) / 360, 1 ) * 360 - 180
			end
			if Number.random() > 0.5 then
				local newPart = MessageClonePart( new, node.partId )
				if offCentre then
					MessageMirrorPart( newPart )
				end
			else
				local newPart = MessageClonePart( new, value.partId )
			end
			return
		end
		if value.element_type == "bodysolid" and Number.random() < mutateParams.removeRate then
			MessageDeletePart( value.partId )
			return
		end
		Mutate( value, mutateParams )
	end
end


function MessageMutate( mutateParams )
	Mutate( myRootNode, mutateParams )
	UpdatePositions( myRootNode, false )
end
