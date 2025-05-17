import { send_embed } from "../send_messages.js";
import try_wrapper from "../try_wrapper.js";

export default function listen_errors(event_manager){
    event_manager.on("all", try_wrapper((type, data) => {
        if (!data || !(data.type == "error") || !(data.intern)){
            return;
        }

        let errorStack = data.error?.stack || 'No stack trace available';
        errorStack = errorStack.substring(0, 1000);
        
        send_embed("errors", {
            color: 0xFF0000,
            title: "Internal error",
            descr: data.text,
            fields: [{
                name: "Event",
                value: type || "NAS"
            }, {
                name: 'Stack Trace',
                value: `\`\`\`${errorStack}\`\`\``, inline: false
            }]
        }, false);
    }));
}