const Times = {};
const Calls = {};

function add_calls_tracker(fun, name){
    if (!Calls[name]) {
        Calls[name] = 0;
    }

    return function(...args) {
        Calls[name] += 1;

        return fun.apply(this, args);
    };
}

function add_time_tracker(fun, name){
    if (!Times[name]) {
        Times[name] = 0;
    }

    return function(...args) {
        const start = Date.now();
        const result = fun.apply(this, args);
        const end = Date.now();

        const duration = end - start;
        Times[name] += duration;

        return result;
    };
}

function add_tracker(fun, name){
    return add_calls_tracker(
        add_time_tracker(fun, name),
        name
    )
}

function reset(){
    for (const key in Times){
        Times[key] = 0;
    }
    for (const key in Calls){
        Calls[key] = 0;
    }
}

export {
    Times,
    Calls,
    add_calls_tracker,
    add_time_tracker,
    add_tracker,
    reset
};