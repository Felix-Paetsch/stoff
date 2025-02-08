const default_wait_time = 0.5;
let current_wait_time_s = default_wait_time;

function reset_server_monitor_wait_time(){
    current_wait_time_s = default_wait_time;
}

function monitor_server_reset() {
    console.log("Request");

    fetch(`/reset?t=${Date.now()}`)
        .then(response => response.json())
        .then(data => {
            if (data === true) {
                request_img();
                current_wait_time_s = default_wait_time;
            } else {
                // Add things
            }
        })
        .catch(error => {
            console.error('Error accessing the server:', error);
            // Increment the wait time for each subsequent attempt
            current_wait_time_s *= 1.5;
            current_wait_time_s = Math.max(5, current_wait_time_s);
        })
        .finally(() => {
            // Schedule the next check, converting seconds to milliseconds
            setTimeout(monitor_server_reset, current_wait_time_s * 1000);
        });
}

monitor_server_reset();
