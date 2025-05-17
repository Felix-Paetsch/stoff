const { CONF } = require('../../config.js');

const active_batches = {}

/*
[id] -> {
    activated:ts,
    user_ident:string,
    last_used:ts
}
*/

module.exports = {
    get_current_user_ident_for_batch_id: (id) => {
        if (CONF.enable_edit_guard == false){
            return "edit_guard_disabled";
        }

        const batch = active_batches[id];
        if (!batch) {
            return null;
        }

        const now = Date.now();

        // Check if "last_used" is longer ago than 10 minutes (10 * 60 * 1000 ms)
        if (now - batch.last_used > 10 * 60 * 1000) {
            delete active_batches[id];
            return null;
        }

        return batch.user_ident;
    },

    user_ident_is_valid: (user_ident) => {
        user_ident = user_ident.trim();
        if (user_ident.length >= 3) {
            return true;
        }
        return "Identifier too short (min 3 characters)";
    },

    set_current_user_for_batch: (user_ident, batch_id) => {
        const now = Date.now();
        active_batches[batch_id] = {
            activated: now,
            user_ident: user_ident.trim(),
            last_used: now
        };
    },

    remove_current_user_for_batch: (batch_id) => {
        delete active_batches[batch_id];
    },

    renew_activity_timer: (batch_id) => {
        if (active_batches[batch_id]) {
            active_batches[batch_id].last_used = Date.now();
        }
    },

    upload_still_justified: (batch_id, annotation_start) => {
        if (CONF.enable_edit_guard == false){
            return true;
        }
        
        return active_batches[batch_id] && active_batches[batch_id].activated == annotation_start;
    },

    get_annotation_start: (batch_id) => {
        return active_batches[batch_id] ? active_batches[batch_id].activated : null;
    }
};
