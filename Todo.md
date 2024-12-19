Partially Implemented with Leonie
================================================================
Sketch.dev.at_new_url
FIX: Sketch.dev.render_at -> Take current state not finish state
changes in Geometry?

TODO
================================================================
Introduce EPSILON
Self-intersection improvements (u.a. store prev results)
improve Docs
Arrange sketches in one panel using tetris


Website



Speed improvements
===================
Array of vectors => Float64Array of (x,y)


Design improvements
===================

We might want to chage what we mean by "side" bcs currently it is conflicting. The premirror stuff maybe should be called half instead.
I kinda want to move away from accessing points via p1, p2
ideally we dont have to access the sketch itself (much)
sketch.data should be moved to class data unless inherent to the sketch
armpit: anchored at 4 pts.. maybe enought to give with? maybe even construct 2 of these pts
=> maybe allows to render to sketch w only anchors
darAllocation_side_base.add_ease seems reasonable, but... maybe "offset_endpoints()
.fill_darts and .fill_darts_tuck

Probably Fix single dart first and then adress Outer/Inner problem

    /*
    
        Todo Next:
        2.
        Figure out what fill_in_darts macht (und ob fill_darts umbenannt werden sollte)
        Incorporate "Seam Allowance"

        3. Fix for other configurations

        Remove
        ordered_lines();

        4. Start 2nd round of refactor:
        - Delte unnesseccary files
        - Look at Todo.md
        - Rename things
    */

    Calculate inner/outer from the other point! (they share an endpoint..)
    Single Middle Dart: Unified mechanism for choosing the correct point

Make more asserts
Render Till Crash
adjust_measurements.js muss temporär bleiben
remove unneccessary things: Mark things as temporary (e.g construction stack env ...)
    i.e. get a new enviroment to construct things in and then at the end can pop that environment

get_line by:
    special characterisitcs
    adjacent lines/pts

allow several recordings / things at the same url, sep by _________ many iframes?
.simple_middle_dart() abstract this split operation


Update mutable functions for sketch