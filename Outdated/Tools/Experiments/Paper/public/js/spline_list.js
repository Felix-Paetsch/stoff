// Most of spline routing goes through this

class SplineList{
    constructor(){
        this.splines = [];
    }

    add(spline){
        const p = new Spline_Preview(spline);
        p.render();
        this.splines.push({
            spline: spline,
            preview: p
        });
    }

    get_by_name(name){
        const res = this.splines.filter(s => s.spline.get_name().toLowerCase() == name.toLowerCase())[0]
        if (typeof res == "undefined"){
            throw new Error("No spline with name '" + name + "'");
        }
        return res.spline;
    }

    iterate(){
        return this.splines;
    }
}

const spline_list = new SplineList();