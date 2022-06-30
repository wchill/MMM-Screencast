// Reminder: this is global.

const NodeHelper = require("node_helper");
const { MODULE_NOTIFICATIONS } = require('./constants.js');
const dial = require("peer-dial");
const http = require('http');
const express = require('express');
const { MODULE_NOTIFICATIONS } = require('./constants.js');

const app = express();
const server = http.createServer(app);
const PORT = 8569;
const MANUFACTURER = "MMM-Screencast";
const MODEL_NAME = "DIAL Server";


const youtubeApp = {
    name: "YouTube",
    state: "stopped",
    allowStop: true,
    pid: null,
    launch: function (launchData, config) {
        const url = "https://www.youtube.com/tv?" + launchData;
    }
}


class DialServer {
    constructor() {
        this.dialServer;
        this._mmSendSocket;
        this._castAppName = null;
        this.config = {};
        this.server = http.createServer(app);
    }

    initDialServer(port) {
        this.dialServer = new dial.Server({
            port,
            corsAllowOrigins: true,
            expressApp: app,
            prefix: "/dial",
            manufacturer: MANUFACTURER,
            modelName: MODEL_NAME,
            launchFunction: null,
            delegate: {
                getApp: (appName) => youtubeApp,
                launchApp: (appName, launchData, callback) => {
                    console.log("Launching youtube app");
                    youtubeApp.pid = 'run';
                    youtubeApp.state = 'starting';
                    youtubeApp.launch(launchData, this.config);
                    this.mmSendSocket(MODULE_NOTIFICATIONS.launch_app, { app: app.name, state: app.state });

                    youtubeApp.state = 'running';
                    this._castAppName = appName;
                    this.mmSendSocket(MODULE_NOTIFICATIONS.run_app, { app: app.name, state: app.state });
                    callback(app.pid);
                },
                stopApp: (appName, pid, callback) => {
                    this.mmSendSocket(MODULE_NOTIFICATIONS.stop_app, { app: app.name, state: app.state });
                    callback(true);
                }
            }
        });
    }

    start() {
        const { castName, port, useIPv6 = false } = this.config;
        const usePort = !!port ? port : PORT;

        this.initDialServer(usePort);

        if (!!castName) {
            this.dialServer.friendlyName = castName;
        }

        this.server.listen(usePort,
            useIPv6 ? '::' : '0.0.0.0',
            () => {
                this.dialServer.start();
                this.mmSendSocket(MODULE_NOTIFICATIONS.start_dial, { port: usePort });
            });
    }

    stopCast() {
        if (this._castAppName) {
            this.dialServer.delegate.stopApp(this._castAppName, 'run', (e) => false);
        }
    }

    get mmSendSocket() {
        return this._mmSendSocket;
    }

    set mmSendSocket(socket) {
        return this._mmSendSocket = socket;
    }
}


module.exports = NodeHelper.create({
    dialServer: new DialServer(),
    running: false,
    start: function () {
        console.log("Starting dial server");
        this.sendSocketNotification("MMM-Screencast:test");
        this.dialServer.mmSendSocket = (n, p) => this.sendSocketNotification(n, p);
        this.dialServer.start();
        this.running = true;
    },
    stop: function() {
        if (!!this.running) {
            console.log("Stopping dial server due to shutdown");
            this.dialServer.stopCast();
            this.running = false;
        }
    },
    socketNotificationReceived: function (notification, payload) {
        switch (notification) {
            case MODULE_NOTIFICATIONS.close:
                if (!!this.running) {
                    console.log("Closing dial server");
                    this.dialServer.stopCast();
                    this.running = false;
                }
            default:
                break;
        }
    }
});
