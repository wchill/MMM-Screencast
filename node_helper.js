// Reminder: this is global.

const NodeHelper = require("node_helper");
const DialServer = require("./DialServer.js");
const { MODULE_NOTIFICATIONS, POSITIONS } = require('./constants.js');

module.exports = NodeHelper.create({
    dialServer: new DialServer(),
    running: false,
    start: function () {
        this.dialServer.mmSendSocket = (n, p) => this.sendSocketNotification(n, p);
        this.dialServer.start();
        this.running = true;
    },
    stop: function() {
        if (!!this.running) {
            this.dialServer.stopCast();
            this.running = false;
        }
    },
    socketNotificationReceived: function (notification, payload) {
        switch (notification) {
            case MODULE_NOTIFICATIONS.close:
                if (!!this.running) {
                    this.dialServer.stopCast();
                    this.running = false;
                }
            default:
                break;
        }
    }
});
