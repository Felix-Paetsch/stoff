export default class PatternComponent{
    constructor(measurements = {}, config = {}, design = {}){
        this.mea = measurements;
        this.measurements = measurements;
        this.config = config;
        this.design = design;
    }

    // später will ich das über das Objekt design machen
    get_length(){
      return this.design["top designs"].length;
    }
}
