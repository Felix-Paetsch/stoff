import { Sketch } from "@/Core/sketch";
import { make_python_request } from "@/Python";

export default async function () {
    const res = await make_python_request("hi_sketch", ["Felix", new Sketch()]);
    console.log(res);
}
