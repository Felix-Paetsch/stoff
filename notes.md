Todo: Infering line numbers for recodings
=> We can cache things...
=> But only Cache when not reloading (reloading signal?)

// set line style ()
// reset line style ()


Get Away from React? Or fix react errors. Lazy load line numbers?
Make UI nicer; e.g. when hovering -- make it easier

Talk with Leonie abt current progress


============



- Make things faster
- Render to A4
- Sewings
- Leonies Muster

- Get away from react?


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


Need to do maybe some more speed testing/building for it
- sample point calculations/etc. as iterator; lazily computed?

Importing DST/SVG
- "I want the sample points from the nth line in the dst"
- "I want the nth color group"

Exporting to DST
Rework exporting to SVG

Compile out js to wasm? Maybe with this js to wasm compiler?
See x,y of mouse all the time while hovering?

Length preserving reparameterization via spline through points
=> resampling

Hovering the sketch but no items, it still shows me a hover thing.. (with the dev things)


Clean up line methods and their positions
Default line segment length might be a fn of total size..
