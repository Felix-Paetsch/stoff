import { Json } from "@/Core/utils/json";
import { Cache } from "@/Core/utils/cache";
import { RenderContext } from "./renderer";

export class RendererCache extends Cache {
    serialize_context(ctx: RenderContext): Json {
        return {
            width: ctx.width,
            height: ctx.height,
            padding: ctx.padding,
        }
    }
}
