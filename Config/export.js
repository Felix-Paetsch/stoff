import Config from "./config.js";

import CBoolean from "./boolean.js";
import CContainer from "./container.js";
import CNumber from "./number.js";
import COption from "./option.js";
import CSelection from "./selection.js";
import CStatic from "./static.js";

export default {
    Config,
    CBoolean,
    CContainer,
    CNumber,
    COption,
    CSelection,
    CStatic
}

console.log(new Config([
    new COption(
        "My fance option", ["hey", "yhou", "rd option"]
    ),
    [
        "hey",
        "you"
    ],
    new CBoolean("my fav bool")
]));