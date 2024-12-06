export default function add_rendering_utils(req, res, next){
    const visited_css_files = [];
    res.locals.import_css_once = (path) => {
        if (visited_css_files.includes(path)){
            return "";
        } else {
            visited_css_files.push(path);
            return `<link rel="stylesheet" href="${ path }">`
        }
    }
    next();
}