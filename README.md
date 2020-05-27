# GIT WEBHOOK CI/CD nodejs server

run this server on any server to listen for webhooks and trigger local repo sync and rebuild.

## how to use:

- git clone project you want to CD @ **HOME_DIR** eg: /home/deploy/achts-web/base
- git clone this project anywhere on server.
- run `npx pm2 start index.js` . thats it !.

** NOTE: ** if you changed HOME_DIR, make sure you run index.js with correct enviroment variables, or edit index.js to point to correct dir.

by default this script will listen on port `7070` and when receive a push event on master branch it will

1. run git pull
2. run yarn build inside /home/deploy/[project namespace]/[project name]
3. logs of each run will be saved at /home/deploy/logs/[commit sha5].log


to customize you can use `process.env` following variables are editable:-

- **SECRET** secret password to protect service, **you need this when creating webhook at gitlab/github** `default: MY_GIT_WEBHOOK_SECRET`
- **PORT** which port to run webservice  `default: 7070`
- **HOME_DIR** the directory to save logs and projects `default: /home/deploy`


## Configuring Gitlab/Github

- if you visit `http://localhost:7070` you should see "ready", this indicate that service is ready.
- open your repo on gitlab/github and create new webhook give it `url` of service and `secret`.

thats it !, now everytime a push to master branch, gitlab will trigger webhook, which will trigger build.

visit http://localhost:7070 if a build is running, you will see output of this build, otherwise you will see "ready" message.



## TODO [roadmap]

- integrate with slack channel to send notification directly to slack
- filter refs to run different script for TAG events from push events
- allow GET to view old log.