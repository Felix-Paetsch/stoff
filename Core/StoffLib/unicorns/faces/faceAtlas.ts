import { Line } from "../../line.js";
import buildConnectedComponentMap from "./algorithms/buildConnectedComponentMap.js";
import findFaces from "./algorithms/findFaces.js";
import Face from "./face.js";
import RogueChain from "./rogue.js";
import { ConnectedComponentFaceData } from "./algorithms/findFaces.js";

export default class FaceAtlas {
    readonly faces: Face[] = [];
    readonly outsideRougeChains: RogueChain[];

    readonly connectedComponents: ReturnType<typeof buildConnectedComponentMap>;

    constructor(connectedComponents: ConnectedComponentFaceData[]) {
        connectedComponents.forEach(data => {
            data.faces.forEach(face => {
                (face as any).faceAtlas = this;
                this.faces.push(face);
            });
            data.chains.forEach(chain => {
                (chain as any).faceAtlas = this;
            });
            if (data.outer_face) {
                (data.outer_face as any).faceAtlas = this;
            }
        });

        this.connectedComponents = buildConnectedComponentMap(connectedComponents);
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