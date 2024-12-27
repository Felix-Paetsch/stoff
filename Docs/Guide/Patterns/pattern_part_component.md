# Pattern Part vs Pattern Component
{ guide, PatternPart, PatternComponent, patterns }

In ./Patterns/core you find the followind classes relating to parts of a pattern:

- PatternPart
- PatternComponent (extends PatternPart)
- Pattern (extends PatternComponent)

They have the following idea behind them:

## Pattern

A whole pattern. An instance of it represents something like a specific dress, shirt or sock.
The aim is that when we are ready for production these pattern classes will also tell you which attributes and their ranges and conditions on each other exist and how they are related; so they will interface with the production website. 

## PatternComponent

A pattern component is a "full part" of a pattern. Usually one connected component,
maybe with some extra lines. Can also consist of several connected components. Maybe something like a Pocket of sleeve.
The idea is that it makes sense to render this thing on it's own. Ideally all components will have methods to render them to a sketch with the only constrained being correct input data.

## PatternPart

Anything smaller than a component. Examples are the armpit part of a pattern or the neckline. "Nice" parts can be constructed from just 2 (or more) points given. Other parts maybe require the existence of some lines with certain types.