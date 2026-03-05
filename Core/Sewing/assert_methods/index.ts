import { merge_validations } from "@/Core/assert";
import { Sewing } from "../sewing";

export function same_sewing(
    ...els: ({
        get_sewing: () => Sewing
    })[]
) {
    if (els.length == 0) return true;
    const sewing = els[0]!.get_sewing();

    return merge_validations(
        els.map(
            e => e.get_sewing() === sewing
        ),
        "SewingObjects don't belong to the same sewing!"
    )
}
