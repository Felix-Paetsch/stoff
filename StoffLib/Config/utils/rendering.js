import load_lib from "./load_lib.js";
const fs = await load_lib("fs");
const path = await load_lib("path");
const ejs = await load_lib("ejs");

export default function render_file_sync(p, data){
    const template = fs.readFileSync(p, 'utf-8');
    const template_dir = path.dirname(p);
    
    return ejs.render(template, data, {
        views: [template_dir]
    });
}