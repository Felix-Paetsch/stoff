class UndoRedo{
    constructor(){
        this.reset();
    }

    static is_disabled = false;
    static disable(){
        this.is_disabled = true;
    }

    reset(){
        this.action_index = -1; // Index of last done action
        this.actions = []; // Array of (re)dos and undos
        this.update_UI();
    }

    init(fun){
        this.actions = [fun];
        this.action_index = 0;
    }

    push(fun){
        // console.log("Push Undo/Redo");
        if (UndoRedo.is_disabled) return;
        this.actions.splice(this.action_index + 1);
        this.actions.push(fun);

        this.action_index++;
        this.update_UI();
    }

    redo(){
        if (UndoRedo.is_disabled) return;

        if (this.action_index + 1 == this.actions.length){
            return;
        }

        this.action_index++;
        this.actions[this.action_index]();

        this.update_UI();
        upload_data_to_server();
    }

    undo(){
        if (UndoRedo.is_disabled) return;
        
        if (this.action_index < 1){
            return;
        }

        this.actions[--this.action_index]();

        this.update_UI();
        upload_data_to_server();
    }

    update_UI(){
        if (this.action_index < 1){
            document.getElementById("undo_btn").classList.add("disable");
        } else {
            document.getElementById("undo_btn").classList.remove("disable");
        }
        
        if (this.action_index + 1 == this.actions.length){
            document.getElementById("redo_btn").classList.add("disable");
        } else {
            document.getElementById("redo_btn").classList.remove("disable");
        }
    }
}

const undo_redo = {
    "undo": () => {
        get_active_img().undo_redo.undo()
    },
    "redo": () => {
        get_active_img().undo_redo.redo()
    }
}