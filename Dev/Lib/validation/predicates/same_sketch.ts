import { Expect } from "@/Core";
import { Sketch } from "@/Core/sketch";

export * from "./sketch_is_valid";

export function same_sketch(
    ...els: (
        | {
              get_sketch: () => Sketch;
          }
        | { sketch: Sketch }
        | Sketch
    )[]
) {
    if (els.length == 0) return true;
    const sketch = extract_sketch(els[0]!);

    return Expect.all(els.map((e) => extract_sketch(e) === sketch));
}

function extract_sketch(
    out_of:
        | {
              get_sketch: () => Sketch;
          }
        | { sketch: Sketch }
        | Sketch,
): Sketch {
    if (out_of instanceof Sketch) return out_of;
    if ("sketch" in out_of) return out_of.sketch;
    return out_of.get_sketch();
}
