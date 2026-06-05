import { Image } from "@/Core/files";
import { Out } from "@/Dev";

export default async function () {
    let img = await Image.load("out/einstein.png");

    const gray = img.gray_scale();
    Out.put(gray);

    return [];
}
