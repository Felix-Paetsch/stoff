import PatternStage from "../../../../PatternLib/pattern_stages/baseStage.js";

export default class CutStage extends PatternStage{
    constructor(){
        super()
    }

    finish(){
        return this.wd.sketch;
    }
}