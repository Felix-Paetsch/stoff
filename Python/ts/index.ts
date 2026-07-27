import { PyResponse, PyTransmittable } from "./py_transmittable";
import { deserialize_py_transmittable } from "./serialization/deserialize";
import { serialize_py_transmittable } from "./serialization/serialize";
import { make_request } from "./socket/index";
import { MakeRequestConfig } from "./socket/types";

export async function make_python_request(
    method: string,
    args: PyTransmittable[],
    config: Partial<MakeRequestConfig> = {}
): Promise<PyTransmittable> {
    const serialized = JSON.stringify({
        method,
        data: serialize_py_transmittable(args)
    });

    const res = await make_request(serialized, config);
    if (!res.ok) {
        (res as any).data &&
            console.log("pyton throw data:", (res as any).data);
        throw new Error(res.reason);
    }

    return deserialize_py_transmittable(JSON.parse(res.data));
}

export async function make_python_request_with_error_handling(
    method: string,
    args: PyTransmittable[],
    config: Partial<MakeRequestConfig> = {}
): Promise<PyResponse> {
    let serialized: string;

    try {
        serialized = JSON.stringify({
            method,
            data: serialize_py_transmittable(args)
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
        const parsed = JSON.parse(py_result.data);
        const deserialized = deserialize_py_transmittable(parsed);
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
