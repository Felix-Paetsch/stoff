import BaseStage from "../../../../../../Core/Stages/base_stages/baseStage.js";

export default class CutStage extends BaseStage{
    constructor(){
        super()
    }

    finish(){
        return this.wd.sketch;
    }
}