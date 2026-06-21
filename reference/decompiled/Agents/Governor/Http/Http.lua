#Http specializes Agent embeds Socket

function Initialize(server)

	Trace("Http::Initialise: " .. server)
	myServer = server
	Socket.HttpCreate(server)
	CRLF = "\r\n"
	boundaryStr = "---------------------------26905740128644"

end


function MakeFormData(name, value)
	local contentStr = "Content-Disposition: form-data; "
	local lineStart = "--" .. boundaryStr .. CRLF .. contentStr .. "name=\""
	local lineMiddle = "\"" .. CRLF .. CRLF
	local formData = lineStart .. name .. lineMiddle .. value .. CRLF
	local len = String.strlen(formData)
	return formData, len
end

function MakeFileFormData(name, value)
	local contentStr = "Content-Disposition: form-data; "
	local contentType = "Content-Type: application/octet-stream"
	local lineStart = "--" .. boundaryStr .. CRLF .. contentStr .. "name=\""
	local lineMiddle = "\"; filename=\""
	local formData = lineStart .. name .. lineMiddle .. value .. "\"".. CRLF .. contentType .. CRLF .. CRLF
	return formData
end


function MessageUploadData(sendPath, data, notifyAgent, notifyMessage)
	
	myNotifyAgent = notifyAgent
	
	if Socket.HttpRequestSend(sendPath, boundaryStr, data) == 1 then
		Agent.SetTimer("Recieve", Agent.Me(), "recieve", 0.02)
		myRecieved = Bin.New()
		myNotifyMessage = notifyMessage
	end
end


function MessageGet(path, notifyAgent, notifyMessage)
	
	myNotifyAgent = notifyAgent
	
	if Socket.HttpRequestRecieve(path) == 1 then 
		Agent.SetTimer("Recieve", Agent.Me(), "recieve", 0.02)
		myRecieved =  Bin.New()
		myNotifyMessage = notifyMessage
	else
		Agent.SendMessage(notifyMessage, notifyAgent, myRecieved, "Failed HttpRequestReceive.")
	end
end


function MessageGetRecieved()
	if myFinishedRecieve ~= false then 
		return myRecieved
	end
	return nil
end

function MessageGetServer()
	return myServer
end

function MessageDestroy()
	Agent.Destroy()
end


function TimerRecieve()
	local finished = false
	if Socket.HttpComplete() == 1 then
		finished = 1
	end
	--get last from buffer
	local recieve = Socket.HttpRecieve(0.1)
	if recieve ~= false then
		myRecieved= myRecieved + recieve
	end
	
	myError =  Socket.HttpError()
	
	if finished == 1 or myError ~= 0 then
		Agent.StopTimer(Agent.Me(), "recieve")
		Agent.SendMessage(myNotifyMessage, myNotifyAgent, myRecieved, myError)
	end
end

---- DEPRICATED Functions awaiting removal

-- DEPRICATED function. We use the more generic UploadData and build the upload package outside this agent.
function MessageUserAuthentification(sendPath, username, password, notifyAgent, notifyMessage)
	
	myNotifyAgent = notifyAgent
	
	local footerStr =  "--" .. boundaryStr .. "--" .. CRLF
	
	local data = Bin.New()
	data = data + MakeFormData("username", username) 
	data = data + MakeFormData("password", password)
	data = data + footerStr
	
	if Socket.HttpRequestSend(sendPath, boundaryStr, data) == 1 then
		Agent.SetTimer("Recieve", Agent.Me(), "recieve", 0.02)
		myRecieved = Bin.New()
		myNotifyMessage = notifyMessage
	end
end

-- DEPRICATED function. We use the more generic UploadData and build the upload package outside this agent.
function MessageUploadZook(sendPath, username, password, filename, file, notifyAgent, notifyMessage)
	myNotifyAgent = notifyAgent

	local footerStr =  "--" .. boundaryStr .. "--" .. CRLF
	
	local data = Bin.New()
	data = data + MakeFileFormData("zook", filename) 
	data = data + Bin.ReadFile(file) 
	data = data + CRLF
	data = data + MakeFormData("username", username) 
	data = data + MakeFormData("password", password)
	data = data + footerStr
	
	if Socket.HttpRequestSend(sendPath, boundaryStr, data) == 1 then
		Agent.SetTimer("Recieve", Agent.Me(), "recieve", 0.02)
		myRecieved = Bin.New()
		myNotifyMessage = notifyMessage
	end
end

--~ function MessagePOST(sendPath, postdata, notifyAgent, notifyMessage)
	
	--~ myNotifyAgent = notifyAgent
	
	--~ local footerStr =  "--" .. boundaryStr .. "--" .. CRLF
	
	--~ local data = Bin.New()
	--~ for key, value in postdata do
		--~ data = data + MakeFormData(key, value) 
	--~ end
	--~ data = data + footerStr
	
	--~ if Socket.HttpRequestSend(sendPath, boundaryStr, data) == 1 then
		--~ Agent.SetTimer("Recieve", Agent.Me(), "recieve", 0.02)
		--~ myRecieved = Bin.New()
		--~ myNotifyMessage = notifyMessage
	--~ end
--~ end

-- POST a file and form information
-- postdata is table of variable_name=value
-- first entry is variable_name=filename
-- e.g. {"zook" = "fred.zook", "username" = "johnny", etc.}
--~ function MessagePOSTFile(sendPath, postdata, file, notifyAgent, notifyMessage)
	--~ myNotifyAgent = notifyAgent

	--~ local footerStr =  "--" .. boundaryStr .. "--" .. CRLF
	
	--~ local data = Bin.New()
	--~ local isFile = 1
	--~ for key, value in postdata do
		--~ if isFile == 1 then
			--~ data = data + MakeFileFormData(key, value) 
			--~ data = data + Bin.ReadFile(file) 
			--~ data = data + CRLF
			--~ isFile = 0
		--~ else
			--~ data = data + MakeFormData(key, value) 
		--~ end
	--~ end
	--~ data = data + footerStr
	
	--~ if Socket.HttpRequestSend(sendPath, boundaryStr, data) == 1 then
		--~ Agent.SetTimer("Recieve", Agent.Me(), "recieve", 0.02)
		--~ myRecieved = Bin.New()
		--~ myNotifyMessage = notifyMessage
	--~ end
--~ end
