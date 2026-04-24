Modify gitignore


Graph as class? Parametric?

Technically rendering embroidery has some bugs
- the first frame
- the last frame
are both currently "to much"
slow down embr viz speed
Vertex? Node?

Graph.identify equal points
Graph.remove_crossings (should also work when a point is on another pt; should also automaticall identify points)

Graph.Graph?
bind method to static graph class?
where to put double_run?
- more into GraphUtils

https://dl.acm.org/doi/fullHtml/10.1145/3394105
https://github.com/jianweiguo/IPML2d


Rust:
g.extend_with_edges() in the initialization


# Tomorrow (Today)

Idea: use can iteration to generate a fractal or thing, applying it to the sample points of a polyline resulting in an already closed shape
percolation clusters
self avaoiding walks
finite subdivision
fractal flames

organize code

---------

Graphs
- tsp (use rust)
- minimum spanning tree
- ...

Plotting image with embroidery as optiomization function over the input variables

Ein path initializer on an image
- make points
- traveling salesman
- minimum spanning tree

Then post processing stepts like MST, numerical optimizer,...

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
[] circles padding invariant (when rendering svgs)
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

- script for making touching lines cross over

[] analyzing
- stitch density
- line density

[] tuck down stitch/end stitch
countour stitch
maze fill
stem stitch

ZMK-like embroidery file analysis
    - stitches per area
    - thread per area
    - 

https://ko-fi.com/s/bab05e779e

> 
> 
> I am curious about what algorithm you used for generating this.
> 
> If I had to guess, it's an ordered point cloud mutated by simulated annealing plus an image similarity heuristic (assuming it's based on a reference image).
> 2
> u/sudhabin avatar
> sudhabin
> OP •
> 2d ago
> 
> It uses a weighted Nearest Neighbor search to build a single continuous path through high-density pixel areas. It then applies a Gaussian convolution and Catmull-Rom splines to smooth.
> 2

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
[] sometimes when saving with ts it autoformats and it messed up big time (mostly) imports, sometimes fn defn (?)
