/* global Module */

/* Magic Mirror
 * Module: MMM-Screencast
 *
 * By Kevin Townsend
 * MIT Licensed.
 */

Module.register("MMM-Screencast", {

    requiresVersion: "2.1.0", // Required version of MagicMirror

    start: function () {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("MMM-Screencast:CLIENT-READY", {});
    },

    getDom: function () {
        const div = document.createElement("div");
        div.className = "screencast";
        div.id = "screencast-container";
        div.style.width = this.config.width;
        div.style.height = this.config.height;
        div.style.visibility = "hidden";
        return div;
    },
    socketNotificationReceived: function (notification, payload) {
        Log.log(`Incoming notification: ${notification}`);
        Log.log(`Incoming payload: ${payload}`);
        if (notification.includes('ERROR')) {
            const { message } = payload;
            Log.error(`${notification}: ${message}`);
        } else if (notification.includes("LAUNCH-APP")) {
            const { launchData } = payload;
            let container = document.getElementById("screencast-container");
            container.innerHTML = "";
            let path = "https://www.youtube.com/tv?" + launchData;
            let iframe = document.createElement("iframe");
            iframe.className = "screencast-iframe";
            iframe.id = "screencast-iframe";
            iframe.setAttribute("allow", "autoplay; encrypted-media");
            iframe.setAttribute("src", path);
            container.appendChild(iframe);

            console.log(path);
            container.style.visibility = "visible";

            /*
            fetch(path, { mode: 'no-cors' })
                .then(response => {
                    console.log("Fetch complete");
                    container.style.visibility = "visible";
                }).catch(err => console.log(err));
            */
        } else if (notification.includes("STOP-APP") || notification.includes("CLOSE")) {
            this.updateDom();
        }
        this.sendNotification(notification, payload);
    },
    notificationReceived: function (notification, payload, sender) {
        if (notification.includes('MMM-Screencast')) {
            this.sendSocketNotification(notification);
        }
    },
});
