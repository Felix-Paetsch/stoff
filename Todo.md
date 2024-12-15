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




We might want to chage what we mean by "side" bcs currently it is conflicting. The premirror stuff maybe should be called half instead.
I kinda want to move away from accessing points via p1, p2
ideally we dont have to access the sketch itself (much)
sketch.data should be moved to class data unless inherent to the sketch
armpit: anchored at 4 pts.. maybe enought to give with? maybe even construct 2 of these pts
=> maybe allows to render to sketch w only anchors
darAllocation_side_base.add_ease seems reasonable, but... maybe "offset_endpoints()


Notes
=======
Percent: Wo entlang der kanonischen linie eingefügt werden soll