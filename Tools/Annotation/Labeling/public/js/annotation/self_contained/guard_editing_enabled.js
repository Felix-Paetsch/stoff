function guard_editing(fun, throw_on_call = false){
    if (!(frontend_vars.mode === "edit") && throw_on_call) throw new Error("Not editing!");
    return frontend_vars.mode === "edit" ? fun : () => {};
}

function assert_not_editing(){
    if (!(frontend_vars.mode === "edit")){
        throw new Error("Not editing!");
    }
}

function is_editing_mode(){
    return frontend_vars.mode === "edit";
}