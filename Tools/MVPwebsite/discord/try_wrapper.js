async function _try_wrapper(fun, default_val = false){
    try {
        return await fun();
    } catch (e) {
        _event_manager.emit("discord_error", {
            event_source: "discord",
            type: "error",
            error: e,
            internal: true
        });

        return default_val;
    }
}

let _event_manager;

export default (fun, default_value = false) => {
    return async (...args) => {
        return await _try_wrapper(() => fun(...args), default_value);
    }
}

export const init_try_wrapper = (event_manager) => {
    _event_manager = event_manager;
}
