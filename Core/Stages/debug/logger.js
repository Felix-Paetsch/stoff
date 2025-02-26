export default class Logger{
    constructor(){
        
        this.messages = [];
    }

    message(msg){
        this.messages.push({
            msg
        });
    }
}