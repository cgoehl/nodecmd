const http = require('http');
const cp = require('child_process');
const config = require('./config.json');

var processes = {};

var server = http.createServer(function (request, response) {
	var url = request.url;
	console.log(url);
	switch(url) {
		case "/favicon.ico":
			response.writeHead(404);
			response.end();
			break;
		case "/":
			list(response);
			break;
		default:
			var cmd = config[url.substring(1)];
			if (cmd) {
				console.log(cmd);
				if(cmd.singleton && processes[cmd.command]) {
					singletonError(response, cmd);
				} else {
					processes[cmd.command] = true;
					run(response, cmd);
				}
			} else {
				list(response);
			}
			break;
	}
});

function singletonError(response, cmd) {
	response.writeHead(409, {"Content-Type": "text/plain"});
	response.end(cmd.command + " is currently running! Try again later.");
}

function run(response, cmd) {
	response.writeHead(200, {"Content-Type": "text/plain"});
	var proc = cp.spawn(cmd.command, cmd.args, cmd.options);
	proc.stdout.pipe(response);
	proc.stdout.on('end', function() {
		console.log("cmd finished");
		delete processes[cmd.command];
	});
}

function list(response) {
	response.writeHead(404);
	var cmds = Object.keys(config).sort().join("\n");
	response.end("Available commands:\n" + cmds + "\n");
}

server.listen(8000);
console.log("Server running at http://127.0.0.1:8000/");