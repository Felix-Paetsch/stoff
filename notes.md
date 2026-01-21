Q: What to do with sketch data?

Hower things
Get rid of Sketch Data (?)

Todo: Deal with design config => maybe just an input object one can input as text
Also the export things could export can object which tells you about the shape and everything they expect

Export data corretly aswell



- get demos all to work
- Make debug nicer
- Leonie thing


Felix Todo Right now:
- What exactly are each command for? (How is it with hot reloading?)
- What to do with "lines cannot be ordered"
- Transform more to TS
- Figure stuff out
- Typecheck

What I want:
a) How reload
b) Typecheck & console for watch



Debug Performance!!

Main Problem currently:
... has_sketch_elements (50ms)
... Sketch Element collection ~> Everything abt it (50ms)
... assert / check sketch is valid

unfold, glue
merge lines

Todo:
Dedub render

integrate tRPC
Learn

Learn:

React
tRPC
Next
Zod (validation)

(For point algorithms: https://github.com/w8r/martinez/blob/master/src/segment_intersection.js#L29)


==== REACT


## Me

> Context:
> - <file>DevEnv/NewDevServer/src/App.tsx</file>
> - <group>files</group>

I want you to create a small react app for me using @{files} starting from App.tsx. It should do/have the following.

1. The start page.

I want a bar at the top (with full color) saying StoffStoff2. I want the main content to be devided into a left and right column. There should be a clear visual separation between them. The left column should have two (to the bottom automatically extending) text areas for code (json) input - ideally with live json highlighting. The top input should have the title "Design Config". It should default to this object:

{
    pattern_name: "T-Shirt",

    'Darts fitted': '0_nothing',
    'Darts standard': '0_nothing',
    'Darts wide': '0_nothing',
    Fancy: '0_none',
    Main_Body: 'fitted',
    Neckline: 'round',
    Sleeves: '0_standard_kurz'
}

the bottom has the name "Measurements" and default to this:

{
    "over_bust_front": 45,
    "over_bust_back": 46,
    "belly_front": 45,
    "belly_back": 40,

    "shoulder_length": 13,//7.5,
    "shoulder_width": 40,
    "bust_width": 95,
    "under_bust": 82,
    //"bust_width_front": 0,
    //"bust_width_back": 0,
    "bust_point_width": 19,
    "bust_point_height": 17.5,
    "shoulderblade_width": 12.5,
    "shoulderblade_height": 14.5,
    "waist_width": 78,
    //"waist_width_front": 0,
    //"waist_width_back": 0,
    "waist_height": 20.5,
    "shoulder_height_front": 44,
    "shoulder_height_back": 38.5,
    "center_height_front": 33,
    "center_height_back": 36,
    "across_front": 0,//34,
    "across_back": 32,
    "diagonal_front": 44.5,
    "diagonal_back": 37,
    "side_height": 21.5,
    "bottom_width_front": 50,
    "bottom_width_back": 55,
    //"belly": 95,
    "arm": 31,
    "arm length": 56.5,
    "wristwidth": 20.5,
    "ellbow_width": 26,
    "ellbow_length": 32
}

When you click the top bar it toggles whether or not the left column is visible. Upon finishing editing a textarea (loose of focus) I want to parse the json (and eventually) use it. When the json is invalid, instead show an error below the input to signify that it is invalid.
In between hot reloads the current state of the input boxes should be remembered as well as possible. Below the two input boxes have a grayed out version of both defaults to copy into the boxes if one wants to. The columns should be seperately scrollable.

The right hand side should render an array of svgs together with some associated text for each svg. I think you should just render all or from below each other with a text on the right. The svgs will be a function of the json on the left. This function will be able to fail. In that case render an error message instead, together with the trace of that error (the errorstack-size should be infty)
For now make this function just a dummy function.

Cleanly organize your code into files. There will be more pages later.


## CodeCompanion (OpenAI Compatible)


