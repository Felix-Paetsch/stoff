
const dataContainer = document.getElementById('sketch_display');
const default_wait_time = 0.5;
let current_wait_time_s = default_wait_time;

function reset_server_monitor_wait_time(){
    current_wait_time_s = default_wait_time;
}

function increase_current_wait_time(){
    current_wait_time_s *= 1.5;
    if (current_wait_time_s > 10){
        current_wait_time_s = 10;
    }
}

async function monitor_sketch_reset() {
    try {
        const response = await fetch(route, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 404) {
            if (current_wait_time_s > 3){
                document.getElementById("doesnt_exist").style.display="block";
            }
            increase_current_wait_time();
            setTimeout(monitor_sketch_reset, current_wait_time_s * 1000);
            return;
        } else {
            reset_server_monitor_wait_time();
            document.getElementById("doesnt_exist").style.display="none";
        }

        const result = await response.json();
        if (!result.live) {
            dataContainer.innerHTML = result.svg;
            add_svg_hover_events();

            const pre = document.getElementById("data_pre");
            if (result.data){
                pre.textContent = JSON.stringify(result.data, true, 2);
            } else {
                pre.textContent = "SKETCH_DATA: " + JSON.stringify(result.sketch_data, true, 2);
            }
        }
    } catch (error) {
        document.getElementById("doesnt_exist").style.display="block";
        increase_current_wait_time();
        console.error('Error:', error);
    }

    setTimeout(monitor_sketch_reset, current_wait_time_s * 1000);
}

monitor_sketch_reset();