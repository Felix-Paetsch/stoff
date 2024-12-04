import DC_CONF from "./config.json" assert { type: 'json' };

import { Client, GatewayIntentBits } from 'discord.js';
import { send_message, init as init_send_messages } from "./send_messages.js";
import start_listening from "./listen_events/index.js";

import { init_try_wrapper } from "./try_wrapper.js";

export default function activate_discord_bot(event_manager){
    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
    init_send_messages(client, event_manager);
    
    client.on('ready', () => {
        console.log(`Discord bot logged in as ${client.user.tag}!`);
        send_message("index", `Logged in as ${client.user.tag}!`);
    });

    client.on('messageCreate', message => {
        if (message.author.bot) return; // Ignore messages from bots

        const prefix = DC_CONF.prefix;

        if (message.content.startsWith(prefix)) {
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            if (command.length > 0){
                event_manager.emit(`discord_command_${ command }`, {
                    args,
                    channel: message.channel
                });
            }
        }
    });

    init_try_wrapper(event_manager);
    start_listening(event_manager);
    client.login(DC_CONF.api_token);
}