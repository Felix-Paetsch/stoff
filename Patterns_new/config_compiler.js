export default function config_compiler(config){
    const conf = {
        meta: { for: config.Schnittmuster["für"]},
        neckline: config.neckline,
        sleeve: config.sleeve,
        dartAllocation: {
            type: config["top designs"].type,
            position: config["top designs"].position,
            dartstyle: config["top designs"].dartstyle,
            one_waistline_dart: config["top designs"]["single waistline dart"]
        },
        length: config["top designs"].length,
        ease: config["top designs"].ease
    };

    if (conf.dartAllocation.type == "single dart" || conf.dartAllocation.type == "multiple darts"){
        if (
            ![
                "waistline",
                "side",
                "french",
                "shoulder",
                "neckline",
                "armpit"
            ].includes(conf.dartAllocation.position)
        ){
            throw new Error("Selected type doesn't match 'single dart' or 'multiple darts'");
        }
    } else if (conf.dartAllocation.type == "styleline"){
    //    conf.dartAllocation.closed = conf["top designs"].closed;
        conf.dartAllocation.styleline_type = config["top designs"].styleline;
    } 
     if(conf.dartAllocation.type == "multiple darts"){
        conf.dartAllocation.multiple_darts_number = config["top designs"]["number of multiple darts"];
    }
    
    return conf;
}