sketches and resampling lns/gons dont go well together
also resampling is sloooow, I guess it is to fine. When doing strict resampling you dont need to resample on straight lines
fix offset sharp

to vs into?

breitensuche, tiefensuche, associated data?
min spanning tree on verticies

graph connected components
graph connected component_graphs

degrees for nodes?
maybe vertex and edges are just numbers but they can have data?
but then how do we code minimal spanning tree?
get degrees for verticies

=> graph toolbox?
=> in general a graph subsystem?
=> Make a list of potentially important methods on graphs and where to find them


- interpolate lines vs interpolate shapes?
    methods on lines vs methods on shapes? when both? I mean in this case they do a bit different stuff still

- reorganize project
- fill in leonies methods
- restructure test files
- graph accessor methods
- suborganize
    - algorithms
    - ...

- put cut/glue/unfold/to A4 printable to leonie/sewing

- collect what code should go where








1. Where to put compute...?
2. use this to build Leonies method
3. use this to build my method


# Question

Where to put misc methods / The things in unstructured


# Todoooo

It seems like currently we have two formatter after another when saving in JS!

1. test leonies stuff
2. improved buffer
3. offset method for leonie
4. evaluate discord channel
5. implement fixes for problems I found and noted in discord channel



Rust numerics
Less copying (cloning) with rust (due to the type conversions)
Better naming for WASM methods, as there will be lots of them(!)


LineSegment to class?

Change many of the scaled eps things: E.g. when taking the closest point we just dont want to run into floating point problems

To learn with RUST:
when to copy and when not to
when to wrap types
...


Do next:
- strict offset
- remove crossings from polyline/gon

Learn git, lazygit
- merging


Fix 1D embroidery line not rendering

Graph.remove_crossings (should also work when a point is on another pt; should also automaticall identify points)
- should insert points as crossings

https://dl.acm.org/doi/fullHtml/10.1145/3394105
https://github.com/jianweiguo/IPML2d

The buffer thing -> automaticall create satin between two lines.


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

Tilings (with L-Systems? PixelArt?)
Pixelart
Method for auto merging paths/shapes/autopathing
Method to confine run within shape
Take grading of thread into account when trying to calculate hue/etc of image
Voroni diagrams
Symmetric mandalas
Flocking and life simulations
Algorithmic...
- botany (biology)
- ...




Use pixelart algo to first figure out where lines should roughtly go and then have a smooth_out functoin based on the iamge

https://giventofly.github.io/pixelit/#examples

For dst: Allow different lines ber stitch path, but joined together by point 
doublerun and many other custom run types can/should be a custom fucntion to apply to a polyline
A funtion to confine a polyline/gon to our outside of a space

Pearlin noise or fractal noise and then height lines

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
