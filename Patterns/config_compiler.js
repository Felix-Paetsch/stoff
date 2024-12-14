export default function config_compiler(config){
    const conf = {
        meta: { for: config.Schnittmuster["für"]},
        neckline: config.neckline,
        sleeve: config.sleeve,
        dartAllocation: {
            type: config["top designs"].type,
            position: config["top designs"].position,
            dartstyle: config["top designs"].dartstyle
        },
        length: config["top designs"].length,
        ease: config["top designs"].ease
    };

    if (conf.dartAllocation.type == "single dart"){
        if (
            ![
                "waistline",
                "side middle",
                "french",
                "shoulder"
            ].includes(conf.dartAllocation.position)
        ){
            throw new Error("Selected type doesn't match 'single dart'");
        }
    } else if (config.dartAllocation.type == "styleline"){
        conf.dartAllocation.closed = conf["top designs"].closed;
        conf.dartAllocation.styleline_type = conf["top designs"].styleline;
    }
    
    return conf;
}