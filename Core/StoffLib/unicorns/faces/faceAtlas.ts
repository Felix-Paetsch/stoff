import { Line } from "../../line.js";
import { parseFaceComponents, ConnectedFaceComponent } from "./algorithms/buildConnectedComponentMap";
import findFaces from "./algorithms/findFaces.js";
import Face from "./face.js";
import RogueChain from "./rogue.js";
import { ConnectedComponentFaceData } from "./algorithms/findFaces.js";
import Sketch from "../../sketch.js";
import register_collection_methods from "../../collection_methods/index.js";
import Point from "../../point.js";

export default class FaceAtlas {
    readonly faces: Face[] = [];
    readonly lines: Line[] = [];
    readonly outsideRougeChains: RogueChain[];
    readonly rogueChains: RogueChain[] = [];

    readonly connectedComponents: ConnectedFaceComponent[];
    readonly maximalComponents: ConnectedFaceComponent[];

    constructor(connectedComponents: ConnectedComponentFaceData[], public sketch?: Sketch) {
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

        this.connectedComponents = parseFaceComponents(connectedComponents);
        this.maximalComponents = this.connectedComponents.filter(component => !component.parent_component);
        this.lines = Array.from(new Set(this.faces.flatMap(f => f.get_lines())
            .concat(this.rogueChains.flatMap(c => c.get_lines()))));
    }

    get_lines(): Line[] {
        return this.lines;
    }

    get_points(): Point[] {
        return Array.from(new Set(this.lines.flatMap(l => l.get_endpoints())));
    }

    get_sketch(): Sketch | null {
        return this.sketch;
    }

    adjacent_faces(line: Line): [Face, Face] | [RogueChain, Face | null] | null {
        if (!this.lines.includes(line)) return null;
        const faces = this.faces.filter(f => f.get_lines().includes(line));
        if (faces.length > 1) {
            if (faces[0].line_handedness(line)) {
                return [faces[0], faces[1]];
            } else {
                return [faces[1], faces[0]];
            }
        }
        const chain = this.rogueChains.find(c => c.get_lines().includes(line));
        return [
            chain,
            chain.face()
            || chain.component().parent_face
            || chain.component().parent_component
            || null
        ]
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

register_collection_methods(FaceAtlas);