import CONF from './config.json' with {type: "json"};

function* generate_setting(design_config){
    let frame = 0;
    while (true){
        const res = design_config.to_obj();
        res.frame = frame;
        yield res;
        frame++;
    }
}

export default function _generate_setting(design_config){
    const gen = generate_setting(design_config);
    return () => gen.next().value;
}