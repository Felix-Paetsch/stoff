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
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const debugParam = params.has('debug') ? '?debug' : '';

    fetch('/pattern' + debugParam, {
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
            return response.json();
        } else if (response.status === 422) {
            return response.json().then(r => { throw new Error(`Rendering error: ${ r.stack }`); });
        } else {
            return response.text().then(text => { throw new Error(`Server error: ${ text }`); });
        }
    })
    .then(r => {
        document.getElementById('sketch_display').innerHTML = r.svg;
        document.getElementById("sketch_data").textContent = "SKETCH_DATA: " + JSON.stringify(r.rendering_data, true, 2);
        if (typeof add_svg_hover_events !== 'undefined') {
            add_svg_hover_events();
        }
        reset_server_monitor_wait_time(); // Presumably changes after a long time
    })
    .catch(error => {
        document.getElementById("sketch_data").textContent = "";
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