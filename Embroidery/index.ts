import { Out } from "@/Dev";
import { embroideryConfig } from "./config";
import { BufferDST } from "./Projects/buffer/index";
import { GraphsProject } from "./Projects/graphs/index";
import { LSystemProject } from "./Projects/lsystem/index";
import { ReplacementFractal } from "./Projects/replacement_fractal/index";
import { TestEmbr } from "./Projects/test/index";

const projects = [
    TestEmbr,
    ReplacementFractal,
    BufferDST,
    LSystemProject,
    GraphsProject,
] as const;

const project = projects.find((p) => p.name === embroideryConfig.project);

if (!project) {
    console.log(
        `Project "${embroideryConfig.project}" not found! All available patterns are:`,
    );
    projects.forEach((p) => {
        console.log(`- ${p.name}`);
    });
    process.exit(1);
}

Out.clear();

type ProjectUnion = (typeof projects)[number];
type SelectedProject = Extract<
    ProjectUnion,
    { name: (typeof embroideryConfig)["project"] }
>;

const typedProject: SelectedProject = project;
const res = Out.run_wrapped(typedProject.embroidery, embroideryConfig);

if (Array.isArray(res)) {
    for (let i = 0; i < res.length; i++) {
        Out.put(res[i]!, "~out" + i);
    }
} else if (res) {
    Out.put(res, "~out");
}
