export default async function (debug_scene) {
    debug_scene = debug_scene || "index";

    // Try to import .ts file first, then fall back to .js
    let modulePath;
    let sceneModule;

    try {
        // Try TypeScript file first
        modulePath = `./scenes/${debug_scene}.ts`;
        sceneModule = await import(modulePath);
    } catch (error) {
        // Fall back to JavaScript file
        try {
            modulePath = `./scenes/${debug_scene}.js`;
            sceneModule = await import(modulePath);
        } catch (jsError) {
            throw new Error(
                `Could not find scene module: ${debug_scene}.ts or ${debug_scene}.js`
            );
        }
    }

    return sceneModule.default();
}
