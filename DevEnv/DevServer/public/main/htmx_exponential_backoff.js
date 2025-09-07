getTimeoutSetting = () => {
    console.log(currentPollingInterval);
    return currentPollingInterval;
};

const minInterval = 800;
let currentPollingInterval = minInterval;
const maxInterval = 5000; // Max 5 seconds
const backoffMultiplier = 1.5;
let pollingTimeoutId = null;
let hotReloadElement = null;

function scheduleNextPoll() {
    if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId);
    }

    pollingTimeoutId = setTimeout(() => {
        if (hotReloadElement) {
            htmx.trigger(hotReloadElement, "poll");
        }
    }, currentPollingInterval);
}

function onSuccessfulResponse() {
    currentPollingInterval = minInterval;
    scheduleNextPoll();
}

function onFailedResponse() {
    currentPollingInterval = Math.min(
        currentPollingInterval * backoffMultiplier,
        maxInterval
    );
    if (currentPollingInterval >= maxInterval) {
        document.getElementById("no-connection")?.classList.remove("hidden");
    } else {
        document.getElementById("no-connection")?.classList.add("hidden");
    }
    scheduleNextPoll();
}

document.body.addEventListener("htmx:responseError", function (evt) {
    if (evt.detail.elt === hotReloadElement) {
        onFailedResponse();
    }
});

document.body.addEventListener("htmx:timeout", function (evt) {
    if (evt.detail.elt === hotReloadElement) {
        onFailedResponse();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    hotReloadElement = document.getElementById("hot-reload-poller");
    if (hotReloadElement) {
        scheduleNextPoll();
    }
});

document.body.addEventListener("htmx:afterRequest", function (evt) {
    if (evt.detail.elt === hotReloadElement) {
        if (evt.detail.xhr.status >= 200 && evt.detail.xhr.status < 300) {
            onSuccessfulResponse();
        } else {
            onFailedResponse();
        }
    }
});
