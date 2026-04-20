# Tomorrow (Today)

- Fix smooth out method ~ the arguments are so messed up and everything?
- on hover of image -> what to x and y and width and height mean?
    - probably bb.. but hmm
    - display cursor x,y instead?
embroidery from dst file / to dst file

- L systems
    - stochastic L-systems
https://en.wikipedia.org/wiki/L-system
"random" L-system rule inference
Design elements like branches, etc.
Parametric L systems,...

---------



[] unify (looks of) things with the same name
- gen_lines?

[] debug also handedness
[] better color utilities (gradients) for rendering
[] Annotation System; maybe have DST annotations as a start

[] if needed: resample polylines for svg builder to lower threshhold
[] svg builder faces with gradients

[] optimization with caching length to each entry of polyine?
[] get rid of some dependencies

[] unify what angle mean
[] circles padding invariant
[] do we want lines or lines()??

[] fractal curve research

Seeded randomness


### Reintroduce features

[] Caching
[] Faces
[] Render as video
[] For sewing patterns include the sketch validation

[] reintroduce colors for
- patterns
- dst

### Future features - non sewing

- speed utilities
- speed debug utilies
[] debug dev run can take optional argumetns for tracking, etc

### Future features - sewing



### Future features - embroidery

[] Make outline method
- a script

[] radial distance functions
- making a path of points by angular binary search around the last point
- can use this to make mandelbrot!
    - would maybe have to find the best angular point for this though?
- can use for auto-digitize lines?

[] good api for base shapes as polygons? n-gon?
[] svg parsing
- svgson

??? Embroidery?
[] Chaikins algorithm (later for embroidery; doable via geo)
[] concave hull

- script for making touching lines cross over

[] analyzing
- stitch density
- line density

### Future features - General

[] SVG parser thing?
[] custom annotation functions
- stamping out
[] better gradients
[] More svg options (?)
    - point styles in sketch rendering (?)
    - face gradients

### nvim

[] tab should only do tab things when in insert mode; also select multiple lines at once and pressing tab
[] rust code actions
