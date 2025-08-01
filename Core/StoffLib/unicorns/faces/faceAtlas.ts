import { Line } from "../../line.js";
import buildFaceMap from "./algorithms/buildFaceMap.js";
import calculateFaceComponents from "./algorithms/calculateComponents.js";
import findFaces from "./algorithms/findFaces.js";
import Face from "./face.js";
import RogueChain from "./rogue.js";

export default class FaceAtlas {
    readonly faceMap: ReturnType<typeof buildFaceMap>;
    readonly topLevelFaces: Face[];
    readonly outsideRougeChains: RogueChain[];

    readonly components: Face[];

    constructor(public faces: Face[], public chains: RogueChain[] = []) {
        for (const face of faces) {
            (face as any).faceAtlas = this;
        }

        this.faceMap = buildFaceMap(this);
        this.topLevelFaces = [];
        this.outsideRougeChains = chains;
        this.faceMap.forEach((data, face) => {
            if (data.parent_face == null) {
                this.topLevelFaces.push(face);
            }
            data.internal_chain.forEach(chain => {
                const index = this.outsideRougeChains.indexOf(chain);
                if (index !== -1) {
                    this.outsideRougeChains.splice(index, 1);
                }
            });
        });

        this.components = calculateFaceComponents(this);
    }

    static rogue_lines_to_chains(lines: Line[]): RogueChain[] {
        const chains: Line[][] = [];
        const to_visit: Line[] = lines.map(l => l);

        while (to_visit.length > 0) {
            const current_line = to_visit.pop();
            for (const chain of chains) {
                if (chain[0].common_endpoint(current_line)) {
                    chain.unshift(current_line);
                    break;
                }
                if (chain[chain.length - 1].common_endpoint(current_line)) {
                    chain.push(current_line);
                    break;
                }
            }
        }
        return chains.map(c => new RogueChain(c));
    }

    static from_lines(lines: Line[]): FaceAtlas {
        return findFaces(lines);
    }
}