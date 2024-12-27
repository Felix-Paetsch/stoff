(Für Leonie)

## ToDo
- Wenn ein einfacher Abnaeher einen bestimmten Winkel überschreitet, sollte eine Warung ausgegeben werden!
- #calculate_upright_position

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
Assert Functionality (2LINES)
assert.TWO_LINES(pt);
=> Reorganize in core and so on how asserts happen

adjust_measurements.js muss temporär bleiben
remove unneccessary things: Mark things as temporary (e.g construction stack env ...)
    i.e. get a new enviroment to construct things in and then at the end can pop that environment

get_line by:
    special characterisitcs
    adjacent lines/pts

allow several recordings / things at the same url, sep by _________ many iframes?
.simple_middle_dart() abstract this split operation


Update mutable functions for sketch

this.triangle?
this.movr_center? when moving the endpoint of a dart
handle duplicate points on computing tangent vector
handle Intersect lines at double points
.stencil?
Note: currently cut and glue don't enforce totally correct input (for now)

[Als hilfe für mich] Diagramm was wie passiert aufmalen


## Pattern
Vollständiges Ding -> insb. auch für Website interaktion
## Component
Connected Component  (Fron&Back)
## SubComponent (?)
Neckline, ...
=> Components can be rendered "out of context"

Move Assert somewhere different from standard debug?

StandAlone things maybe move somewhere else...
==============================================
Fill in dart
add_seam_allowance (sollte auf componenten klasse sein (?) oder zumindest auf den Instanzen)

Better Epsilon handling (see e.g. geometry)
Make anchor data object a string

.dev.at_url(a,b, true/false) doesnt work for false

geometry angles -> input two line segments

.next();
// Next thing in one direction



Docs:
========
Remove Backticks from title