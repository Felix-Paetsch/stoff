import { Expect } from "@/Core/expect";

export type Freeable = { free: () => void };
const allocations_counter: Record<string, number> = {};

export function assert_zero_allocations() {
    let exists_faulty_alloc = false;
    Object.keys(allocations_counter).forEach((key) => {
        if (allocations_counter[key]! > 0) {
            exists_faulty_alloc = true;
            console.log(
                "Remaining allocations:",
                key,
                allocations_counter[key],
            );
        }
    });

    Expect.that(!exists_faulty_alloc);
}

export function allocations(): Record<string, number> {
    return allocations_counter;
}

// ===== Meat

export function allocate<T extends Freeable>(r: T): T {
    add_allocation(r);
    return r;
}

export function free<T extends Freeable>(r: T) {
    remove_allocation(r);
    r.free();
}

export function free_after_use<T extends Freeable, W>(r: T, f: (r: T) => W): W {
    const res = f(r);
    free(r);
    return res;
}

export function consume<T extends Freeable, W>(r: T, f: (r: T) => W): W {
    const res = f(r);
    remove_allocation(r);
    return res;
}

export function convert<T extends Freeable, W extends Freeable>(
    r: T,
    f: (r: T) => W,
): W {
    const res = f(r);
    remove_allocation(r);
    add_allocation(res);
    return res;
}

// ===== Helper

function add_allocation(o: object) {
    const what = classname(o);
    if (what in allocations_counter) {
        allocations_counter[what]! += 1;
    } else {
        allocations_counter[what] = 1;
    }
}

function remove_allocation(o: object) {
    const what = classname(o);

    if (!(what in allocations_counter)) {
        Expect.invalid_path("Dealloc before alloc");
    } else {
        allocations_counter[what]! -= 1;
        Expect.that(
            allocations_counter[what]! >= 0,
            "More deallocs than allocs",
        );
    }
}

function classname(o: object): string {
    return o.constructor.name;
}
