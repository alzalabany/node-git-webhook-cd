# GIT WEBHOOK CI/CD nodejs server

run this server on any server to listen for webhooks and trigger local repo sync and rebuild.

## how to use:

- git clone project you want to CD @ **HOME_DIR** eg: /home/deploy/username/projectname
- git clone this project anywhere on server.
- create cmds.js file inside project folder, this file exports an object with `key` = repo name and value equal config. object for build commands
- run `npx pm2 start index.js` . thats it !.

** NOTE: ** if you changed HOME_DIR, make sure you run index.js with correct enviroment variables, or edit index.js to point to correct dir.

by default this script will listen on port `9090` and when receive a push event on master branch it will

1. run git pull
2. run `CMD.cmd`||`yarn build` inside /home/deploy/[project namespace]/[project name] + `CMD.cwd`
3. logs of each run will be saved at /home/deploy/logs/[commit sha5].log

example:

- process.env.HOME_DIR = /home/alzalabany
- if cmds.js = 

```
module.exports = {
	"projectx/project1": {
		cwd: '..',
		cmd: ["make", "project1"]
	},
	"projectx/project2": {
		cwd: 'docker',
		cmd: ["docker-compose", "up", "--build", "-d"]
	}
}
```

then when service recieve a push request from "projectx/project1" it will run command "make project1" inside "/home/alzalabany/projectx/project1/.." which resolve to "/home/alzalabany".

if it recieve a push request from "projectx/project2" it will run command "docker-compose up --build -d" inside "/home/alzalabany/projectx/project2/docker"

---------

to customize you can use `process.env` following variables are editable:-

- **SECRET** secret password to protect service, **you need this when creating webhook at gitlab/github** `default: MY_GIT_WEBHOOK_SECRET`
- **PORT** which port to run webservice  `default: 9090`
- **HOME_DIR** the directory to save logs and projects `default: /home/deploy`


## Configuring Gitlab/Github

- if you visit `http://localhost:9090` you should see "ready", this indicate that service is ready.
- open your repo on gitlab/github and create new webhook give it `url` of service and `secret`.

thats it !, now everytime a push to master branch, gitlab will trigger webhook, which will trigger build.

visit http://localhost:9090 if a build is running, you will see output of this build, otherwise you will see "ready" message.



## TODO [roadmap]

- integrate with slack channel to send notification directly to slack
- filter refs to run different script for TAG events from push events
- allow GET to view old log.