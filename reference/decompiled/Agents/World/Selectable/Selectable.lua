# Selectable specializes Agent abstract embeds Visual

myButtons = {}
mySegmentedButtons={}

	
function MessageSegmentPosition(segmentId)

	if Visual.GetVisual(segmentId) == 1 then
		return Visual.GetPosition(segmentId)
	end
		
	return nil
	
end


function MessageSegmentSpot(segmentId)

	if Visual.GetVisual(segmentId) == 1 then
		local spot = Spot.New()
		pos = Visual.GetPosition(segmentId)
		Spot.SetPosition(spot, pos)
		
		scale =Visual.GetScale(segmentId)
		Spot.SetScale(spot, scale)
		
		orientation = Visual.GetRotation(segmentId)
		Spot.SetRotation(spot, orientation)
		
		return spot 
	end
		
end



function MessageSegmentMatrix(segmentId)
	
	if Visual.GetVisual(segmentId) == 1 then
		local m = Matrix.New()
		m = Visual.GetTransform(segmentId)
		return m
	end
	
end


function MessageMethods()

	local methods = { Buttons = {} }
	local button = {}
	
	for index, value in myButtons do
		button = {method = value.method  , text = value.text, png = value.png,}
		methods.Buttons[button] = "button"
	end
	
	for index, value in mySegmentedButtons do
		button = {method = value.method  , text = value.text, png = value.png,}
		methods.Buttons[button] = "segmentedbutton"
	end
		
	return methods
	
end


function AddButton(methodname, buttontext,pngname)
	newbutton = {	method = methodname,
				text = buttontext,
				png = pngname,
			}
	elements = getn(myButtons)
	myButtons[elements+1] = newbutton
end


function AddSegmentButton(methodname, buttontext,pngname)
	newbutton = {	method = methodname,
				text = buttontext,
				png = pngname,
			}
	elements = getn(mySegmentedButtons)
	mySegmentedButtons[elements+1] = newbutton
end
	

function MessageDestroy()
	Agent.Destroy()
end
