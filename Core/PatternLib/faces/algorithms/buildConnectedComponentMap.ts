import { ConnectedComponentFaceData } from "./findFaces.js";
import { ConnectedFaceComponent } from "../connectedFaceComponent.js";

export function parseFaceComponents(data: ConnectedComponentFaceData[]): ConnectedFaceComponent[] {
    const components: ConnectedFaceComponent[] = data.map((componentData) => ({
        parent_face: null,
        parent_component: null,
        faces: componentData.faces,
        component: componentData.outer_face,
        outer_chains: [],
        inner_chains: [],
        subcomponents: []
    }));

    const containmentPairs: { parent: number, child: number }[] = [];

    for (let i = 0; i < components.length; i++) {
        for (let j = 0; j < components.length; j++) {
            if (i === j) continue;

            const parentComp = components[i];
            const childComp = components[j];

            if (parentComp.component && childComp.component &&
                parentComp.component.contains(childComp.component)) {
                containmentPairs.push({ parent: i, child: j });
            }
        }
    }

    for (let childIdx = 0; childIdx < components.length; childIdx++) {
        const childComp = components[childIdx];

        const potentialParents = containmentPairs
            .filter(p => p.child === childIdx)
            .map(p => p.parent);

        if (potentialParents.length === 0) continue;

        let smallestParentIdx = potentialParents[0];
        let smallestArea = components[smallestParentIdx].component?.area() ?? Infinity;

        for (const parentIdx of potentialParents) {
            const parentArea = components[parentIdx].component?.area() ?? Infinity;
            if (parentArea < smallestArea) {
                smallestArea = parentArea;
                smallestParentIdx = parentIdx;
            }
        }

        const parentComp = components[smallestParentIdx];
        childComp.parent_component = parentComp.component;
        parentComp.subcomponents.push(childComp);

        for (const face of parentComp.faces) {
            if (face.contains(childComp.component!)) {
                childComp.parent_face = face;
                break;
            }
        }
    }

    for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const chains = data[i].chains;

        for (const chain of chains) {
            let isInner = component.component?.contains(chain);
            isInner && component.inner_chains.push(chain);
            !isInner && component.outer_chains.push(chain);
        }
    }

    return components;
}