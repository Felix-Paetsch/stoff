import { Out } from "@/Dev";
import { embroideryConfig } from "./config";
import { TestEmbr } from "./Projects/test/index";
import { EmbroideryProject } from "./types";

const projects = [TestEmbr] as const;

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

const typedProject: (typeof projects)[number] &
    EmbroideryProject<(typeof embroideryConfig)["project"], any> = project;
const res = Out.run_wrapped(typedProject.embroidery, embroideryConfig);

if (Array.isArray(res)) {
    for (let i = 0; i < res.length; i++) {
        Out.put(res[i]!, "~out" + i);
    }
} else {
    Out.put(res, "~out");
}
