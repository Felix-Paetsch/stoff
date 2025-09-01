import { Json } from "@/Core/utils/json";
import { v4 as uuidv4 } from 'uuid';

type Dependency = string;
type DependencyMap = Map<Dependency, Dependency[]>;

export default class Cache {
    private lazyValueCache = new Map<string, any>();
    private dependency_map: DependencyMap = new Map();

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

    private computed_values: {
        readonly computes: string;
        readonly dependencies: Dependency[];
        readonly func: () => any;
        computed: boolean;
        value: any;
    }[] = [];

    compute_dependent<T>(computes: string, dependencies: Dependency[], func: () => T): T {
        let entry = this.computed_values.find(
            e => e.computes === computes
        );
        if (!entry) {
            entry = {
                computes,
                dependencies,
                func,
                computed: false,
                value: undefined
            };
            this.computed_values.push(entry);
        }

        if (entry.computed) {
            return entry.value;
        }
        entry.computed = true;
        const value = func();
        entry.value = value;
        this.dependency_changed(computes);
        return value;
    }

    fake_compute_dependent<T>(_computes: string, _on: string[], func: () => T): T {
        return func();
    }

    dependency_changed(...which: string[]) {
        for (const key of which) {
            this.computed_values.filter(
                e => e.dependencies.some(d => d === key)
            ).forEach(e => {
                e.computed = false;
            });
            const dep = this.dependency_map.get(key);
            if (typeof dep === "undefined") return;
            this.dependency_changed(...dep);
        }
    }

    new_dependency(key: string, dependants?: string[]) {
        this.dependency_map.set(key, dependants || []);
    }
}
