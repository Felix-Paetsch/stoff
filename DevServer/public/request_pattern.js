function throttle_func(func, interval_in_s) {
    let lastTimeCalled = null;
    let is_pending = false;

    function callback(){
        if (!is_pending){ // Via Force
            return;
        }
        execute();
    }

    function execute(){
        lastTimeCalled = Date.now();
        is_pending = false;
        func();
    }

    return function wrapper(forceCall = false) {
        const currentTime = Date.now();
        
        if (forceCall){
            return execute();
        }

        if (is_pending){
            return;
        }

        if (!lastTimeCalled || currentTime - lastTimeCalled >= interval_in_s * 1000) {
            return execute();
        }

        is_pending = true;
        setTimeout(callback, (interval_in_s * 1000) - (currentTime - lastTimeCalled));
    };
}

function request_img_unthrottled(){
    fetch('/pattern', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            config_data: window.design_config.to_obj(),
            width: 500,
            height: 500
        }),
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        } else if (response.status === 422) {
            return response.text().then(text => { throw new Error(`Rendering error: ${text}`); });
        } else {
            return response.text().then(text => { throw new Error(`Server error: ${text}`); });
        }
    })
    .then(svgText => {
        document.getElementById('sketch_display').innerHTML = svgText;
        reset_server_monitor_wait_time(); // Presumably changes after a long time
    })
    .catch(error => {
        if (error.message.startsWith("Rendering error:")) {
            console.error(error.message);
            document.getElementById('sketch_display').innerHTML = `<pre>${ error.message }</pre>`;
        } else if (error.message.startsWith("Server error:")) {
            console.error(error.message);
        } else {
            console.log('Failed to access the server.');
        }
    });
}

const request_img = throttle_func(request_img_unthrottled, 0.2);