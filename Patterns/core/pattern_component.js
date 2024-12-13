export default class PatternComponent{
    constructor(parent = null){
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
