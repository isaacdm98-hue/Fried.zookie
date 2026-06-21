# ZookPreview specializes Agent embeds Camera, Visual

function Initialize( left, top, right, bottom )
	myDistance = 5
	myYaw = 0
	myAngle = 30
	myWorld = World.Create( 2 )
	World.OpenAccess( myWorld )
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
		Camera.Create( left, top, right, bottom )
	World.CloseAccess()
end

function MessageResize( left, top, right, bottom )
	Camera.Resize( left, top, right, bottom )
end

function Finalize()
	Agent.SendMessage( "Destroy", myBuilderParts )
	World.Destroy( myWorld )
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

function MessageShow( show )
	Camera.Show( show )
end

function MessageDestroy()
	Agent.Destroy()
end

function MessageMutate(params)
	Agent.SendMessage( "Mutate", myBuilderParts, params )
end

function MessageGetTable()
	return Agent.SendMessage( "GetTable", myBuilderParts )
end

function MessageSetTable( table )
	Agent.SendMessage( "SetTable", myBuilderParts, table )
end


function MessageLoad( team, creature, version )
	if team == nil then
		-- presume creature is full path from app data
		--local fullPath = Config.Get("product_directory", ".").."/"..creature
		local fullPath = creature
		local texturePath = System.GetLabeledPath("ROOT").."/NewTeam/Textures"
		Agent.SendMessage( "Load", myBuilderParts, fullPath, texturePath, creature, false )
	else
		Agent.SendMessage( "Load", myBuilderParts, team.."/Creatures/"..creature.."/"..version..".zook",
			team.."/Textures", creature, false )
	end
end

