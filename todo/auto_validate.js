"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auto_validate = auto_validate;
var sketch_is_valid_1 = require("../expect_methods/sketch_is_valid");
var wrap_sketch_methods_1 = require("./wrap_sketch_methods");
function auto_validate(SC) {
    var currently_internal = false;
    (0, wrap_sketch_methods_1.wrap_sketch_prototype_methods)(SC, function (evaluate, s) {
        var was_already_internal = currently_internal;
        currently_internal = true;
        var res = evaluate();
        if (!was_already_internal)
            (0, sketch_is_valid_1.validate_sketch)(s);
        currently_internal = was_already_internal;
        return res;
    });
}
