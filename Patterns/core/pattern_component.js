export default class PatternComponent{
    constructor(parent = null){
        if (parent){
            this.mea = parent.mea;
            this.measurements  = parent.mea;
            this.design_config = parent.design_config;
        }

        this.parent = parent;
        this.components = []
    }
    
    get_components(){
        return this.components;
    }

    render(){
        throw new Error("Unimplemented for this component type");
    }
}
