Marker Points which are supposed to be on top each other
- indication of rotation
    - assign via degree/vector
Beschriftung von Teilen
- Punkten, ...
- Flächen (connected Flächen)

A sewing instruction is basically a thing which gets overlayed on the pattern, maybe together with some text. And maybe there is just text.

Connect different parts of one sewing with dots, maybe across sketches

=> More annotation based annotations with later serialization
=> Good types

Todo: Get rid of pattern system..


#### Todo

- Test ideas out for anleitung
- look at other people
- do it on paper

#### Random

- Längenmaß

#### Modell-Fragen

> Wie sage ich beim zusammennähen, in welche Richtung gefloppt werden soll

> Temporal identification?

# types

```ts
    type SketchAnnotation = Sketch;
    type InstructionPattern = {
pattern: Sketch[],
instructions: Map(Sketch, SketchAnnotation)[]
}

type InstructionPattern = {
pattern: Sketch[],
instructions: {
text: PatternInstructionText,
annotations?: Map(SKetch, SketchaAnnotation)
}[]
}

type PointInstructionAnnotation = {
name?: string,
orientation?: radiants (but serable with vector)
set_orientatoin(angle, Vector)
}

type LineInstructionAnnotation = {
name?: string,
type?: Fold|Cut|Sew|Highlight
}

stamp(sketch(?), line, faces[], include/exclude)
Shadow.stamp()
stamp_external()?
=> We can do API later

// The type with point annotations
type PointInstructions = {
bla: bla
}

push_down(Point, PointInstructions){}
// Gives you
point.data["pointInstructions.name"] = instruction.name

type Shadow extends Sketch?

```

Stamp should be available for usual things and not limited to shadows but probably favoured

Polyline Methods <-> Line

