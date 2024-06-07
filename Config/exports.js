import Config from "./config.js";

import CBoolean from "./boolean.js";
import CContainer from "./container.js";
import CNumber from "./number.js";
import COption from "./option.js";
import CSelection from "./selection.js";
import CStatic from "./static.js";

function config(...children){
    return new Config(...children);
}

function cBoolean(name, _default = false){
    return new CBoolean(name, _default);
}

function cContainer(name, ...children){
    return new CContainer(name, ...children);
}

function cNumber(name, settings = null){
    return new CNumber(name, settings);
}

function cOption(name, ...children){
    return new COption(name, ...children);
}

function cSelection(name, ...children){
    return new CSelection(name, ...children);
}

function cStatic(name, value = null){
    return new CStatic(name, value);
}

export {
    Config,
    CBoolean,
    CContainer,
    CNumber,
    COption,
    CSelection,
    CStatic,

    config,
    cBoolean,
    cContainer,
    cNumber,
    cOption,
    cSelection,
    cStatic
}

/*console.log(new Config([
    new COption(
        "My fance option", ["hey", "yhou", "rd option"]
    ),
    [
        "hey",
        "you"
    ],
    new CBoolean("my fav bool")
]));*/