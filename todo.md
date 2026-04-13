
# Next

Create a files index.ts export
Figure out geometry export structure


# All


[] figure out what to do with eps; also give it better meaning
[] also have max iteration bounds in eps file
- expensive
- inexpensive

[] fix and figure out faces (?)
    or just ignore?

[] testing, testing, testing
[] get back into caching
- speed utilities
- speed debug utilies
[] unify (looks of) things with the same name
- gen_lines?

[] make some boolean args strings
- relative, absolute
[] debug also handedness

[] better color utilities (gradients) for rendering
[] dst render/writer engine
[] DST / stitching subdir with my methods
[] Annotation System; maybe have DST annotations as a start
[] DST debug/dev env; maybe with live knobs and dials
[] live buttons for leonie?? e.g. to help her finding the correct numbers for her pattern

[] custom annotation functions
- stamping out

[] get faces to work again

[] point styles in sketch rendering (?)
[] if needed: resample polylines for svg builder to lower threshhold
[] svg builder faces with gradients

[] optimization with caching length to each entry of polyine?
[] get rid of some dependencies
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
[] fix gitignore

[] radial distance functions
- making a path of points by angular binary search around the last point
- can use this to make mandelbrot!
    - would maybe have to find the best angular point for this though?
- can use for auto-digitize lines?
[] unify what angle mean
[] more suffisticated Numerics.eps
[] Clean up geometry methods
[] figure out more with numerics, maybe neeeed to give custom values..
[] for what do I need geo?
[] rust code actions
[] from points vs from verticies?
[] figure out more abt what to do with sample spacing..
[] caching where needed. Evt connected component faster
[] circles padding invariant
[] do we want lines or lines()??
[] sketch points, lines as methods?
[] on hovering sketch area i would like to see the sketch data
[] change render sketch input to an object instead of many render args
[] tab should only do tab things when in insert mode; also select multiple lines at once and pressing tab
[] improve/clean gitignores
[] organize justfiles with recipies. Can also call with :: then!!
more thng with many arguments to object arguemtns, e.g.
CollectionMethods.get_points
[] why currently no img in global recording for current sewing project?
[] actually perform the clean setup to get into developing for sewing (also for testing stuff for me and so on)
- ignore other things in typecheck

??? Embroidery?
[] Chaikins algorithm (later for embroidery; doable via geo)
[] concave hull
[] in insert mode make tab always jsut do insert tab

