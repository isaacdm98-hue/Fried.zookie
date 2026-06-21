#ZookPlaceHolder specializes BaseTarget embeds Visual

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
	myBuilderParts = Agent.Create("BuilderParts", spec.position, "ZookPlaceHolder")

	myLoadedZook = false
	LoadZook()
	CreateVisual()
end


function Finalize()
	if Agent.IsValid(myBuilderParts) == 1 then
		Agent.SendMessage("Destroy", myBuilderParts)
	end
end


function MessageClone()
	return Agent.Create( "ZookPlaceHolder", spec )
end

function CreateVisual()

	local segmentId =Visual.Create("zook", 2, spec.position+Vector.New(0,Vector.GetY(spec.scale)/2,0), Quatn.New( Vector.GetXYZ( spec.eulers ) ),
		spec.scale, 1, false, 0.5, "Agents/World/ZookPlaceHolder/arrow")
	Visual.SetColour(segmentId, 1, 1, 1,0.5)
	if myLoadedZook then
		--Agent.SendMessage("SetNoseBottomPosition", myBuilderParts, spec.position )
		--Agent.SendMessage("SetRootRotation", myBuilderParts, CalcRotation( spec ) )
		Agent.SendMessage("SetContestStart", myBuilderParts, spec.position, CalcRotation( spec ) )
	end
	UpdateHatpin()
		
end

function UpdateHatpin()
	if spec.movable ~= nil and not spec.movable then
		local hatpin = spec.hatpin
		if hatpin == nil then hatpin = Vector.New(0,0,0) end
		hatpin = hatpin + spec.position
		local x, y, z = Vector.GetXYZ( hatpin )
		local agent, segment, hit = Visual.Ray(  Vector.New( x, 0.5, z ), Vector.New( x, 1000, z ) )
		local h = 10
		if segment ~= 0 then
			h = Vector.GetY( hit )
		end

		segmentId =Visual.Create("hatpin", 3, Vector.New(x,h/2,z), Quatn.New( Vector.New(1,0,0), 90), Vector.New( 0.3, 0.3, h ), 1, false, 0.5, "Agents/World/Target/Plaster")
		Visual.SetColour(segmentId, 0.5, 0.5, 0.5,1)
	end
end

function MessageGetOABB()
	return spec.position+Vector.New(0,Vector.GetY(spec.scale)/2,0), spec.scale
end

-- FUNCTIONS BELOW ARE REQUIRED FOR THE CONTEST EDITOR


function MessageDestroy()
	Agent.Destroy()
end



function MessageSpec()
	return spec
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
	elseif field == "clearzook" then
		Agent.SendMessage("Clear", myBuilderParts )
		spec.contestant = nil
	elseif field == "contestant" then
		spec[field] = value
		LoadZook()
	else
		spec[field] = value
	end
	
	CreateVisual()

end

function LoadZook()
	if spec.contestant ~= nil then
		local texturePath 
		if String.strfind( spec.contestant.fullname, "Creatures" ) ~= nil then
			texturePath = String.strsub( spec.contestant.fullname, 1, String.strfind( spec.contestant.fullname, "Creatures" )-1 ).."Textures"
		else
			texturePath = Config.Get("texture_path", "")
		end
		if System.IsValidPath( spec.contestant.fullname ) then
			myLoadedZook = 1
			Agent.SendMessage("Load", myBuilderParts, spec.contestant.fullname, texturePath, "ZookPlaceHolder", false )
		end
	end
end

function CalcRotation( spec )
	if spec.eulers ~= nil then
		return Quatn.New( Vector.GetXYZ( spec.eulers ) )
	else
		return Quatn.New()
	end
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
			name = "",	-- same as spere but positioned around base not centre
			default = { 
				description = "",
				position = Vector.New(0,0,0), 						-- far left, centre table location
				eulers =Vector.New(0,90,0),	-- rotated around Y axis (X,Y,Z)=(0,1,0) by 90 degrees
				scale = Vector.New(1,1,1), 				-- absoulte size; will not scale with table size
				movable = 1,
				group = "0"												
			},
			paras = {
				{ name = "description", label = "Description", edit = "" },
				{ name = "position", label = "Position", vector = 0.1, default = Vector.New(0,0,0), scale = 4 },
				{ name = "eulers", label = "Orientation", vector = 1, default = Vector.New(0,0,0) },
				{ name = "flags", label = "Studio Flags", edit = "0" },
				{ name = "contestant", button = "Select zook" },
				{ name = "clearzook", button = "Clear zook" },
				{ name = "movable", label = "Movable", tab = "Physical", check = 1, default = 1 },
				{ name = "hatpin", label = "Hatpin Position", tab = "Physical", vector = 0.1, default = Vector.New(0,0,0) },
				{ name = "group", label = "Group", edit = "0" },
--				{ name = "scalex", tab = "Physicsl", label = "Width", top = 1, icon = "WidthObj", default = 1, min = .1, max = 3, scale = 4 },
--				{ name = "scaley", label = "Height", icon = "HeightObj", default = 1, min = .1, max = 3, scale = 4 },
--				{ name = "scalez", label = "Length", bottom = 1, icon = "DepthObj",  default = 1, min = .1, max = 3, scale = 4 }
			}
		}
	}
	return types
end
