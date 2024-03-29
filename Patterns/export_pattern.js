const dummay_pattern = require("./dummy_pattern.js");

module.exports = {
    design_config: {
        "Example Config": [
            {
                "name": "Interpolation Count",
                "type": Number,
                "min": 2, 
                "max": 15,
                "default": 8,
                "step_size": 1
            }
        ],
        "Mesurements [Key1]": [
            {
                "name": "Kopf",
                "type": Boolean,
                "default": true
            },{
                "name": "Kopf2",
                "type": Number,
                "default": 2,
                "min": 0,
                "max": 5,
                "step_size": 0.01
            },{
                "name": "Kopf",
                "type": Boolean,
                "default": true
            },{
                "name": "Kopf2",
                "type": Number,
                "default": 2,
                "min": 0,
                "max": 5,
                "step_size": 0.01
            },{
                "name": "Kopf2",
                "type": Number,
                "default": 2,
                "min": 0,
                "max": 5,
                "step_size": 0.01
            }
        ],
        "Stuff [Key2]": [
            {
                "name": "Kopf",
                "type": Boolean,
                "default": true
            },{
                "name": "Kopf2",
                "type": Number,
                "default": 2,
                "min": 0,
                "max": 5,
                "step_size": 0.01
            }
        ]
    },
    create_design: (design_config) => {
        /* Function that takes in design config
           and returns sketch. This should only act as an interface to your real pattern entry point
           i.e. for formatting the design config, renaming parameters, ...
        */

        return dummay_pattern(design_config["Example Config"])
    }
}