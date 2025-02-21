# Todo

## Docs
Where / how?
A lot to write down..

## Website
#### Sewing Sketch API
- Which settings are allowed? / How does setting navigation work??
- Building tutorials
- Post Processing

#### Build actual website
- Design

## Dev env
- Make logs work on dev website
- Allow several recordings / things at the same url, seperated by hr or alike. Iframes?

## StoffLib
- Make things faster long, long term
    - Float64Array of (x,y) instead of []Vector
- Add relevant asserts
[methods]
- Arange sketches/connected components compactly (for printing)
- Smooth corner out (evt. around point when merging)
    - "Make C \infty"
- Merge several lines at ones
- merge at point
- (completely) split at a point on the line
    - or at a point in general
- call methods on points directly to get bool
- intersect lines with rays/geometry.lines
[debug]
- allow for videos and hot at url and so on multiple instances (via timestamp instead of live)
[bigger_projects]
- ID / reference system (see proposal)
- Which methods should be recorded and which not? (& how to set that)

## PatternLib
- Sewing Sketch Updates
    - Cutting along several lines..
        w/wo fixed point (maybe a new method)
    - Throw errors correctly in typed methdos
- QoL features on stages
    - See where we currently are
    - Call history
    - Error dict
    - Good Asserts
- Higher Level Validation
    - Wenn ein einfacher Abnaeher einen bestimmten Winkel überschreitet, sollte eine Warung ausgegeben
    - Gewisse zu spezifizierende Linien am Schnittmuster sollen bestimmte Länge haben
- More default stages:
    - Sequential stage
    - push stages

[methods(ish)]
- adding stages
    - customly from another stage
    - at a specific - somehow specified - position, not just the end
- callback:
    - do this thing ones that method is exposed

## Other
- Make things work stand-alone w/o (or minimal) foreign exports
- MVP website: People don't get overwritten in data
- Directory aufräumen, sobald Entscheidungen getroffen

## Other Other
Redo Docs..