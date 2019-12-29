var express = require('express');
var router = express.Router();
const {spawn} = require('child_process');
const fs = require("fs");
const rimraf = require("rimraf");
global.phoneNumber = null;
global.code = null;
let tgcli = undefined;
router.get('/', function (req, res, next) {
    if (fs.existsSync("/home/pi/telegramClientReciever/main_session.session")) {
        res.render('alreadysetup', {title: 'Express'});
    } else {
        res.render('index', {title: 'Express'});
    }
});
router.get('/drop', function (req, res, next) {
    try {
        rimraf.sync("/home/pi/telegramClientReciever/main_session.session");
        rimraf.sync("/home/pi/tglogin/main_session.session");
    } catch (e) {
        console.log(e);
    }
    if (fs.existsSync("/home/pi/telegramClientReciever/main_session.session")) {
        res.render('alreadysetup', {title: 'Express'});
    } else {
        res.render('index', {title: 'Express'});
    }
});
router.post('/phone', function (req, res, next) {
    global.phone = req.body.phone;
    if (fs.existsSync("/home/pi/tglogin/main_session.session")) {
        res.render('alreadysetup', {title: 'Express'});
    } else {
        if (tgcli === undefined) {
            tgcli = spawn('python3', ["/home/pi/telegramClientReciever/teleg.py"]);
        } else {
            tgcli.stdin.pause();
            tgcli.kill();
            tgcli = spawn('python3', ["/home/pi/telegramClientReciever/teleg.py"]);
        }
        tgcli.stdout.on('data', (data) => {
            if (data.includes('Please enter your phone (or bot token)')) {
                tgcli.stdin.write(req.body.phone + '\n');
            } else if (data.includes('Please enter the code you received')) {
                setTimeout(() => {
                    tgcli.stdin.write(global.code + '\n');
                }, 25000);
                setTimeout(() => {
                    const {execSync} = require('child_process');
                    let stdout1 = execSync('mv /home/pi/tglogin/main_session.session /home/pi/telegramClientReciever/');
                    let stdout = execSync('pm2 restart TGApi');
                }, 30000);
            }
        });
        tgcli.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        tgcli.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    }
    res.render('layout', {title: global.phone});
});
router.post('/code', function (req, res, next) {
    global.code = req.body.code;
    res.render('sucess', {title: 'Express'});
});
module.exports = router;