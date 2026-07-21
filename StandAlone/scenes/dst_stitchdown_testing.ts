import { DST, Embroidery, undo_tie_on_off } from "ProcedualArt/embroidery";

export default function () {
    const embr = Embroidery.from_dst(DST.from_file("./out/lion.dst"));
    console.log(embr.runs[0]);
    console.log(embr.runs[1]);
    // console.log(tie_on_off(embr.runs[0]!));
    console.log(undo_tie_on_off(embr.runs[1]!));
    return embr;
}
