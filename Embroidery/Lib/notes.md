Lines have an order in which they are sewn in the attributes
And they have a color
=> Utilities to moving up and down


Chicken egg problem
Rendering <-> Attributes <-> Embroidery


type RenderArgs = {
    width: number,
    height: number,
    padding: number,
}
render_embroidery(e: Embroidery, args: RenderArgs): Buffer{}




X?.set_color(line, any)
X?.set_order(line, any)
X.sketch()
X?.render()

an embroidery could _hold_ a sketch
it could operate _only_ on shapes

(re)ordering lines is important


Embroidery.to_png()

// eventually maybe a "smart run" method, but could also build _on_top_ of this simple API

