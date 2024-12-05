let event_manager;

export async function get_user(ident){
    return new Promise((resolve, reject) => {
        event_manager.emit("jdb_read_global", async (data) => {
            for (let i = 0; i < data.length; i++){
                if (data[i].ident == ident){
                    return resolve(data[i]);
                }
            }

            reject("User not found!");
        });
    });
}

export async function write_user(user) {
    return new Promise((resolve, _reject) => {
        event_manager.emit("jdb_read_global", async (data) => {
            for (let i = 0; i < data.length; i++){
                if (data[i].ident == user.ident){
                    data[i] = user;
                    break;
                }
            }

            data.push(user);
            event_manager.emit("jdb_write_global", data);
            resolve()
        });
    });
}

export function connect(_event_manager){
    event_manager = _event_manager
}