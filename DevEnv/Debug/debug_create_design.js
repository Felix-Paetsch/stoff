export default async function(debug_scene) {
    debug_scene = debug_scene || "index";

    const modulePath = `./scenes/${debug_scene}.js`;
    const sceneModule = await import(modulePath);

    return sceneModule.default();
}