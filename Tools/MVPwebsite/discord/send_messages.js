import CHANNELS from "./channel_id_map.json" assert { type: 'json' };
import { EmbedBuilder } from 'discord.js';
import try_wrapper from "./try_wrapper.js";

let client;
let event_manager;

export const init = function(_client, _event_manager){
    client = _client;
    event_manager = _event_manager;
}

export const send_message = try_wrapper(function(channel_ident, msg){
    let channel;
    if (typeof channel_ident == "string"){
        channel = client.channels.cache.get(CHANNELS[channel_ident.toLowerCase()]);

        if (!channel) {
            return event_manager.emit("discord_channel_not_found", {
                event_source: "discord",
                type: "error",
                error: new Error(`Channel: '${ channel_ident }' not found`),
                internal: true
            });
        }
    } else {
        channel = channel_ident;
    }

    channel.send(msg);
    return true;
});

export const send_embed = try_wrapper(function(channel_ident, embed_data, trigger_error = true){
    let channel;
    if (typeof channel_ident == "string"){
        channel = client.channels.cache.get(CHANNELS[channel_ident.toLowerCase()]);
        if (!channel) {
            return event_manager.emit("discord_channel_not_found", {
                event_source: "discord",
                type: "error",
                error: new Error(`Channel: '${ channel_ident }' not found`),
                internal: true
            });
        }
    } else {
        channel = channel_ident;
    }

    try{
        const embed = new EmbedBuilder()
        .setColor(embed_data.color || 0x4D6CFA)
        .setTitle(embed_data.title)
        .setTimestamp()

        if (embed_data.descr){
            embed.setDescription(embed_data.descr)
        }

        if (embed_data.fields){
            embed.addFields(
                ...embed_data.fields
            )
        }

        if (channel) channel.send({ embeds: [embed] });
        return true;
    } catch (err){
        if (!trigger_error){
            return;
        }
        
        return event_manager.emit("sending_embed_error", {
            event_source: "discord",
            type: "error",
            error: err,
            internal: true,
            embed_data: embed_data
        });
    }
});