# Plan


## Goal

Mandelbrot embrpodery

## Steps

2. Mandelbrot Grid
3. Display (mandelbrot) grid in browser somehow as image
3. make linter happy

4. Generate Mandelbrot height lines
5. Generate Embroidery
    - several interpolation methods
6. There should be a config whether expect methods are run
8. TS Wasm grid methods
9. External Is grid..

## Dep resolution

TS type utils, Grid internal type (similar to graph) => Grid lerp things

### Type updates

- if A satisfies B then C else D
- unreadonly const
- deep readonly
- shallow readonly


# Updates

- Grid Update
- Type (restriction) update
    - unsafe accessorts, maybe with unsafe prefix
    - (or with by_ref prefix, currently liking this one)
- Performance Update
- Image Update
    - Graph Algorithms
    - Grid Processing
- SVG Update
    + Filled shapes
    + read in data from svg
- Leonie refactoring update
- Algorithms refactoring update
- NVIM "Update"
- Expect update
    - more expect.lazy
    - more expect utilities

# Organize

- dev scenes
- stand alone

# Core

So many collection_methods.get() things.. (Why still "get_"?)
Better names e.g. for ts side of rust wasm
LineSegment to class?
(Scaled) EPS problems
SVG face with gradient
Optimizations (including caching)
SVG rendering optimization (e.g. reducing sample points of line)
Performance measurements
Rendering circles should be padding invariant
Introduce readonly in return results/inputs
- Introduce Type utils
SVG parsing, getting lines from an svg

## Dev

Render Output as video
More Validations?
Speed / debug utilties
- debug dev run with optional arguments for tracking

## Questions


## Answers

Do we want .lines or .lines()?
=> The latter! We don't care about a bit of verbosity when we can get safety and/or readability and clarity of intent
... readonly?

# Rust

- tests
- import structure
- less copy/clone
- learn more abt rust design patterns

# Algorithms


## To Implement

Graph.remove_crossings (should also work when a point is on another pt; should also automaticall identify points)
Space colonization
Voroni
Traveling salesman
Shape packing (for putting onto fabric)
Radial distance functions
Following flow fields
- Angular binary search with a score fn?
Chaikin
https://ko-fi.com/s/bab05e779e
Confine run within shape, i.e. to a (kind of?) shape interesection
Different noises (blue/... for dot spacing or as a texture)
grid map, min
follow flow
- gradient flow
- isoline flow cw/ccw
Diffusion limited aggregation
gauss kernel
- blue
- edge detection
locally zoom shape / transform
Chainging where shape endpoints are
- arc length parameterized adding offset
- interpolate shapes with endpoints at pos a and pos b (which could just be the same as above)
- pick interior point of a line and then clockwise go around it and based on the current angle add faction of endpoint offset
- pick start point and while traversing shape arcwise offset with distance to a geometry
    - a) easily computable distance (point, line)
    - b) use a flowfield and for each point move along that flow field
    - c) so a flow field interface or smth
Img to grid
plot grid as svg

## Maybe eventually implement / Impl unclear

Percolation
Point clustering
Self avoiding walks
Finite subdivision
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

automaticall create satin between two lines
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
Where to put grid?
How to best do git (i.e. learn it)

# Debug / Testing / Unsure

- resampling (3 types)
    - make sure it is not tooo sloooow
- intersection points
- cut/glue/unfold to A4 printable

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

# Potential perfomance

- less copying
- more caching
- less transfer from/to rust
- more f64 array, esp. when we do most things in rust

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
