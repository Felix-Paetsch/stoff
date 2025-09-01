import { Json } from "@/Core/utils/json";
import { RenderContext } from "./index";
import Cache from "@/Core/utils/cache";

export default class RendererCache extends Cache {
    serialize_context(ctx: RenderContext): Json {
        return {
            width: ctx.width,
            height: ctx.height,
            padding: ctx.padding,
        }
    }
}
