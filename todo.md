Scale points and stroke width and so on down to fit a certain pixel area on the screen in sketch rendering.

# Tomorrow


Fix svg gradients
- segments (two or more are not shown)
- probably a polyline issue
- unlazyfy
- gradients in different directions
- can/should reuse stops, but really have to do one for each thing
just have 5 new things per line. The gradient API outwards is fine and could just use a little bit of improvement, asking for gradients from, to, in a specific direction.

Allow for text

Write method (outside of files) for
- rendering to A4 pages

Ideally: Can now remove all Core/rendering methods
Can fix all remaining errors displayed..


# In general


[] gradient: use new id for each segment

[] Move things out of SVG that aren't SVG builder

[] change polyline, polygon to f32 arrays
[] introduce wasm
[] Interpolate shapes should return a new shape
[] shapes.merge() should also merge closed shapes which touch another shape
[] split polylines/shape at point
[] figure out distance and polyline intersection positions of closest points, etc.
[] move tangent vector stuff to polylines/gons
[] create polyline/gon from polyline function
[] move polygon things from geometry into shapes
[] project onto
[] closest line
[] copy, blablabla, is_straight, hulls
[] fix unimplemented functions
    - reimplement them smartly with common methods

[] self intersection test
[] polyline/gon intersection finding
[] fix rendering
[] fix and figure out faces (?)
    or just ignore?

[] testing, testing, testing
- absolute points
- closed paths
[] create a testing framework
- save a sketch to a json file to compare it at a later point
- this should include all point positions and sample points
- check for approximate equality with points and lines and so on
[] get back into caching
- speed utilities
- speed debug utilies
[] get rid of all render attributes except color when making the design 
- maybe even color
- can be inside the data attribute thing flattened via a get_color and set_color utility that sets _color attributes and so on => we dont have to concern stoff with it
[] start from a point and move by a polyline to a new point
[] make a line out of a polyline/polygon
[] implement the rotate polygon method

[] Figure out polyline/gon internals with functions; temporaty functions?
- reparameterize methods... ?
- or just.. not?
[] Get corners of a line
[] whereever reasonable dont include sketch in methods
[] unify (looks of) things with the same name
- gen_lines?

[] get rid of @core autocomplete..
[] hovering sketch but no items it still shows me something.. and not just the current cursor position
[] sketch data?
[] make some boolean args strings
- relative, absolute
[] debug also handedness

[] good svg render engine
- sketches just _are there_ and maybe should not themselves own rendering
[] better color utilities (gradients) for rendering
[] dst render/writer engine

[] DST / stitching subdir with my methods
[] Annotation System; maybe have DST annotations as a start
[] DST debug/dev env; maybe with live knobs and dials
[] live buttons for leonie?? e.g. to help her finding the correct numbers for her pattern
[] move to float32 array?

[] custom annotation functions
- stamping out

[] get faces to work again
[] svg rendering
- gradient on lines
- ...

[] group directory exports together better
[] point styles in sketch rendering (?)
[] if problem: in sketch to svg resize viewport
[] if needed: resample polylines for svg builder to lower threshhold
[] svg gradients following line
- split into two segments
svg.use_gradient(): SVGGradient

[] optimization with caching length to each entry of polyine?
[] for resampling take sufficiently far away points for splines; at least remove dublicates
[] not that a polygon with first and last point identical has this point as a duplicate
[] svg: unlazyfy as much as possible
- the strings that can be prerendered should be
- this also removes bugs when rendering twice
[] do gradients need to be rotated correctly(?!)
[] for gradients with one segment don't have two copies
[] allow for more varied gradients
[] have polygon and line gradients (segments) start and end at the correct positions. Currently seem to only depend on bounding box?
[] reorganize imports
[] restructure project
[] move shapes to geometry
[] restructure geometry (maybe only when starting with rust era)
[] move sketch rendering to sketch
[] get rid of some dependencies
- sass
- bcrypt
- 
[] reintroduce colors for
- patterns
- dst
[] fix debug scenes
[] good api for base shapes as polygons? n-gon?

[] rewire commands
[] build testing out
- each test has an expect image and a calculated image (or error)
[] debug dev run can take optional argumetns for tracking, etc
[] fix/use config file
[] automatically remove unused imports..
[] fix gitignore
[] fix padding overlapping circles.. maybe no border?
[] test if empty sketches or sketches with only one pt work
[] line: many polygon edgecases. Should write them down.
[] line gradient rendering
[] encode right ahnd left hand and p1 p2 with colors
[] if gradient length == 1 => don't create a 2nd gradient

[] radial distance functions
- making a path of points by angular binary search around the last point
- can use this to make mandelbrot!
    - would maybe have to find the best angular point for this though?
- can use for auto-digitize lines?
[] unify what angle mean
