import { Json } from "@/Core/utils/json";
import { v4 as uuidv4 } from 'uuid';
import { RenderContext } from "./index";

export default class RendererCache {
    private lazyValueCache = new Map<string, any>();

    lazy<Key extends Json, T>(descr: string, key: Key, func: () => T): T {
        const cacheKey = `${descr}:${JSON.stringify(key)}`;
        if (this.lazyValueCache.has(cacheKey)) {
            return this.lazyValueCache.get(cacheKey)!;
        }
        const ret = func();
        this.lazyValueCache.set(cacheKey, ret);
        return ret;
    }

    lazy_fun<Key extends Json, Args extends any[], T>(descr: string, fun: (...args: Args) => T) {
        return (key: Key, ...args: Args) => this.lazy(descr, key, () => fun(...args));
    }

    lazy_compute<Key extends Json, T>(descr: string) {
        return (key: Key, fun: () => {}) => this.lazy(descr, key, fun);
    }

    tag(obj: {}): string {
        if ((obj as any).__tag) return (obj as any).__tag;
        (obj as any).__tag = uuidv4();
        return (obj as any).__tag;
    }

    serialize_context(ctx: RenderContext): Json {
        return {
            width: ctx.width,
            height: ctx.height,
            padding: ctx.padding,
        }
    }
}
