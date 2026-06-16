Improve speed of closest by having less allocations (e.g. the result option)
Do merge optimization on run without intersections

1. Implement unionfind
4. Merge lines efficiently

5. Improve polygon merging

# Todo

When merging polygons, try to directly write to the correct position in one array without creating many more.
Vec.clear

For mergin many short lines on a graph: minimum spanning tree, involving delaunay with predefined vertices

Histogram & Histogram equalization
Gauss derivative kernel
dx, dy kernel
combine dx,dy and so on to get a rather good grad estiamtion
Bilatiral filtering
Unsharp masking
Fourier
Lowpass/Highpass filter
Frie Chen operator
...

3. Convolution in rust
4. Add wasm support


Why is this one offset soo bad in the sewing thing??
Hovering both SVG and PNG: Cursor/Pixel position

Scenes should only have imports from barrel files inside of Core..
Bound size on polylines

Use Einstein image as resplacement mask
Merge lines:
- minimizing maximal connecting line



- better lines match up. The objective is rather: Minimise the longest line segment length (kinda like tsp)

0. Image stuff type stuff

1. Test if everythings works now
2. Implement that image things 
    - imcluding wasm things on both sides
3. Improve / Test grid API, especially in @ exports
4. Directional/Tensor Eikonal
5. Improve API... probably get rid of main barrel export
6. Find if clahe needs fixing

SketchRendering with better/different allowed default attributes

ImgAlgorithms
Image -> Image writer
Core/image
img resample

Avg brightness
Median brightness
"importance map for colors"
Histograms

## Steps

1. Generate a rough outline estimate by points
2. Do a concave hull


5. Generate Embroidery
    - several interpolation methods
6. There should be a config whether expect methods are run
8. TS Wasm grid methods

# Updates

- Cache update
    - cache grid/shape/putable/... between program runs Cache.cache(name, id, computation);
    - Cache.sequential_cache()
    - ...
- Stoff update
    - instructions, etc
- Social media update
    - recordings, etc
- Embr files Production Update
    - export to pdf and many other things
- Viewer Update
    - faster
    - different platform?
    - more readable..
    - dont allow to large embroidery/... files
    - for an out/put file also a meta data file, even if it is an image, etc (ofc optional is the dir is corruped somehow or smth)
- Video Update
    - Social media
    - (group with embroidery lines)
    - Finding the correct parameter for a proc method
- Config update
- Type (restriction) update
    - unsafe accessorts, maybe with unsafe prefix
    - (or with by_ref prefix, currently liking this one)
- Image alpha update
- SVG Update
    + Filled shapes
    + read in data from svg
- Leonie refactoring update
- Algorithms refactoring update
- NVIM "Update"
- TraditionalEmbroidery update
    - Different fills (export also for leonie)
    - Some pathing
    - Fonts
    - Satin
    - different embr path types
- Expect update
    - more expect.lazy
    - more expect utilities

### Performance update

- time a method
- see the results somewhere collected while it happens - writing to a file prolly
- time_after/optionally on a conditional
    or: queries for time
   

# Organize

- dev scenes
- stand alone

# Core

Namespaces should (could) be grouped early so I dont have to do import * as ...
More Namespaces

So many collection_methods.get() things.. (Why still "get_"?)
Length map better names
Integrate algorithms into Core. Check out curvature..
- two types of algorithms, those used internally and put onto thing as method and those exported
Put sketch and so on behind a "."?
Merge double running algorithm in rust
THings that take in x,y should take in vec? or Not?
Polyline proper components
- only when it is a vec indeed
Shape.Sample to Shape.Sample at?
Better names e.g. for ts side of rust wasm
LineSegment to class?
(Scaled) EPS problems
SVG face with gradient
Optimizations (including caching)
SVG rendering optimization (e.g. reducing sample points of line)
Performance measurements
Grid dimensions to lattice and vice versa
Split and reform index <-> array
Rendering circles should be padding invariant
Introduce readonly in return results/inputs
- Introduce Type utils
SVG parsing, getting lines from an svg
Rename Eikonal into FastMarching?
Resampling strict keeping sharp corners
## Dev

Render Output as video
More Validations?
Speed / debug utilties
- debug dev run with optional arguments for tracking

## Questions

What to do with algorithms?
It seems a bit abitrary that concave hull and so on are in Core and note algorithms
In place vs into?
- i guess in place what it has the same data type?
How to do views into rust memory / work with arrays mostly there?

Grid.Algorithms

## Answers

Do we want .lines or .lines()?
=> The latter! We don't care about a bit of verbosity when we can get safety and/or readability and clarity of intent
... readonly?

# Rust

- tests
- import structure
- less copy/clone
- learn more abt rust design patterns
https://www.youtube.com/watch?v=A-lbCqNT5Ew
# Algorithms


## To Implement

Graph.remove_crossings (should also work when a point is on another pt; should also automaticall identify points)
Space colonization
Voroni
Traveling salesman
resample_strict should also have an angle argument.
Shape packing (for putting onto fabric)
Add vertex to shape in the easiest way (the base shape if it had to go through this vertex)
Boolean grid clusters
Boolean grid
- and /or
More keys for lerp: Nearest neighbor
- Tensor & directional eikonal (for tensor matrices)
Radial distance functions
Following flow fields
- Angular binary search with a score fn?
Svg to image
Chaikin
https://ko-fi.com/s/bab05e779e
Confine run within shape, i.e. to a (kind of?) shape interesection
Different noises (blue/... for dot spacing or as a texture)
resample strict use sharp corners
grid max, min / optimize
follow flow
- gradient flow
- isoline flow cw/ccw
Diffusion limited aggregation
flow lines
smooth out using a circle (i.e. take average of whole points inside circle instead of fixed length to average more in places with many zigzagzigsharp things)
- can also be used i.g. for things like "just fill more here"
locally zoom shape / transform
Chainging where shape endpoints are
- arc length parameterized adding offset
- interpolate shapes with endpoints at pos a and pos b (which could just be the same as above)
- pick interior point of a line and then clockwise go around it and based on the current angle add faction of endpoint offset
- pixlane media
- pick start point and while traversing shape arcwise offset with distance to a geometry
    - a) easily computable distance (point, line)
    - b) use a flowfield and for each point move along that flow field
    - c) so a flow field interface or smth
Img to grid
plot grid as svg
Write tests (extensive tests) for AI based algorithms with public interface
Resampling based on detail for embroidery (like keep corners but resample more liberally on straight parts)

## Maybe eventually implement / Impl unclear

Percolation
Different Convolution / windowing mechanisms
- wrap / extend / ...
Method to make something "more Cinfinity" like smoothing that keeps a circle at a circle
Point clustering (k-means)
Path alining
Reaction diffusion to get fill line (https://www.reddit.com/r/PlotterArt/comments/1u245af/comment/oqvafa5/?context=3)
Get more out of fast marching
Differential growth (to fill shape)
Center line trace
Linieninterferrenz
- smooth out
- then superempose the path and a local zig zag pattern tailored to vector field
Self avoiding walks
Local extreme for closest points
Finite subdivision
Outlier stripping: Efficiently get rid of longers line in polyline..
Single axis closest line
Shape.simplify() .into_simplified() .reverse_in_place()
Fractal flames
Pixelart + Pathing
Embroidery pathing analysis
Embroidery post processing
Face map
API for N-gons?
Tilints (with L-Systems? Pixel art and L-Systems?)
Pixelart tools (e.g. create from image)
Autopatching, Shape/Path merging
Mandalas (constructions mod symmetry)
Flocking
Street maps
Stippling algorithms
Autopath sketch as dst with different colors
conrec
dual conturing
spline fitting

# Embroidery


## Features

automatically create satin between two lines
different fill and run types
stitch density/line density analyzation
pull compensation
Tuck down and end stitch
Contour fill
Maze fill
Stem stitch
ZMK-like embroidery analysis
Thread grading (direction) for digitizing..

## Todo

Fix 1D embroidery line not rendering
Colors between sketch <-> embroidery conversions

# Sewing

Clean up/review Leonies code (from time to time)
Annotation System?
Validity checks
3D anything


# Generative Random Input

https://m.youtube.com/watch?v=Ho3xr4b60Zg
https://github.com/beardicus/awesome-plotters
https://giventofly.github.io/pixelit/#examples

# Questions

What to do with /Algorithms?
How to best do git (i.e. learn it)

# Debug / Testing / Unsure

- resampling (3 types)
    - make sure it is not tooo sloooow
- intersection points
- cut/glue/unfold to A4 printable
- KUMIKU Pattern
    https://www.reddit.com/r/PlotterArt/comments/1h9jjpm/another_kumiko_pattern/

https://pixlane.media/dev-tools/

# Neovim

Currently two seperate reformatter on ts causing chaos
[] tab should only do tab things when in insert mode; also select multiple lines at once and pressing tab
[] sometimes when saving with ts it autoformats and it messed up big time (mostly) imports, sometimes fn defn (?)

# Research

https://dl.acm.org/doi/fullHtml/10.1145/3394105
https://github.com/jianweiguo/IPML2d

# Inspiration

https://adamfuhrer.bigcartel.com/?page=1
https://adamfuhrer.com/selling-physical-art-online
https://www.reddit.com/r/Machine_Embroidery/comments/1t30y06/recent_bag_tags_ive_made/
https://retro.moe/posts/embroidery-outrun/
http://n-e-r-v-o-u-s.com/kinematicsCloth/ 

# Potential perfomance

- less copying
    - from, to rust; e.g. by simplifying polygons first (at least rust -> js)
- more caching
- less transfer from/to rust
- chaching lengths to vec along shape
- more f64 array, esp. when we do most things in rust
- view into rust memory for shapes
- less copying, creation, more by reference
    - also for shape.lines()
- early abbort nearest positions when we find intersections
- use b-trees for nearest positions, shape intersections
- try brute force method on ends of recursions
- subpolyline / readonly polyline
- technically closest shapeshape could be made faster by halfing both shapes in the main recursion step like with intersections
- evt. to deep recursions can lead to overflow
- less recursion in hot paths

# Unstructured


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

Iterate over all possible lines (e.g. squares, diagonal lines) and test whether to incldue them
More tilings, fill_inside_polygon/shape with tiling


Connecting many short lines and then connecting them
- potentially after edge detection algorihtm
- potentially with thresholding, fast marching

https://staff.fnwi.uva.nl/r.vandenboomgaard/IPCV20172018/LectureNotes/index.html


Idea for reducing amt of long segments / TSP improvements:

Alternating circle such that max_len(on line) - max_len(off line) >> 0 (or so, roughtly)
- also interesting for TSP
- but slightly different objective than TSP

Minimum weight perfect matching
https://www.math.uwaterloo.ca/~bico/papers/match_ijoc.pdf

==== Match polylines to polygon:

Heuristics:
- nearest neightbor
- nearest fragment
- bitonic tour
- match twice and stitch
- multifragment
- min weight part matching
- mst
- k opt method
- v opt method


Utility to see how ofter a path moves over a certain area
"TSP optimization" method for paths where we run the optimization loop to get rid of long edges, poentially somewhere resampling before
Look at auto digitizing (inkl ember)

Spirographs

https://ezstitchdigitizing.com/free-online-jef-file-viewer/
