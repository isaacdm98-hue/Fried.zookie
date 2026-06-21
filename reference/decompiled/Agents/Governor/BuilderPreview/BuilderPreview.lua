# BuilderPreview specializes Agent embeds Input, Camera, GUI, Visual

function Initialize( left, top, right, bottom, comboLeft, comboTop, comboRight )
	myWorld = World.Create(2)
	myDistance = 2
	myYaw = 0
	myAngle = 1
	myPartDirectory = ""
	myTarget = Vector.New(0,0,0)

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
	
	local y = top

	GUI.CreateCombo( "parts", "", comboLeft, comboTop+4, comboRight-32, comboTop+24, "Fonts/Edit.met" )
	GUI.SetHelpText( Segment.parts, "Choose Component From Library" )
	y = y + 24

	local mid = (left + right) / 2
	AddButton( "store_button", comboRight-32, comboTop, "OpenFileObj2" )
	GUI.SetHelpText( Segment.store_button, "Save Component To Library" )
	y = y + 32

	local marg = 8
	Camera.Create( left+marg, top+marg, right-marg, bottom-marg  )
	GUI.CreateBorder( "tv",  left, top, right, bottom, 64, 0, 128,64, 1 )
	Camera.SetBackground( 1, 1, 1, 0 )
	GUI.CreateSlider( "zoom_slider", right - 16, y, right, bottom )
	local z = 0.5
	myDistance = 2^(z*2)-0.8
	GUI.SetValue( Segment.zoom_slider, z )

end

function AddButton( name, x, y, iconRoot )
	iconRoot = "UI\\Buttons\\UI_"..iconRoot
	GUI.CreateButtonEx( name, x, y, x + 32, y + 32, iconRoot.."_Up.png", iconRoot.."_Dn.png", iconRoot.."_Ov.png" )
end

function MessageShow( visible )
	Camera.Show( visible )
	GUI.Show( Segment.store_button, visible )
	GUI.Show( Segment.zoom_slider, false )
	GUI.Show( Segment.parts, visible )
	GUI.Show( Segment.tv, visible )
end


function MessageSetDirectory( partDirectory, textureDirectory )
	myPartDirectory = partDirectory
	myTextureDirectory = textureDirectory
	PopulateParts()
end

function PopulateParts()
	local files = System.GetDirectoryContents(myPartDirectory, "*.*", 1)
	GUI.SetListText( Segment.parts, files )
	if files[1] ~= nil then
		GUI.SetText( Segment.parts, files[1] )
		ShowPart()
	end
end

function Finalize()
	World.Destroy( myWorld )
end

function MessageDestroy()
	Agent.Destroy()
end

function MessageClonePart( partTable, parentPart )
	World.OpenAccess(myWorld)
		GUI.SetText( Segment.parts, "(copied part)" )
		Agent.SendMessage( "ClonePart", myBuilderParts, partTable, parentPart )
		AutoZoom()
	World.CloseAccess()
	return 0
end

function MessagePartTable( part )
	retValue = Agent.SendMessage( "PartTable", myBuilderParts, part )
	return retValue
end

function SystemUIChange( segment )
	if segment == Segment.store_button then
		if String.strfind(myPartDirectory, Config.Get("default_teams_directory", "")) ~= nil then
			Agent.Create( "TextEntry", Agent.Me(), "Part name", "", "TextEntryOK", 1 )
		else
			Agent.Create("Alert", "This zook is read-only.", nil, nil, nil)
		end
	end
	if segment == Segment.zoom_slider then
		local z = GUI.GetValue( Segment.zoom_slider )
		myDistance = 2^(z*2)-0.8
	end
	if segment == Segment.parts then
		ShowPart()
	end
end

function ShowPart()
	World.OpenAccess(myWorld)
		Agent.SendMessage( "Load", myBuilderParts, myPartDirectory.."/"..GUI.GetText( Segment.parts ), myTextureDirectory, "", false )
		AutoZoom()
	World.CloseAccess()
end

function AutoZoom()
	local r
	myTarget, r = Agent.SendMessage( "BoundingSphere", myBuilderParts )
	myDistance = r * 1.2
end

function MessageTextEntryOK(file )
	Agent.SendMessage( "Save", myBuilderParts, myPartDirectory.."/"..file )
	PopulateParts()
	GUI.SetText( Segment.parts, file )
	ShowPart()
end


function SystemCamera( frametime )
	myYaw = myYaw + frametime * 50
	local y = Number.sin( myAngle ) * myDistance
	local r = Number.cos( myAngle ) * myDistance
	local z = r * Number.cos( myYaw )
	local x = r * Number.sin( myYaw )
	Camera.SetPosition( Vector.New( x, y, z )  + myTarget)
	Camera.SetTarget( myTarget, Vector.New( 0, 1, 0 ) )
end

