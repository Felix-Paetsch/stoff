# Introduction

The StoffLib folder is the crux of the pattern creation toolbox. It can be used as a stand alone thing. While developing your pattern you might find use in the DevServer to see live your current pattern and associated data in the browser.

## The main building blocks

The main object you will be working with is a [`Sketch`](#). It holds data for the lines and points and has many functionalities for modifying them. If you know SVGs, the sketch object can be seen as a really advanced and specialized svg builder.

A [`Point`](#) is just what you think it is. It mainly has a position and lines which have it as endpoints.

Lastly a [`Line`](#) is something that connects two points with a path. For the sewing pattern a big part of the work is modifying these paths until they have the shape you like. A line internally consists of many small connected line segments, although usually you don't need to worry about that.

## DevServer

During development you sequentially build up the pattern from the ground. Adding points and lines and then reshaping them, repeat, until you are done. The DevServer helps you with two things:

- Get a live view of the current state of the pattern
- See how the pattern dynamically changes with different inputs (e.g. Measurements)

You can run it via `npm run dev` from the source directory. Afterwards you can go ahead and start your work in `/Patterns`. See [here](#) for how to export your pattern from that directory correctly.

## How to get started

To get started, copy the following code into `/Patterns/export_pattern` and run `npm run dev`:

```js
import { Sketch } from '../StoffLib/sketch.js';
import { Config } from "../StoffLib/Config/exports.js";

export default {
    design_config: new Config(),
    create_design: (design_config) => {
      const s = new Sketch();
      const p1 = s.point(0,0);
      const p2 = s.point(0,2);
      s.line_between_points(p1,p2);
      return s;
    }
}
```

To find out more what this does you can go [here.](#) To see whether this works, go to the URL displayed in your console. Afterwards you can start looking at [more sketch methods](#) and find your way from there.