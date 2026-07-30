import {
    stoff_deserialize,
    stoff_serialize_to_json,
    StoffSerializable
} from "ProcedualArt/serialization/index";
import { PyResponse } from "./py_transmittable";
import { make_request } from "./socket/index";
import { MakeRequestConfig } from "./socket/types";

export async function make_python_request(
    method: string,
    args: StoffSerializable[],
    config: Partial<MakeRequestConfig> = {}
): Promise<StoffSerializable> {
    const serialized = JSON.stringify({
        method,
        data: stoff_serialize_to_json(args)
    });

    const res = await make_request(serialized, config);
    if (!res.ok) {
        (res as any).data &&
            console.log("pyton throw data:", (res as any).data);
        throw new Error(res.reason);
    }

    return stoff_deserialize(res.data);
}

export async function make_python_request_with_error_handling(
    method: string,
    args: StoffSerializable[],
    config: Partial<MakeRequestConfig> = {}
): Promise<PyResponse> {
    let serialized: string;

    try {
        serialized = JSON.stringify({
            method,
            data: stoff_serialize_to_json(args)
        });
    } catch (e) {
        return {
            ok: false,
            reason: "serialization_error"
        };
    }

    let py_result = await make_request(serialized, config);
    if (!py_result.ok) {
        return py_result;
    }

    try {
        const deserialized = stoff_deserialize(py_result.data);
        return {
            ok: true,
            data: deserialized
        };
    } catch (e: any) {
        return {
            ok: false,
            reason: "deserialization_error"
        };
    }
}
