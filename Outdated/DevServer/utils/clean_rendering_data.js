import { Vector } from "../../../Core/StoffLib/geometry.js";

export default function clean_rendering_data(data, failure_obj = "<Data unserializable>"){
    let d = failure_obj;
    let nesting = 0;
    try {
        d = nesting_buffer(data);
    } catch {}

    return d;

    function nesting_buffer(data){
        nesting++;
        if (nesting > 50){
            throw new Error("Can't create deep copy of data! (Nesting > " + 50 + ")");
        }

        // Basic Stuff
        if ([
            "undefined",
            "boolean",
            "number",
            "bigint",
            "string",
            "symbol"
        ].includes(typeof data)){
            nesting--;
            return data;
        }

        // Arrays
        if (data instanceof Array){
            nesting--;
            return data.map(nesting_buffer);
        }

        if (!data){
            return data;
        }

        // Basic dicts
        if (data.constructor === Object){
            const new_data = {};
            for (const key in data){
                new_data[key] = nesting_buffer(data[key])
            }
            nesting--;
            return new_data;
        }

        // Vectors
        if (data instanceof Vector){
            nesting--;
            return data.to_array();
        }

        return "[Object]"
    }
}