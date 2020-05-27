const { execSync, spawn } = require('child_process');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SECRET = process.env.SECRET || 'MY_GIT_WEBHOOK_SECRET';
/*
/* ############################################################/
/* ### Build command will run @ ${directory}/project.name/  ###/
/* ############################################################/
*/
const directory = process.env.HOME_DIR || '/home/deploy'
var current_file;

http
	.createServer((request, response) => {

		if (request.method === "GET") {
			if (!current_file) {
				response.writeHead(200);
				response.end('ready');
				return;
			}
			const filePath = path.join(directory, 'logs', current_file);

			if (!fs.existsSync(filePath)) {
				response.writeHead(200);
				response.end('ready');
				return;
			}

			const stat = fs.statSync(filePath);

			response.writeHead(200, {
				'Content-Type': 'text/html',
				'Content-Length': stat.size
			});
			fs.createReadStream(filePath).pipe(response);
			return;
		}

		if (request.method !== "POST") {
			response.writeHead(405, 'Method Not Supported', { 'Content-Type': 'text/html' });
			response.end('<!doctype html><html><head><title>405</title></head><body>405: Method Not Supported</body></html>');
			return;
		}

		const isAllowed = request.headers['x-gitlab-token'] === SECRET; //|| request.headers['x-hub-signature'] === signature

		if (!isAllowed) {
			response.writeHead(403, 'Authentication failed, Access Forbidden', { 'Content-Type': 'text/html' });
			response.end('<!doctype html><html><head><title>403</title></head><body>403: Authentication failed, Access Forbidden</body></html>');
			return;
		}

		var requestBody = '';
		var signature;
		request.on('data', function (data) {
			signature = `sha1=${crypto
				.createHmac('sha1', SECRET)
				.update(data)
				.digest('hex')}`;
			requestBody += data;
			if (requestBody.length > 1e7) {
				response.writeHead(413, 'Request Entity Too Large', { 'Content-Type': 'text/html' });
				response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
			}
		});

		request.on('end', function () {
			const body = JSON.parse(requestBody);
			const isMaster = body && body.ref === 'refs/heads/master';
			const baseDir = path.join(directory, body.project.path_with_namespace);
			const logFile = path.join(directory, 'logs', body.checkout_sha + '.log');

			if (fs.existsSync(logFile)) {
				response.writeHead(409);
				response.end('Skipping.. already deployed');
				return;
			}

			if (current_file) {
				response.writeHead(412);
				response.end('Skipping.. another deployment already running');
				return;
			}

			current_file = body.checkout_sha;
			const out = fs.openSync(logFile, 'a');
			const err = fs.openSync(logFile, 'a');

			if (isMaster) {
				/*
				/* ############################################################/
				/* ### RESET ANY CHANGES ON SERVER AND PULL LATEST VERSION ####/
				/* ############################################################/
				*/
				console.log('building ' + baseDir + '...');
				try {
					execSync('git checkout master -f && git reset master --hard && git pull', {
						cwd: baseDir,
						timeout: 60 * 5 * 1000,
						stdio: ['ignore', out, err]
					})
				} catch (e) {
					fs.writeSync(err, JSON.stringify(error));
				}

				try {
					/*
					/* ############################################################/
					/* ### EDIT THIS LINE IF YOU WANT TO CHANGE BUILD COMMAND #####/
					/* ############################################################/
					*/
					const child = spawn('yarn', ['build'], {
						detached: true,
						cwd: baseDir,
						timeout: 60 * 5 * 1000,
						stdio: ['ignore', out, err]
					});
					child.unref();
					child.on('exit', (exitCode) => {
						if (parseInt(exitCode) !== 0) {
							//Handle non-zero exit
							fs.writeSync(err, '\nbuild failedxxxxxxxxx...\n');
						}
						fs.writeSync(out, '\nbuild success....\n');
						// current_file = null;
					});
				} catch (error) {
					fs.writeSync(err, JSON.stringify(error));
				}
				response.writeHead(201);
				response.end(`Deployed ${body.commits[0].title} of ${body.project.path_with_namespace}`);
			} else {
				response.writeHead(200);
				response.end('Skipping.. we only deploy master');
			}
		});
	})
	.listen(process.env.PORT || 9090);



