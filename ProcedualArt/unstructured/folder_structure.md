# Folder structure (TS)

This project is seperated in different "chunks" at difference complexity levels:

## Base Chunks

Each **only** has **external dependencies + cfg and those lister after name**.

- Expect (None)
- Colors (None)
- Utils (None)
- Numerics (Expect)
- Geometry (Expect, Numerics)

The only connection numerics <-> geometry are:
- Interval
- Maybe Spline
and interval - idk whether i want it in numerics or geometry.. currently in numerics

## Dependent Chunks

Each chunk **only** has **external deps and deps to above + cfg.** Given the above things we present, we could make them into their own module:

- Graph
- Sketch
- Grid
- SVG
- Embroidery (+ DST)
- Image (+ ImageIO)

These chunks can have accompanying algorithms. If they have a common name and only need their own dependencies _or_ are usefull in general application of the sub-module, put them in the corresponding folders, eg:

- Graph: MST, TSP
- Grid: Marching Squares, Eikonal wave propagation
- Image: Contrast things
- Embroidery: Analysis Suite

## Advanced Chunks

Each chunk **only** has **external deps and deps above + cfg.** Given the above things present we could make them into a module (although probably not desired.)

- Adapters (Image <-> Grid, etc.)
- Rendering

# Advanced algorithms

Until we have more interesting advanced algorithms, they should go into:

- Leonies Folder
- A "generative" Folder in Stoff/Embroidery (see L-Systems)
- An "unstructured" folder
