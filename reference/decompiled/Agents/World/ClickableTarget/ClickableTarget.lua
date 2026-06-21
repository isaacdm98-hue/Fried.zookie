# ClickableTarget specializes BaseTarget embeds Visual, Karma, Input

function Initialize(position, radius)

	myScale = Vector.New(radius, radius, radius)
	Visual.Create("sphere", 0, position, Quatn.New(), myScale, 0)
	local r = Config.Get("target_red", 1)
	local g = Config.Get("target_green", 1)
	local b = Config.Get("target_blue", 1)

	Visual.SetColour(Segment.sphere, r,g,b)
	MessageSetVisible(false)
	Create(position)
	myOffset = Vector.New()
	
end



function Create(position)
	Karma.CreateBody("sphere", 0, false, position, Quatn.New(), myScale)
	Karma.SetSolidity(Segment.sphere, not Config.Get("target_nonsolid", false))
	if Segment.visual ~= nil then
		Karma. CreateRelative(Segment.visual, Segment.sphere, myOffset)
	end

	AffirmCreation(Segment.sphere)

end


function MessageSetVisual(file, scale, offset)
	if Segment.visual ~= nil then
		Segment.Destroy(Segment.visual)
	end
	Segment.visual = nil
	myOffset = offset
	Visual.Create("visual", file, Vector.New(), Quatn.New(), scale, 0)
	Karma. CreateRelative(Segment.visual, Segment.sphere, myOffset)
end


function MessageSetVisible(v)
	Trace("target vis %", v)
	Visual.SetVisible(Segment.sphere, v)
end


function MessageSetMoveKey(name_string)
	-- recieves as a string name converts to key code
	local key
	if name_string == "" then
		key = nil
	else
		key = Input[name_string];
	end
	
	-- sets a key so if pressed target move th where mouse points at
	if myKey ~= nil then
		Input.UnregisterKey(myKey)
	end
	if Number.TypeCheck(key, 1) then
		myKey = key
		Input.RegisterKey(myKey)
	else
		myKey = nil
	end
end
	

function SystemKeyDown(key)
	-- if registered key hit move to where mouse points at
	-- if registered key hit move to where mouse points at
	local camera = Config.Get("theCamera",Agent.Null())
	Trace("Camera = %", camera)
	if camera ~= nil then
		local a, s, position = Agent.SendMessage("Pick", camera)
		Trace("target pos = %", position)
		MessageMoveTo(position)		
	end	
end

--~ function MessageMoveToMouse()
	--~ -- if registered key hit move to where mouse points at
	--~ local camera = Config.Get("theCamera",Agent.Null())
	--~ Trace("Camera = %", camera)
	--~ if camera ~= nil then
		--~ local a, s, position = Agent.SendMessage("Pick", camera)
		--~ Trace("target pos = %", position)
		--~ MessageMoveTo(position)		
	--~ end	
--~ end


function MessageMoveTo(position)
	if Vector.TypeCheck(position, 1) == false then
		Trace("target position %", position)
		return
	end
	Create(position)
--	Karma.MoveTo(Segment.sphere, position, Vector.New(1,1,1), 0.1)
end	
