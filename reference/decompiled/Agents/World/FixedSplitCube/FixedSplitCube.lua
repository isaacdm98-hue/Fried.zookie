#FixedSplitCube specializes Agent embeds Visual, Karma

function Initialize(s)

	if s == nil then
		-- query instanciation
		return
	end	
	
	spec = s
	Table.TypeCheck(spec)

	local worldScale = Config.Get("worldscale",1)
	spec.position = spec.position * worldScale
	spec.scale = spec.scale * worldScale

	
	HasPhysics = false
	if World.GetFlags() == 3 then
		HasPhysics = 1
	end
	myFixedBlocks = 0
	
	Create()
end

function MessageClone()
	return Agent.Create( "FixedSplitCube", spec )
end

function Create()
	
	for a = 1,myFixedBlocks do
		local id =Segment.GetId("fixblock"..a)
		Segment.Destroy(id)
	end
	
	myFixedBlocks = 0
	
	local scale = spec.scale
	local position = spec.position
	local rotation = CalcRotation(spec)
	--local rotation = spec.rotation
	
	local maxSize = 4
	local nX = Number.ceil( Vector.GetX( scale ) / maxSize )
	local nY = Number.ceil( Vector.GetY( scale ) / maxSize )
	local nZ = Number.ceil( Vector.GetZ( scale ) / maxSize )
	local sX = Vector.GetX( scale ) / nX
	local sY = Vector.GetY( scale ) / nY
	local sZ = Vector.GetZ( scale ) / nZ
	local subScale = Vector.New( sX, sY, sZ )
	for iX = 1, nX do
		for iY = 1, nY do
			for iZ = 1, nZ do
				if iX == 1 or iX == nX or iY == 1 or iY == nY or iZ == 1 or iZ == nZ then
					local p = position + (- 0.5 * scale + Vector.New( (iX-1) *sX, (iY-1)*sY, (iZ-1)*sZ ) + 0.5 * subScale ) *rotation
					MessageFixedBlock( p, subScale, rotation )
				end
			end
		end
	end
	
	local segmentId
	if spec.texture ~= nil then
		local t = spec.texture
		if String.strfind(t, "/") == nil  then
			t = "Agents/World/Target/"..t
		end
		segmentId = Visual.Create("fixblock_visual", 1, position, rotation, scale, 1, false, 0.5, t)
	else
		segmentId = Visual.Create("fixblock_visual", 1, position, rotation, scale, 1)
	end
	if HasPhysics ~= false then
		Visual.SetVisible(segmentId, spec.visible)
	end
	Visual.SetShadow( segmentId, spec.shadow )
	local alpha = 1
	if HasPhysics ~= false and spec.solid == 1 then
	else
		if spec.visible == false then
			alpha = Config.Get("invisible_alpha", 0.25)
		end
	end
	Visual.SetColour(segmentId, spec.red, spec.green, spec.blue, alpha)
end


function CalcRotation( spec )
	if spec.eulers ~= nil then
		return Quatn.New( Vector.GetXYZ( spec.eulers ) )
	else
		return Quatn.New()
	end
end

function MessageFixedBlock( pos, size, orient )
	myFixedBlocks = myFixedBlocks + 1
	if HasPhysics ~= false and spec.solid == 1 then
		Karma.CreateBody("fixblock"..myFixedBlocks, 1, false, pos, orient, size)
	end
	--~ local segmentId
	--~ if texture ~= nil then
		--~ local t = texture
		--~ if String.strfind(t, "/") == nil  then
			--~ t = "Agents/World/Target/"..t
		--~ end
		--~ segmentId = Visual.Create("fixblock"..myFixedBlocks, 1, pos, orient, size, 1, false, 0.5, t)
	--~ else
		--~ segmentId = Visual.Create("fixblock"..myFixedBlocks, 1, pos, orient, size, 1)
	--~ end
	--~ if HasPhysics ~= false then
		--~ Visual.SetVisible(segmentId, spec.visible)
	--~ end
	--~ Visual.SetShadow( segmentId, spec.shadow )
	--~ Visual.SetColour(segmentId, r,g,b, alpha)
end



-- FUNCTIONS BELOW ARE REQUIRED FOR THE CONTEST EDITOR


function MessageSpec()
	return spec
end

function MessageDestroy()
	Agent.Destroy()
end



function MessageBoundingSphere()
	return Vector.GetLength(spec.scale)
end

function MessageSetProperty( field, value )
	if field == "scalex" then
		local x, y, z = Vector.GetXYZ( spec.scale )
		spec.scale = Vector.New( value, y, z )
	elseif field == "scaley" then
		local x, y, z = Vector.GetXYZ( spec.scale )
		spec.scale = Vector.New( x, value, z )
	elseif field == "scalez" then
		local x, y, z = Vector.GetXYZ( spec.scale )
		spec.scale = Vector.New( x, y, value )
	else
		spec[field] = value
	end
	Create()
end

function MessageGetProperty( field )
	if field == "scalex" then
		return Vector.GetX( spec.scale )
	elseif field == "scaley" then
		return Vector.GetY( spec.scale )
	elseif field == "scalez" then
		return Vector.GetZ( spec.scale )
	else
		return spec[field]
	end
end

function MessageParamaters()
	local types = {
		{
			name = "",
			default = { 
				description = "",
				position = Vector.New(),  
				rotation = Quatn.New(),
				scale = Vector.New(5, 1, 5),	
				red = .619608, 
				green = .619608, 
				blue = .619608,  
				visible = 1, 
				solid = 1,
				shadow = 1,
				group = "0"
			} ,
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = .1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "eulers", label = "Orientation", vector = 5, default = Vector.New(0,0,0) },
				{ name = "scalex", label = "Width", tab = "Physical", icon = "WidthObj", default = 5, min = 1, max = 100, scale = 4 },
				{ name = "scaley", label = "Height", tab = "Physical", icon = "HeightObj", default = 1, min = 1, max = 100, scale = 4 },
				{ name = "scalez", label = "Length", tab = "Physical", icon = "DepthObj",  default = 5, min = 1, max = 100, scale = 4 },
				{ name = "solid", label = "Solid", tab = "Physical", check = 1 },
				{ name = "colour", label = "Colour", tab = "Visual", red = "red", green = "green", blue = "blue" },
				{ name = "visible", label = "Visible", tab = "Visual", check = 1 },
				{ name = "shadow", label = "Shadow", tab = "Visual", check = 1 },
				{ name = "group", label = "Group", edit = "0" },
				{ name = "texture", label = "Texture", tab = "Visual", texturesize = 38, displayedrows = 3,
					path = "./Agents/World/target", filespec = "*.png", bottom = 1 },
				{ name = "flags", label = "Studio Flags", edit = "0" }
			}
		}
	}
	return types
end

function MessageSetVisualFlags(flags)
	
	if flags == nil then
		flags = 0
	else
		flags = tonumber(flags)
	end
	if flags == nil then
		flags = 0
	end
	
	Visual.SetFlags(Segment.fixblock_visual, flags)

end

