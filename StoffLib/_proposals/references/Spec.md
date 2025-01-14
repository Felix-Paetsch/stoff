# References

We want to be able to copy sketches (and points and lines) between different places and keep the correct attributes in data
(I.e. when we tell which lines to glue together)

Also currently we can only reference to points in the same sketch (makes sense i think; especially if we want to keep pointing at the copied points when copying sketches) but this wrapper reference could be helpfull to replace dreaded dragging everything with in data.

## Todo
Figure out, how it should behave when we set different things to be "the canonical new reference"
Orientate at Pseudocode

Note: in theory it is enough to envoke
new UID(el)
to apply an id to the el (or maybe: new Reference(el))
and everything works except the default copies

Basically how does the replace_original work in:

```js
    const stripes = sleeve_comp.component().cut_stripes(
        sleeve_comp.get_line("line_arm_curve"),
        sleeve_comp.get_line("line_wrist"),
        8
    );
    stripes.spread(sleeve_comp.get_line("line_wrist"), 5);
    const trace = stripes.trace_new_pattern();
    sleeve_comp.replace_original();
```