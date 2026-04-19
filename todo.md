
# Next

1. Pressing play button at end should start playing
2. Playback speed modifier


# All

[] embroidery as png
    -> rather sketch embroidery as png(?)
    -> problem is DST doesnt have own colors...
    -> a class in embroidery for embroidery with colors?
    -> not sooo pressing rn
[] unify (looks of) things with the same name
[] Out render cjson embroidery
    - png?
    - progress slider
[] Out render dst(?)
    - clean up server?
- gen_lines?
[] writing dst should have center _in_the_center_

[] debug also handedness
[] better intergration embroidery <-> explorer?
    - maybe a Embroidery.out() method or smth

[] better color utilities (gradients) for rendering
[] Annotation System; maybe have DST annotations as a start

[] if needed: resample polylines for svg builder to lower threshhold
[] svg builder faces with gradients

[] optimization with caching length to each entry of polyine?
[] get rid of some dependencies

[] unify what angle mean
[] circles padding invariant
[] do we want lines or lines()??


### Reintroduce features

[] Caching
[] Faces
[] Render as video

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
