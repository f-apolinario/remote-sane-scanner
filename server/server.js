//Server variables
var ip
var port
var mediaPath
var htmlPagesPath
var logPath

//required modules
var http = require('http')
var url = require('url')
var httpHandler = require('./httpHandler')
var operationHandler = require('./operationHandler')
var logger = require('./logger');

function initializeServer() {
  //Server Config
  config = require('./config.json');
  ip = config.ip;
  port = config.port;
  mediaPath = config.media_path;
  htmlPagesPath = config.html_pages_path;
  logPath = config.log_path;

  logger.initializeLogger(logPath);
  logger.writeLog('starting server {"ip":"' + ip + '",'
    + '"port":' + port + '",'
    + '"media_path":"' + mediaPath + '"'
    + '","html_pages_path":"' + htmlPagesPath + '"}');
}

function startServer(){
  http.createServer(serverHandler).listen(port,ip);
}

function serverHandler(request, response) {
  //received request
  
  //Prepare resources to process the request
  //extract information about request
  var urlMetadata = preprocessRequest(request);
  var op = urlMetadata.op;
  var media = urlMetadata.media;
  var name = urlMetadata.name;
  var pathname = urlMetadata.pathname;
  var incommingIP = request.socket.remoteAddress;
  //log the received request
  var message = 'Incomming request ' + logger.requestedOperationToJson(pathname, op, media, name);
  logger.writeLog(message, incommingIP);
  //build the errorhandler function
  var errorHandler = function (error) {
    var message = 'error:' + error + 'in request ' + logger.requestedOperationToJson(pathname, op, media, name);
    logger.writeLog(message, incommingIP);
    response.end();
  }
  
  //process and emit response to request
  if (op == 'scan') {
		console.log(name);
		var split = name.split('/');
		if(split[0] != '..'){
			console.log(split[0]);
			name = split[0];
		}
		else{
			console.log('invalid filename');
			response.end('exec error: ' + 'invalid filename');
                        return;
		}
		var exec = require('child_process').exec, child;

		child = exec('scanimage --format tiff'/* >/media/serverhdd/Users/'+name+'.tiff'*/, function (error, stdout, stderr) {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (error !== null) {
			  console.log('exec error: ' + error);
			  //response.writeHead(200, { "Content-Type": "text/plain" });
			  response.end('exec error: ' + error);
			  return;
			}
			//response.writeHead(200, { "Content-Type": "text/plain"});
			response.writeHead(206, {
				//'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
				//'Accept-Ranges': 'bytes',
				//'Content-Length': chunksize,
				'Content-Disposition': 'attachment; filename=\"' + name+'.tiff' + '\"',
				"Content-Type": 'tiff'
            });
			response.end(stdout);
		});
	}
  //present initial page
  else {
	var fs = require('fs');
	  response.writeHead(200, { "Content-Type": "text/html" });
	  fs.readFile(htmlPagesPath + '1.html', function (err, data) {
		response.end(data);
	  })
  }
}

function preprocessRequest(req) {
  //lets filter our http request and find its parameters 
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  //url arguments
  var op = query.op ? query.op.trim().toLowerCase() : null;
  var media = query.media;
  var name = query.name;
  var pathname = url_parts.pathname;
  return {
    op: op
    , media: media
    , name: name
    , pathname: pathname
  };

}

module.exports = {
  initializeServer: initializeServer,
  startServer: startServer,
  ip:ip,
  port:port
}
