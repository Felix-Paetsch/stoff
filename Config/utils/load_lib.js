export default async function load_lib(path){
    if (typeof window === "undefined"){
        return await import(path);
    }

    return undefined;
}