#Evo specializes BaseTarget embeds Genome, Visual, Karma, Neural, Input, Sound



function StaticInject(filename)
	if (filename == nil) then
		filename = "simple.zook"
	end

	for k = 1, 1 do
		Agent.Create("Evo", Vector.New((k-1)*5,0,5), Quatn.New(), filename, 1,0,0)
	end
end



function Initialize(pos, rot, genomeFile, initPos, boxy, fixed)
	
	local worldScale = Config.Get("worldscale",1)
	myScale = Vector.New(1,1,1) * worldScale
	pos = pos * worldScale
	
	-- flag for stoping and starting neurons
	myAmStopping = false

	Hits = {} -- used to process hit segments
	Magic_Weapon_Speed = 10.0 --?

	
	-- load genome and create internal genes
	Genome.Load(genomeFile, Config.Get("genome_rhesus_macaque", ""))
	MakeNeuralSystem()

	local groundHeight = 0
	--MakeMetabolism() 
	local land = Config.Get("theLand",Agent.Null())
	if Agent.IsValid(land) then
		local p = Agent.SendMessage("Height", land, pos)
		local height = Vector.GetY( p )
		--Trace( "land height %", height )
		if height > groundHeight then
			groundHeight = height
		end
	end
	--pos = pos + Vector.New( 0, groundHeight, 0 )

	local test = pos + Vector.New( 0, 100, 0 )
	
	local agent, segment, point = Visual.Ray( test, test + Vector.New( 0, -1000, 0) )
	Trace( "segment %, point %",segment, point )
	if segment ~= 0 then
		groundHeight = Vector.GetY( point )
	end
	--~ local rayHeight = Karma.RayDistance( test, test + Vector.New( 0, -1000, 0) )
	--~ Trace( " pos %   test %   rayheight %", pos, test, rayHeight )
	--~ if rayHeight > 0 then
		--~ groundHeight = Vector.GetY( test ) - rayHeight
	--~ end

	local minx, miny, minz, maxx, maxy, maxz = MessageBoundingBox()
	--if not fixed then
		--pos = Vector.New( Vector.GetX( pos ),  groundHeight-miny, Vector.GetZ( pos ) )
		--	- Vector.New( 0, 0, minz ) * rot
		pos = pos - Vector.New( 0, miny, minz ) * rot
	--end

	
	-- Calc Position of evo relative to camera or origin
	-- flags - a generic set of boolean flags for construction settings
	-- name	bit	setting	effect
	-- BuildLocal	1	off		create position relative origin
	-- 		1	on		create position relative to camera
	--~ if initPos == 1 then
		--~ local theCamera = Config.Get("theCamera",Agent.Me())
		--~ local camPos = Agent.SendMessage("Position",theCamera)
		--~ local camOri = Agent.SendMessage("Rotation",theCamera)
		--~ local targetPos = pos * camOri
		--~ pos = targetPos + camPos
		--~ --Trace("Placing creature near camera at %", pos)
	--~ elseif initPos == 2 then
	--~ else
		--~ local land = Config.Get("theLand",Agent.Null())
		--~ if Agent.IsValid(land) then
			--~ pos = Agent.SendMessage("Height", land, pos)
			--~ pos = pos + Vector.New(0,1.5,0)
		--~ end
		--~ --Trace("Placing creature over land at %", pos)
	--~ end
	
	
	-- Instanciate Creature

	-- Deduce texture path from genome filename for the time being, else from config setting (temp zook files use config setting)
	local texturePath 
	if String.strfind( genomeFile, "Creatures" ) ~= nil then
		texturePath = String.strsub( genomeFile, 1, String.strfind( genomeFile, "Creatures" )-1 ).."Textures"
	else
		texturePath = Config.Get("texture_path", "")
	end
		
	Genome.Express(pos, rot, myScale, boxy, texturePath)
	mySegmentEnd = Segment.root_segment
	while Segment.Exists(mySegmentEnd) do
		mySegmentEnd = mySegmentEnd + 1
	end
	if fixed then
		Karma.CreateRod( "rod_connector", Segment.root_segment, 0 )
	end
	
	-- add biochemistry
	Bio = {}
	Bio.Hardness = {}
	Bio.Health = {}
	local total_seg = Segment.root_segment
	while Segment.Exists(total_seg) do
		total_seg = total_seg + 1
	end
	local seg = Segment.root_segment
	 while seg ~= total_seg do
		Bio.Health[seg] = 10
		Bio.Hardness[seg] = 20
		 seg = seg + 1
	end
		
	AffirmCreation(Segment.root_segment)
	
	Karma.SetAgentCollidabilityOff()
	--Karma.AddContactAttributeToAll("Evo", 1)

	Agent.SetTimer("Update", Agent.Me(), "update", .10)

	
	
	-- myTargeter used to monitor a segment to follow and have other targeting features
	myTargeter = Agent.Create("Targeter") 
	


	-- Debug features
	AddButton("Destroy", "Destroy","red")
	AddButton("Mutate", "Mutate","green")
	AddSegmentButton("Hit", "Hit","green")
	AddSegmentButton("Sever", "Sever","green")
	
	
	
end

function MessageFix( position )
	local x, y, z = Vector.GetXYZ( position )
	local agent, segment, hit = Visual.Ray(  Vector.New( x, 0.1, z ), Vector.New( x, 1000, z ))
	if segment ~= 0 and Equals( agent, Agent.Me() ) then
		Karma.CreateRod( "rod_connector", segment, 0 )
	else
		Karma.CreateRod( "rod_connector", Segment.root_segment, 0 )
	end
	
end


function Finalize()

	Agent.SendMessage("Destroy", myTargeter) 

end




-- Timer behaviours ------------------------------------------------------------------------------------------------------------

function TimerUpdate()

	-- action is a string
	Neural.SetHighLevelBrainAction("gait_1")
	
	-- get the information from the target and send it to the neural network
	-- Vector position & Quatn rotation
	-- Neural.SetHighLevelBrainTargetPosition(position, rotation)
	local targPos = Agent.SendMessage("Position", myTargeter)
	Neural.SetHighLevelBrainTargetPosition(targPos, Quatn.New())

	--Trace("position %, target %", MessagePosition(), targPos)
	
	DoDamage()
	
end



-- Contact Stuff -------------------------------------------------------------------------------------------------------------


function SystemCollision(agent, my_segment_hit, other_agents_segment_hit, contacts)

	BaseTarget__SystemCollision(agent, my_segment_hit, other_agents_segment_hit, contacts)
--	CollisionDamage(agent, my_segment_hit, other_agents_segment_hit, contacts)

end


function CollisionDamage(agent, my_segment_hit, other_agents_segment_hit, contacts)

	local sound = false
	if Segment.Exists(my_segment_hit) then
		local delta = -1
		local my_hardness = Bio.Hardness[my_segment_hit]

			
		
		local other_hardness = Agent.SendMessage("Hardness", agent, other_agents_segment_hit)
		if other_hardness == nil then
			return
		end
		if(other_hardness > my_hardness) then 
			local ws = Agent.SendMessage("SegmentSpeed",agent, other_agents_segment_hit )
			--Trace("Weapon Speed was %", ws)
			if ws > Magic_Weapon_Speed then
				--Show particle effect number 2
				for index, value in contacts do
					local matrix = Matrix.New()
					Matrix.SetTranslation( matrix, value.position  )
					Matrix.LookAt( matrix, value.position + value.normal, Vector.New( 0, 0, 1 )  )
					local pMatrix = Visual.GetTransform( my_segment_hit )
					Matrix.FastInverse( pMatrix )
					Visual.AddEmitter( my_segment_hit, matrix * pMatrix, 2 )
				end
			
				local damage = (other_hardness-my_hardness) * delta
				HitMe(my_segment_hit, damage)
				else
				--sound = "glance.wav"
			end
		else
			--Sound.Play("touch.wav")
		end
	end

end

function HitMe(segmentID, amount)

	local found = 0
	for k, v in Hits do
		if v == "hit" then
			if k.segment == segmentID then
				if k.damage > amount then
					k.damage = amount
				end
				found = 1 
			end
		end
	end
	if found == 0 then
	--	--Trace("making Hit entry (%,%)",segmentID,amount)
		local newHit = {segment = segmentID, damage = amount,}
		Hits[newHit] = "hit"

	end
end


function DoDamage()
--	--Trace("Damage Testing")
	for k, v in Hits do
		if v == "hit" then
			local sound = "hit.wav"
			Bio.Health[k.segment] = Bio.Health[k.segment]  - k.damage

			if Bio.Health[k.segment] <= 0 then
				sound = "break.wav"
				MessageSever(k.segment)
			end
			Sound.Play(sound)
		end
	end
	Hits = nil
	Hits = {}

end


function MessageHardness(segment)
	if Segment.Exists(segment) then
		return Bio.Hardness[segment]
	else
		return -1
	end
end


function MessageSegmentSpeed(segmentID)
	return Vector.GetLength(Karma.GetLinearVelocity(segmentID))
end


function MessageNetSize()
	return Neural.GetNumNeurons()
end

function MessageHit(segmentID)	
	--Trace("Hit segment %", segmentID)
end



function MessageSever(segmentID)	
	--Trace("Sever segment %", segmentID)
	if (segmentID ~= nil) then
		if (segmentID == Segment.root_segment) then
			local conectors = Karma.GetChildConnectors(segmentID)
			for index, value in conectors do
				Segment.Destroy(value)
			end
		else
			local conectors = Karma.GetParentConnectors(segmentID)
			for index, value in conectors do
				local body1, body2 = Karma.GetConnectorBodies(value)
				if body1 then
					local matrix = Visual.GetTransform( segmentID )
					local scale  = Visual.GetScale( segmentID )
					local vector = Vector.New( 0, 0, -Vector.GetZ( scale )/2 ) * matrix
					Matrix.SetTranslation( matrix, vector  )
					local pMatrix = Visual.GetTransform( body1 )
					Matrix.FastInverse( pMatrix )
					Visual.AddEmitter( body1, matrix * pMatrix, 1 )
				end
				Segment.Destroy(value)
			end
		end
	end
end





-- General Messages ------------------------------------------------------------------------------------------------------------------------------


function MessageDestroy()	
	Agent.Destroy()
end


function MessageSetTarget(data)	
	-- sets my target to follow the given segment
	--Trace("Setting evo target agent: %, segment %", agent, segment)
	Agent.SendMessage("SetTarget", myTargeter, data) 
end


function MessageOrientation()
	return Karma.GetRotation(Segment.root_segment)
end


function MessageMutate()	
	
	--Genome.ModifyBodySolid(Segment.root_segment,"scalex", "10")	
	--Genome.ReExpress(Segment.root_segment)
	
	
	local mutationLog = Genome.Mutate("test.mp-ml", 10)
	
	--Trace(mutationLog)
	
	--Trace("munge")
	Genome.Express(MessagePosition() +Vector.New(0,3,0), MessageOrientation(), Vector.New(1,1,1))
end


function MessageShoot( segment, point, dir, strength )

--MessageSever(Segment.root_segment)
--return

	dir = Vector.Normalise( dir )
	dir = strength * dir
	Karma.AddImpulse( segment, dir, point )
end

function MessageStopMoving(data)

	local speed = data.speed

	local step = 0.0001
	if speed == 5 then
		step = 0.005
	elseif speed == 4 then
		step = 0.015
	elseif speed == 3 then
		step = 0.05
	elseif speed == 2 then
		step = 0.15
	elseif speed == 1 then
		step = 0.5
	end
	Neural.SetNeuronProperty( Segment.root_segment, "MasterAmplitude", "time_max", 0.5 )
	Neural.SetNeuronProperty( Segment.root_segment, "MasterAmplitude", "time_interval", -step )
	myAmStopping = 1
	Agent.PostMessage("FreezeNeural", Agent.Me(), 0.5)
end



function MessageFreezeNeural()

	if Equals(Agent.From(), Agent.Me()) == false then
		--internal message only
		return
	end

	if myAmStopping == false then
		-- has restarted before completed neural stop so do nothing
		return
	end

	Neural.SetActive(false)
	myAmStopping = false

end


function MessageStartMoving(data)

	local speed = data.speed
	myAmStopping = false
	Neural.SetActive(1)


	local step = 0.0001
	if speed >= 4.5 then
		step = 0.005
	elseif speed >= 3.5 then
		step = 0.015
	elseif speed  >= 2.5 then
		step = 0.05
	elseif speed >= 1.5 then
		step = 0.15
	elseif speed >= 0.5 then
		step = 0.5
	--~ else
		--~ step = 1
	end
	Neural.SetNeuronProperty( Segment.root_segment, "MasterAmplitude", "time_min", 0 )
	Neural.SetNeuronProperty( Segment.root_segment, "MasterAmplitude", "time_interval", step )
end

function MessageSmoothStop()
	MessageStopMoving({speed = 5})
end

function MessageSmoothStart()
	MessageStartMoving({speed = 5})
end

-- preconfigured messages to start/stop zooks at different speeds

-- Metabolism Stuff -------------------------------------------------------------------------------------

function MakeChemical(name, amount)
	local bucket = {}
	bucket.name = name
	bucket.value = amount
	return bucket
end


function MakeReaction(name,rate)
	local reaction = {}
	reaction.name = name
	reaction.rate = rate
	return reaction
end

chemical = {	name = "unnamed",
		value = 0,
		}
		
reaction= {	name = "unnamed",
		ExchangeRate = 0,
		}
		
move = function(edge)
	local source = edge.GetSource()
	local dest = edge.GetDestination()
--	print(source.name, " = ",source.value)
	--print(dest.name," = ",dest.value)
	--Trace("% = %",source.name,source.value)
	--Trace("% = %",dest.name,dest.value)

	source.value = source.value - edge.ExchangeRate
	dest.value = dest.value + edge.ExchangeRate
end



function MakeMetabolism()
	--Trace("could be this")
	local bob = MakeGraph(chemical, reaction)

	local fat = bob.AddNode("Fat")
	fat.value = 100
	fat.name = "fat"
	
	energy = bob.AddNode("Energy")
	energy.name = "Energy"
	bob.AddNode("lactic Acid")
	local me = bob.AddEdge("Fat","Energy")
	me.ExchangeRate = 1
	--Trace("nope wasnt that")
end



-- Evo Creation Of Neural -----------------------------------------------------------------------------------------------------------------------	

function MakeNeuralSystem()
	myGenomeTable = Genome.GetAsTable()
	myRootNode = FindFirstDescendantOfType( myGenomeTable, "bodysolid" )
	UpdatePositions( myRootNode, false, Vector.New(0, 0, 0) )
	AddRootBits()
	UpdateIK( myRootNode, false )
	Genome.SetFromTable( myGenomeTable )
end



function AddParameter( name, value )
	local zook = FindAncestorOfType( myRootNode, "zook" )
	local paras = FindChildOfType( zook, "parameters" )
	local para = FindChildWithName( paras, name)
	if para == nil then
		para = AddChild( paras, "parameter" )
		para.name = name
	end
	para.value = value
end



function AddRootBits()
	
	local group = "General"

	if myRootNode.zook_speed ~= nil then
		myRootNode.IKspeed = 0.03 * myRootNode.zook_speed
	end
	AddParameter( "IKspeed", myRootNode.IKspeed )
	local neural = AddChild( myRootNode, "neural" )
	local target = AddChild( neural, "neuron" )
	target.group = group
	target.name = "Target"
	target.bound = false

	local accumulatorfunction = AddChild( target, "accumulatorfunction_target" )
	accumulatorfunction.angle_deviance = 3.14
	accumulatorfunction.sensitivity = 0.3184
	accumulatorfunction.type = "X_Angle"
	local transferfunction = AddChild( target, "transferfunction_scale" )
	transferfunction.scale = 1.0

	if myRootNode.turn_sharpness ~= nil then
		myRootNode.minAmplitude = 1 - myRootNode.turn_sharpness * 2
	end
	local minAmplitude= tonumber( myRootNode.minAmplitude )
	if myRootNode.turn_smoothness ~= nil then
		myRootNode.minAngle = 180 * myRootNode.turn_smoothness
	end
	local minAngle = tonumber( myRootNode.minAngle ) / 180

	AddAmplitudeRamp( neural, group )
	
	if minAmplitude < 0 then
		local x = - minAngle / (minAmplitude-1)
		AddTargetMap( neural, group, "LeftForward", { -1, 1, 0, 1, x, 0, 1, 0 } )
		AddTargetMap( neural, group, "RightForward", { -1, 0, - x, 0, 0, 1, 1, 1 } )
		AddTargetMap( neural, group, "LeftReverse", { -1, 0, x, 0, minAngle, -minAmplitude, 1, -minAmplitude } )
		AddTargetMap( neural, group, "RightReverse", { -1, -minAmplitude, -minAngle, -minAmplitude, -x, 0, 1, 0 } )
	else
		AddTargetMap( neural, group, "LeftForward", {-1, 1, 0, 1, minAngle, minAmplitude, 1,  minAmplitude} )
		AddTargetMap( neural, group, "RightForward", { -1, minAmplitude, -minAngle, minAmplitude, 0, 1, 1, 1 } )
		AddTargetMap( neural, group, "LeftReverse", { -1, 0, 1, 0 } )
		AddTargetMap( neural, group, "RightReverse", { -1, 0, 1, 0 } )
	end

	local max_spine_angle = tonumber( myRootNode.max_spine_angle )/90
	local min_spine_target_angle = tonumber( myRootNode.minAngle ) / 180
	AddTargetMap( neural, group, "SpineSteering", {-1, -max_spine_angle,
		-min_spine_target_angle, -max_spine_angle, 
		min_spine_target_angle, max_spine_angle, 
		1, max_spine_angle } )
end

function AddAmplitudeRamp( neural, group )
	local neuron = AddChild( neural, "neuron" )
	neuron.group = group
	neuron.name = "MasterAmplitude"
	local accumulator = AddChild( neuron, "accumulatorfunction_timer" )
	accumulator.timeinterval = 0.005
	local map = AddChild( neuron, "transferfunction_map" )
	local pairs = {0,0, 0.5,1}
	for i = 1, getn( pairs ), 2 do
		local pair = AddChild( map, "pair" )
		pair.x = pairs[i]
		pair.y = pairs[i+1]
	end
end

function AddTargetMap( neural, group, name, pairs )
	local neuron = AddChild( neural, "neuron" )
	neuron.group = group
	neuron.name = name.."Source"
	AddChild( neuron, "accumulatorfunction_sum" )
	local map = AddChild( neuron, "transferfunction_map" )
	for i = 1, getn( pairs ), 2 do
		local pair = AddChild( map, "pair" )
		pair.x = pairs[i]
		pair.y = pairs[i+1]
	end
	local dendrite = AddChild( neuron, "dendrite" )
	dendrite.weight = "1.0"
	local explicit = AddChild( dendrite, "source_explicit" )
	explicit.source_name = "Target"

	local mix_neuron = AddChild( neural, "neuron" )
	mix_neuron.group = group
	mix_neuron.name = name
	AddChild( mix_neuron, "accumulatorfunction_multiply" )
	AddChild( mix_neuron, "transferfunction_scale" ).scale = 1.0

	local amp_dendrite = AddChild( mix_neuron, "dendrite" )
	amp_dendrite.weight = "1.0"
	local amp_explicit = AddChild( amp_dendrite, "source_explicit" )
	amp_explicit.source_name = "MasterAmplitude"

	local source_dendrite = AddChild( mix_neuron, "dendrite" )
	source_dendrite.weight = "1.0"
	local source_explicit = AddChild( source_dendrite, "source_explicit" )
	source_explicit.source_name =  name.."Source"
end

function GetNodeSide( node )
	local side = "Auto"

	if node.ik_side ~= nil then
		side = node.ik_side
		if side == "Left side" then side = "Left" end
		if side == "Right side" then side = "Right" end
	end
	
	if side == "Auto" then
		local invRoot = Clone( myRootNode.worldTrans )
		Matrix.FastInverse( invRoot )
		local x = Vector.GetX( GetNodeEnd( node ) * invRoot )
		if x < -0.01 then
			side = "Left"
		elseif x > 0.001 then
			side = "Right"
		else
			side = "Always"
		end
	end
	return side
end


function MakeIKControlNeurons( node, group, side )

	local neural = FindChildOfType( node, "neural" )
	neural.monitor = "no"
	AddAxisControl( neural, group, side, "x" )
	AddAxisControl( neural, group, side, "y" )

end

function AddAxisControl( neural, group, side, axis )
	local mix = AddChild( neural, "neuron" )
	mix.group = group
	AddChild( mix, "accumulatorfunction_multiply" )
	AddChild( mix, "transferfunction_scale" ).scale = 1.0
	mix.name = axis.."_mix"
	mix.bound = false

	local axon = AddChild( mix, "axon" )
	axon.destination = axis.."_rotation"
	axon.weight = "1.0"
		
	if side ~= "Always" then
		local headDendrite = AddChild( mix, "dendrite" )
		headDendrite.weight = "1.0"
		local ancestor = AddChild( headDendrite, "ancestor" )
		ancestor.source_body = "Head"
		ancestor.source_name = side.."Forward"

		local mixReverse = AddChild( neural, "neuron" )
		mixReverse.group = group
		AddChild( mixReverse, "accumulatorfunction_multiply" )
		AddChild( mixReverse, "transferfunction_scale" ).scale = 1.0
		mixReverse.name = axis.."_mix_reverse"
		mixReverse.bound = false
	
		local axon = AddChild( mixReverse, "axon" )
		axon.destination = axis.."_rotation"
		axon.weight = "1.0"
		
		local headDendriteR = AddChild(mixReverse, "dendrite" )
		headDendriteR.weight = "1.0"
		local ancestor = AddChild( headDendriteR, "ancestor" )
		ancestor.source_body = "Head"
		ancestor.source_name = side.."Reverse"

		local signalDendrite = AddChild( mixReverse, "dendrite" )
		signalDendrite.weight = "1.0"
		local xExplicit = AddChild( signalDendrite, "source_explicit" )
		xExplicit.source_name = axis.."_control_r"
	else
		local headDendrite = AddChild(mix, "dendrite" )
		headDendrite.weight = "1.0"
		local ancestor = AddChild( headDendrite, "ancestor" )
		ancestor.source_body = "Head"
		ancestor.source_name = "MasterAmplitude"

	end
	
	local signalDendrite = AddChild( mix, "dendrite" )
	signalDendrite.weight = "1.0"
	local xExplicit = AddChild( signalDendrite, "source_explicit" )
	xExplicit.source_name = axis.."_control"
end


function AddTimerMapNeuron( neural, group, name )
	local neuron = AddChild( neural, "neuron" )
	neuron.group = group
	neuron.name = name
	local accumulator = AddChild( neuron, "accumulatorfunction_timer" )
	accumulator.timeinterval = "IKspeed"
	local rotation = AddChild( neuron, "transferfunction_map" )
	rotation.wrap = 1.0
	return rotation
end

function AddPair( node, x, y )
	local pair = AddChild( node, "pair" )
	pair.x = x
	pair.y = y
end

function UpdateTwoLink( upper, group, lower )
	
	local footOrigin = GetNodeEnd( lower )
	local upperLength = Vector.GetLength( GetNodeConnect( upper ) - GetNodeConnect( lower ) )
	local lowerLength = lower.scalez

	--We'll need the foot target and knee target relative to the upper connect point
	local upperTrans = Clone( upper.worldTrans )
	Matrix.SetTranslation( upperTrans, GetNodeConnect( upper ) )
	local invUpper = Clone( upperTrans )
	Matrix.FastInverse( invUpper )

	local relLower = Clone( lower.worldTrans )
	Matrix.SetTranslation( relLower, GetNodeConnect( lower ) )
	relLower = relLower * invUpper
	
	--local kneeNear = MessagePartConnect( lower.partId ) * invUpper
	local kneeTemp = Vector.Cross(  GetNodeConnect( lower ) - GetNodeConnect( upper ), 
		GetNodeEnd( lower ) - GetNodeConnect( lower ) )
	local kneeDirection = Vector.Normalise( Vector.Cross( GetNodeEnd( lower ) - GetNodeConnect( upper ), kneeTemp ) )
	kneeDirection = kneeDirection * invUpper - Matrix.GetTranslation( invUpper )

	local upperNeural = FindChildOfType( upper, "neural" )
	local lowerNeural = FindChildOfType( lower, "neural" )

	local upperXRotation = AddTimerMapNeuron( upperNeural, group, "x_control" )
	local upperYRotation = AddTimerMapNeuron( upperNeural, group, "y_control" )
	local lowerXRotation = AddTimerMapNeuron( lowerNeural, group, "x_control" )
	local lowerYRotation = AddTimerMapNeuron( lowerNeural, group, "y_control" )

	local upperXRotationR = AddTimerMapNeuron( upperNeural, group, "x_control_r" )
	local upperYRotationR = AddTimerMapNeuron( upperNeural, group, "y_control_r" )
	local lowerXRotationR = AddTimerMapNeuron( lowerNeural, group, "x_control_r" )
	local lowerYRotationR  = AddTimerMapNeuron( lowerNeural, group, "y_control_r" )

	local ikOriginal = FindChildOfType( lower, "ik2_positions" )
	if ikOriginal == nil then
		ikOriginal = FindChildOfType( lower, "ik_positions" )
	end
	local ikData = Clone( ikOriginal )
	local nPairs = getn(ikData.children)
	ikData.children[ nPairs + 1 ] = ikData.children[ 1 ]
	myDebugElbowPositions = {}
	for index, value in ikData.children do
		local footTarget = footOrigin + Vector.New( value.x + 0, value.y + 0, value.z + 0 )
		--Trace( "Foot Target: %",  footTarget )
		local relFootTarget = footTarget * invUpper
		--Trace( "Relative Foot Target: %",  relFootTarget )
		--Trace( "kneeNear: %",  kneeNear )
		local relKneeTarget = ElbowPosition2( relFootTarget, kneeDirection, upperLength, lowerLength )
		myDebugElbowPositions[index] = relKneeTarget * upperTrans
		local x, y, z = Vector.GetXYZ( relKneeTarget )
		--Trace( "relKneeTarget: %",  relKneeTarget )

		local r = Number.sqrt( x * x + z * z )
		local xAngle = -Number.atan2( x, z )
		local yAngle = Number.atan2( y, r )

		local upperTrans = Matrix.New()
		local xRotMat = Matrix.New()
		local yRotMat = Matrix.New()
		Matrix.RotateY( xRotMat, -xAngle )
		Matrix.RotateX( yRotMat, -yAngle )
		local lowerTrans = relLower * yRotMat * xRotMat
		Matrix.FastInverse( lowerTrans )
		
		local relFootTargetLower = relFootTarget * lowerTrans
		local x2, y2, z2 = Vector.GetXYZ( relFootTargetLower )

		local r2 = Number.sqrt( x2 * x2 + z2 * z2 )
		local xAngle2 = -Number.atan2( x2, z2 )
		local yAngle2 = Number.atan2( y2, r2 )

		local t = (index-1)/nPairs
		AddPair( upperXRotation, t, xAngle/90 )
		AddPair( upperYRotation, t, yAngle/90 )

		AddPair( lowerXRotation, t, xAngle2/90 )
		AddPair( lowerYRotation, t, yAngle2/90 )

		AddPair( upperXRotationR, 1-t, xAngle/90 )
		AddPair( upperYRotationR, 1-t, yAngle/90 )

		AddPair( lowerXRotationR, 1-t, xAngle2/90 )
		AddPair( lowerYRotationR, 1-t, yAngle2/90 )
		
	end

	local phase = lower.leg_phase
	if phase == nil then
		phase = 0
	end
	phase = phase + 0
	upperXRotation.phase = phase
	upperYRotation.phase = phase
	lowerXRotation.phase = phase
	lowerYRotation.phase = phase
	upperXRotationR.phase = phase
	upperYRotationR.phase = phase
	lowerXRotationR.phase = phase
	lowerYRotationR.phase = phase
	
end

--~ function ElbowPosition( target, elbowNear, upperLength, lowerLength )
	--~ local targetDist = Vector.GetLength( target )
	--~ local targetDir = Vector.Normalise( target )

	--~ -- Calculate circle ( cAbs, r) on which elbow must lie
	--~ if targetDist > ( lowerLength + upperLength ) * 0.99 then
		--~ targetDist = ( lowerLength + upperLength ) * 0.99
	--~ end

	--~ local d = ( upperLength * upperLength - lowerLength * lowerLength + targetDist * targetDist ) /
		--~ ( 2 * targetDist )
	--~ local r = Number.sqrt( upperLength * upperLength - d * d )

	--~ local cAbs = targetDir * d

	--~ -- Find point on circle nearest to point given (elbowNear)

	--~ local eRel = elbowNear - cAbs;
	--~ eRel = ( eRel - targetDir * Vector.Dot( targetDir, eRel ) ) * ( r / Vector.GetLength( eRel ) )

	--~ return eRel + cAbs
--~ end

function ElbowPosition2( target, elbowDirection, upperLength, lowerLength )
	local targetDist = Vector.GetLength( target )
	local targetDir = Vector.Normalise( target )

	-- Calculate circle ( cAbs, r) on which elbow must lie
	if targetDist > ( lowerLength + upperLength ) * 0.99 then
		targetDist = ( lowerLength + upperLength ) * 0.99
	end

	local d = ( upperLength * upperLength - lowerLength * lowerLength + targetDist * targetDist ) /
		( 2 * targetDist )
	local r2 = upperLength * upperLength - d * d
	local r = 0
	if r2 > 0 then
		r = Number.sqrt( r2 )
	end

	local cAbs = targetDir * d

	-- Find point on circle nearest to point given (elbowNear)
	local eRel = elbowDirection - targetDir * Vector.Dot( elbowDirection, targetDir )
	
	eRel = eRel * ( r / Vector.GetLength( eRel ) )

	return eRel + cAbs
end

function UpdateOneLink( node, group )
	
	local footOrigin = GetNodeConnect( node )

	--We'll need the foot target and knee target relative to the  connect point
	local inv = Clone( node.worldTrans )
	Matrix.SetTranslation( inv, footOrigin )
	Matrix.FastInverse( inv )

	local neural = FindChildOfType( node, "neural" )

	local xRotation = AddTimerMapNeuron( neural, group, "x_control" )
	local yRotation = AddTimerMapNeuron( neural, group, "y_control" )

	local xRotationR = AddTimerMapNeuron( neural, group, "x_control_r" )
	local yRotationR = AddTimerMapNeuron( neural, group, "y_control_r" )

	local ikOriginal = FindChildOfType( node, "ik1_positions" )
	if ikOriginal == nil then
		ikOriginal = FindChildOfType( node, "ik_positions" )
	end
	local ikData = Clone( ikOriginal )
	local nPairs = getn(ikData.children)
	ikData.children[ nPairs + 1 ] = Clone( ikData.children[ 1 ] )
	for index, value in ikData.children do
		if node.phi < 0 then value.x = -value.x end
		local footTarget = footOrigin + Vector.New( value.x + 0, value.y + 0, value.z + 0 ) * node.worldTrans
		--Trace( "Foot Target: %",  footTarget )
		local relFootTarget = Vector.New( value.x + 0, value.y + 0, value.z + 0 )--footTarget * inv
		--Trace( "Relative Foot Target: %",  relFootTarget )
		
		local x, y, z = Vector.GetXYZ( relFootTarget )

		local r = Number.sqrt( x * x + z * z )
		local xAngle = -Number.atan2( x, z )
		local yAngle = Number.atan2( y, r )

		local t =  (index-1)/nPairs

		AddPair( xRotation, t, xAngle/90 )
		AddPair( yRotation, t, yAngle/90 )

		AddPair( xRotationR, 1-t, xAngle/90 )
		AddPair( yRotationR, 1-t, yAngle/90 )
	end

	local phase = node.leg_phase
	if phase == nil then
		phase = 0
	end
	phase = phase + 0
	xRotation.phase = phase
	yRotation.phase = phase
	xRotationR.phase = phase
	yRotationR.phase = phase
	
end

function UpdateSpine(node)

	local group = "General"

	local neural = FindChildOfType( node, "neural" )
	--if node.spine ~= nil then

		--~ if node.spine == "normal" then
			--~ normalWeight = "1.0"
		--~ elseif node.spine == "invert" then
			--~ invertWeight = "1.0"

	
	if node.spine_amplitude ~= nil and node.spine_amplitude > 0 then
		local wavy = AddChild( neural, "neuron" )
		wavy.group = group
		wavy.name = "wavy"
		
		local timer = AddChild(wavy, "accumulatorfunction_timer")
		timer.timeinterval = "IKspeed"

		local sine = AddChild(wavy, "transferfunction_sine")
		sine.phase = node.leg_phase * 6.2831853
		sine.amplitude = node.spine_amplitude
		sine.frequency = 6.2831853
		
		local mix_neuron = AddChild( neural, "neuron" )
		mix_neuron.group = group
		mix_neuron.name = "wavy_mix"
		AddChild( mix_neuron, "accumulatorfunction_multiply" )
		AddChild( mix_neuron, "transferfunction_scale" ).scale = 1.0

		local amp_dendrite = AddChild(mix_neuron, "dendrite" )
		amp_dendrite.weight = "1.0"
		local ancestor = AddChild( amp_dendrite, "ancestor" )
		ancestor.source_body = "Head"
		ancestor.source_name = "MasterAmplitude"

		local source_dendrite = AddChild( mix_neuron, "dendrite" )
		source_dendrite.weight = "1.0"
		local source_explicit = AddChild( source_dendrite, "source_explicit" )
		source_explicit.source_name =  "wavy"
		
		local wavAxon = AddChild( mix_neuron, "axon" )
		wavAxon.destination = "y_rotation"
		wavAxon.weight = "1.0"
	end

	if node.spine == "normal" or node.spine == "Normal" then
		local steerx = AddChild( neural, "neuron" )
		steerx.group = group
		steerx.name = "steerx"
		
		AddChild(steerx, "accumulatorfunction_sum")
		AddChild(steerx, "transferfunction_scale").scale = 1.0

		local wavAxon = AddChild( steerx, "axon" )
		wavAxon.destination = "x_rotation"
		wavAxon.weight = "1.0"

		local headDendrite = AddChild(steerx, "dendrite" )
		headDendrite.weight = "1.0"
		local ancestor = AddChild( headDendrite, "ancestor" )
		ancestor.source_body = "Head"
		ancestor.source_name = "SpineSteering"

	elseif node.spine == "invert" or node.spine == "Inverted" then
		local steerx = AddChild( neural, "neuron" )
		steerx.group = group
		steerx.name = "steerx"
		
		AddChild(steerx, "accumulatorfunction_sum")
		AddChild(steerx, "transferfunction_scale").scale = 1.0

		local wavAxon = AddChild( steerx, "axon" )
		wavAxon.destination = "x_rotation"
		wavAxon.weight = "-1.0"

		local headDendrite = AddChild(steerx, "dendrite" )
		headDendrite.weight = "1.0"
		local ancestor = AddChild( headDendrite, "ancestor" )
		ancestor.source_body = "Head"
		ancestor.source_name = "SpineSteering"

	end
end

function HasIKData( node )
	local ikData
	if node.leg_type == "1" then
		ikData = FindChildOfType( node, "ik1_positions" )
	elseif node.leg_type == "2" then
		ikData = FindChildOfType( node, "ik2_positions" )
	end
	
	if ikData == nil then
		ikData = FindChildOfType( node, "ik_positions" )
	end
	if ikData ~= nil and getn(ikData.children) > 0 then
		local group = ikData.gait
		if group == nil then
			group = "None"
		end
		return 1, group 
	end
	return false
end

function UpdateIK( node, parent )

	if parent then
		if 1 then --NeedsCardan( node ) then
			local neural = AddChild( node, "neural" )
			local cardan = FindChildOfType( node, "cardanconnector" )
			if cardan == nil then
				cardan = AddChild( node, "cardanconnector" )
			end
			cardan.x_minangle = -90
			cardan.x_maxangle = 90
			cardan.y_minangle = -90
			cardan.y_maxangle = 90
		else
			RemoveChildOfType( node, "cardanconnector"  )
			AddChild( node, "rodconnector" )
		end
	end

	UpdateSpine(node)
	
	local hasIKData
	local group
	hasIKData, group = HasIKData( node )

	if node.leg_type == "1" and hasIKData then
		local side = GetNodeSide( node )
		MakeIKControlNeurons( node, group, side )
		UpdateOneLink( node, group )
	elseif node.leg_type == "2" and hasIKData then
		if  parent  then
			local side = GetNodeSide( node )
			MakeIKControlNeurons( parent, group, side )
			MakeIKControlNeurons( node, group, side )
			UpdateTwoLink( parent, group, node )
		end
	end

	for index, value in node.children do
		if value.element_type == "bodysolid" then
			UpdateIK( value, node, side )
		end
	end
end

function NeedsCardan( node )
	if node.spine_amplitude == nil or node.spine_amplitude > 0 then
		return 1
	end

	if node.spine == "normal" or node.spine == "Normal" then
		return 1
	elseif node.spine == "invert" or node.spine == "Inverted" then
		return 1
	end
	if node.leg_type == "1" or node.leg_type == "2"  then
		return 1
	end
	for index, value in node.children do
		if value.element_type == "bodysolid"  and value.leg_type == "2" then
			return 1
		end
	end
	return  false
end

function GetNodePosition( node )
	return Matrix.GetTranslation( node.worldTrans )
end

function GetNodeConnect( node )
	return Vector.New( 0, 0, -0.5 * node.scalez) *  node.worldTrans
end

function GetNodeEnd( node )
	return Vector.New( 0, 0, 0.5 * node.scalez) *  node.worldTrans
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

function FindChildWithName( node, name )
	for index, value in node.children do
		if value.name == name then
			return value
		end
	end
	return nil
end

function FindChildOfType( node, type )
	for index, value in node.children do
		if value.element_type == type then
			return value
		end
	end
	return nil
end

function RemoveChildOfType( node, type )
	for index, value in node.children do
		if value.element_type == type then
			node.children[index] = nil
			return
		end
	end
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

function AddChild( node, element_type )
	local nextChild = getn( node.children ) + 1
	node.children[ nextChild ] = {}
	node.children[ nextChild ].children = {}
	node.children[ nextChild ].element_type = element_type
	return node.children[ nextChild ] 
end

function UpdatePositions( node, parent, rootPosition )

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

		local startRel = Vector.New(0,0,100) * localTrans
		local startScaled = Vector.New( Vector.GetX( startRel ) * parent.scalex, Vector.GetY( startRel ) * parent.scaley, Vector.GetZ( startRel ) * parent.scalez )
		Matrix.SetTranslation( localTrans, Vector.New( node.posx, node.posy, node.posz ) )
		
		node.worldTrans = rotTrans * localTrans * parent.worldTrans

	else
		node.worldTrans = Matrix.New()
		Matrix.RotateZ( node.worldTrans, node.roll )
		Matrix.RotateX( node.worldTrans, node.pitch )
		Matrix.RotateY( node.worldTrans, node.yaw )
		Matrix.SetTranslation( node.worldTrans, rootPosition )
	end

	for index, value in node.children do
		if value.element_type == "bodysolid" then
			UpdatePositions( value, node, rootPosition )
		end
	end
end



-- General Support Functions ------------------------------------------------------------------------------------------------------


-- makes a deep copy of a given table (the 2nd param is optional and for internal use)
-- circular dependencies are correctly copied.
function tcopy(t, lookup_table)
	local copy = {}
	for i,v in t do
		if type(v) ~= "table" then
			copy[i] = v
		else
			lookup_table = lookup_table or {}
			lookup_table[t] = copy
			if lookup_table[v] then
				copy[i] = lookup_table[v] -- we already copied this table. reuse the copy.
			else
				copy[i] = tcopy(v,lookup_table) -- not yet copied. copy it.
			end
		end
	end
	return copy
end



function MakeGraph(node, edge)
	local graph = {}
	graph.myNode = node
	graph.myEdge = edge

	graph.nodes = {}
	graph.edges = {}

	graph.EdgeIterate = function(functionName)
		for k, v in %graph.edges do
			functionName(v)
		end
	end
	graph.NodeIterate = function(functionName)
		for k, v in %graph.nodes do
			functionName(v)
		end
	end

	graph.AddNode = function(name) 
					local newNode = tcopy(%graph.myNode)
					newNode._Name = name
					newNode._myEdges = {}
					newNode._AddEdge =	function(edge)
										elements = getn(%newNode._myEdges)
										%newNode._myEdges[elements+1] = edge
									end
					newNode.GetEdges = 	function()
										return %newNode._myEdges
									end
									
					--print("MakeNode")
					elements = getn(%graph.nodes)
					%graph.nodes[elements+1] = newNode
					return newNode
					

				end
				
				
	graph.GetNode = function(name)
				--	print("There are ",getn(%graph.nodes), "nodes in the graph")
					finder = nil
					for i,v in %graph.nodes do
					--	print("searching node ", v._Name)
						if v._Name == name then
					--		print("found it", name)
							finder = v
						end
					end
					if finder == nil then
						--print("did not find", name)
					else
						--print("Found ", name)
					end
					return finder
				end
				
	graph.AddEdge = function(source, destination) 
					--print("Make edge from ",source," to ", destination) 
					sourceNode = %graph.GetNode(source)
					destinationNode = %graph.GetNode(destination)
					if sourceNode ~= nil then
						if destinationNode ~= nil then
							local newEdge = tcopy(%graph.myEdge)
							newEdge._Name = name
							newEdge._MySource = sourceNode
							newEdge._MyDestination = destinationNode
							newEdge.GetSource	 = 	function() return %newEdge._MySource end
							newEdge.GetDestination = 	function() return %newEdge._MyDestination end
							--print("MakeEdge from ",source,"to",destination)
							elements = getn(%graph.edges)
							%graph.edges[elements+1] = newEdge
							sourceNode._AddEdge(newEdge)
							destinationNode._AddEdge(newEdge)
							return newEdge
							
						else
							--print(destination," Not Valid")
						end
					else
						--print(source," Not Valid")
					end
				end
				
	graph.Print = 	function()
					for i,v in %graph.nodes do
					--print("Node ",v.Name)
					end
				end
	
	return graph
				
end
	


function iterate(node, fn, depth)
	fn(node,depth)
	depth = depth +1
	local children = 0
	for k, v in node.children do
		iterate(k, fn, depth)
		children = children +1
	end
	----Trace("Number of Children = %", children)
end



function PrintTable(table)
	if table == nil then
		--print("Table ", table, " was *nil*")
		--Trace("Table % was *nil*", table)
	else
		--Trace("table = %",table)
		for k, v in table do
		--Trace("% = %",k,n)
		end
	end
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

function MessageLowestPoint()
	local seg = Segment.root_segment
	yMin = 1000000
	while seg ~= mySegmentEnd do
		if Visual.GetVisual( seg ) then
			local scale = Visual.GetScale( seg )
			local scale_x, scale_y, scale_z = Vector.GetXYZ( scale )
			local trans = Visual.GetTransform( seg )
			for x = -1, 1, 2 do
				for y = -1, 1, 2 do
					for z = -1, 1, 2 do
						local p = Vector.New( 0.5 * x * scale_x, 0.5 * y * scale_y, 0.5 * z * scale_z ) * trans
						local yTest = Vector.GetY( p )
						if yTest < yMin then yMin = yTest end
					end
				end
			end
		end
		seg = seg + 1
	end
	return yMin
end

function MessageGetPosition()
	return Visual.GetPosition( Segment.root_segment )
end

function MessageSetVisualFlags(flags)
	MessageBaseTarget__SetVisualFlags( flags )
	flags = tonumber( flags )
	if flags == nil then flags = 0 end
	Visual.SetFlags( Segment.root_segment, Number.BitwiseOr(flags, 2048) )
end
