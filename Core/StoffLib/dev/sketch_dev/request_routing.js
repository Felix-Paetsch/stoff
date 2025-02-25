

export default class Route{
    constructor(url, method, overwrite = null){
        this.url = url;
        this.method = method.toUpperCase();
        this.overwrite = overwrite;

        if (!this.constructor.Sketch.dev._register_route){
            throw new Error("Not connected to server");
        }

        this.constructor.Sketch.dev._register_route(this);
    }

    request(){
        // return string (html) or obj (json)
        throw new Error("Not implemented for this route");
    }

    render(){
        return request();
    }
}