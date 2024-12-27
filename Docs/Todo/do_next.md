# Todo next in ./Patterns
{ todo, patterns }

### Todo, Concretely
The "easy things are":

- Get away from the `_depricated/**/lengthen.js` file
- Fix waistline stuff for single dart
- Refactor the other dart options

### Ramling (Todo, Abstractly)
We have to figure out how things should be structured. I like the current approach a bit, but it also need some work. But I think that should happen after we ported the other things to `Pattern`, `PatternComponent`, `SewingSketch` and so on.
With the things in `Patterns/core` I am quite happy and I think we will only add things to it and restructure it not tooo much. Although long term we might pull this out of the Patterns folder... doesn't matter rn

I am thinking how much we can unify the different current shirt patterns. Like adding zero/one/two darts chould maybe be done wiht a method "add_dart" (with a cap at 2  ~ for now?). I am imagining something like

```js
this.base_pattern()
this.dart("side")
this.dart("princess")
this.neckline("boat")
this.arm("modern")
```

feeling like a McDonals menu "I want this, this, this."

Also we maybe want to figure out how to handle the differences of ShirtSideHalf/ShirtHalf/Shirt, i.e. what do you even want to do with the Shirt class? Probably asymetrical things. But since this currently isn't planned.. also you should keep in ming that neckline() should also work for dresses or stuff.

### Long Term
We need to figure out how to make all Patterns feel similar. Like when we construct a pattern from SideHalfs thats great, but the resulting pattern (and pattern from the outside) should feel like other patterns as well. 
Also patterns should know about their possible settings and all the information for the website long term. >.<
Maybe the generate the config you currenty specify in export_pattern themselfes.
(Proviously my thought that each pattern had a folder with an "export pattern file" I would also be happy with that.
There you also would be able to compute the config stuff from your pattern instead of hardcoding it - if you didn't know)
This still feels like the aproach I would like the most? But also was mainly founded on my not interfering with your Patterns stuff.
