import assert from "../../assert.js";

export default class UID {
    constructor(on) {
        this.on = on;
        this.#init_on_methods_attributes();

        this.descended_from = null;
        this.descendants = [];
        this.replaced_by_canonical = false;
    }

    #init_on_methods_attributes(){
        this.on.ref = this;
        this.on.ref = () => {
            return this.id;
        }
    }

    _get_current_active_uid(){
        if (this.replaced_by_canonical) return this.replaced_by_canonical._get_current_active_uid();
        return this;
    }

    unref(){
        const t = this._get_current_active_uid();
        return t.on;
    }

    prev_ref(){
        const t = this._get_current_active_uid();
        return t.descended_from;
    }

    prev_unref(){
        const t = this._get_current_active_uid();
        assert(t.descended_from instanceof UID, "The ID is already canonical.");
        return t.descended_from.unref();
    }

    canonical_ref(){
        const t = this._get_current_active_uid();
        if (t.is_canonical()) return t;
        return t.descended_from;
    }

    canonical_unref(){
        const t = this._get_current_active_uid();
        if (t.is_canonical()) return t.unref();
        return t.descended_from.canonical_unref();
    }

    make_canonical(){
        const t = this._get_current_active_uid();
        // Makes every reference of the descendants point to this
        // Replaces uid on their elements with empty uid
        if (t.is_canonical()) return t;
        while (t.descended_from){
            const ndf = t.descended_from.descended_from;
            t.descended_from.replace_by_canonical(t);
            t.descended_from = ndf;
        }

        return t;
    }

    replace_by_canonical(can){
        const t = this._get_current_active_uid();
        assert(!t.replaced_by_canonical, "Reference was already replaced by another canonical reference");
        t.replaced_by_canonical = can;

        t.on.id = "_replaced_by_canoncal somewhere else";
        t.on = null;
    }
    
    set_initial(){
        const t = this._get_current_active_uid();
        t.descended_from = null;
        return t;
    }

    is_canonical(){
        const t = this._get_current_active_uid();
        return t.descended_from === null;
    }

    equals(ref){
        return ref._get_current_active_uid() == this._get_current_active_uid();
    }
}