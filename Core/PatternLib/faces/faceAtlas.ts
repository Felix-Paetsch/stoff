import { Line } from "../../StoffLib/line.js";
import { parseFaceComponents } from "./algorithms/buildConnectedComponentMap.js";
import findFaces from "./algorithms/findFaces.js";
import Face from "./face.js";
import RogueChain from "./rogue.js";
import { ConnectedComponentFaceData } from "./algorithms/findFaces.js";
import Sketch from "../../StoffLib/sketch.js";
import register_collection_methods from "../../StoffLib/collection_methods/index.js";
import Point from "../../StoffLib/point.js";
import { ConnectedFaceComponent } from "./connectedFaceComponent.js";

export default class FaceAtlas {
    // Doesnt automatically update with sketch changes
    // (Mostly because things currently are to expensive)

    readonly faces: Face[] = []; // Primitive faces
    readonly lines: Line[] = [];
    readonly outsideRougeChains: RogueChain[] = [];
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
                this.rogueChains.push(chain);
            });
            if (data.outer_face) {
                (data.outer_face as any).faceAtlas = this;
            }
        });

        this.connectedComponents = parseFaceComponents(connectedComponents);
        this.maximalComponents = this.connectedComponents.filter(component => !component.parent_component);
        this.lines = Array.from(new Set(this.faces.flatMap(f => f.get_lines())
            .concat(this.rogueChains.flatMap(c => c.get_lines()))));

        this.maximalComponents.forEach(component => {
            this.outsideRougeChains.push(...component.outer_chains);
        });
    }

    get_lines(): Line[] {
        return this.lines;
    }

    get_points(): Point[] {
        return Array.from(new Set(this.lines.flatMap(l => l.get_endpoints())));
    }

    get_sketch(): Sketch | null {
        return this.sketch || null;
    }

    adjacent_faces(line: Line): [Face, Face] | [RogueChain, Face | null] | null {
        if (!this.lines.includes(line)) return null;


        const chain = this.rogueChains.find(c => c.get_lines().includes(line))!;
        if (chain) return [
            chain,
            chain.face()
            || chain.component().parent_face
            || chain.component().parent_component
            || null
        ]

        const faces = this.faces.filter(f => f.get_lines().includes(line));

        // The other face is an outside face
        if (faces.length === 1) {
            faces.push(this.component_from_face(faces[0]).component);
        }
        if (faces[0].line_handedness(line)) {
            return [faces[0], faces[1]];
        } else {
            return [faces[1], faces[0]];
        }
    }

    component_from_face(face: Face) {
        const comp = this.connectedComponents.filter((c) => c.faces.includes(face))[0]!
        return comp as ConnectedFaceComponent & {
            component: Face
        }
    }

    is_boundary_line(line: Line): boolean {
        return this.maximalComponents.some(c => c.component?.get_lines().includes(line));
    }

    static rogue_lines_to_chains(lines: Line[]): RogueChain[] {
        const chains: Line[][] = [];
        const to_visit: Line[] = lines.map(l => l);

        let current_line: Line | undefined;
        while (current_line = to_visit.pop()) {
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

            chains.push([current_line]);
        }
        return chains.map(c => new RogueChain(c));
    }

    static from_lines(lines: Line[], _sketch?: Sketch): FaceAtlas {
        const atlas = findFaces(lines);
        if (_sketch || (lines as any).get_sketch instanceof Function) {
            const sketch = _sketch || (lines as any).get_sketch();
            atlas.sketch = sketch;
        }
        return atlas;
    }
}

register_collection_methods(FaceAtlas);