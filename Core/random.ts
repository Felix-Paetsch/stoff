import { Interval } from "@/Core";

function sfc32(uint128Hex: string) {
    let a = parseInt(uint128Hex.substring(0, 8), 16);
    let b = parseInt(uint128Hex.substring(8, 16), 16);
    let c = parseInt(uint128Hex.substring(16, 24), 16);
    let d = parseInt(uint128Hex.substring(24, 32), 16);

    return {
        generate: function () {
            a |= 0;
            b |= 0;
            c |= 0;
            d |= 0;
            const t = (((a + b) | 0) + d) | 0;
            d = (d + 1) | 0;
            a = b ^ (b >>> 9);
            b = (c + (c << 3)) | 0;
            c = (c << 21) | (c >>> 11);
            c = (c + t) | 0;
            return (t >>> 0) / 4294967296;
        },
        uint128Hex: function () {
            return (
                (a >>> 0).toString(16).padStart(8, "0") +
                (b >>> 0).toString(16).padStart(8, "0") +
                (c >>> 0).toString(16).padStart(8, "0") +
                (d >>> 0).toString(16).padStart(8, "0")
            );
        },
    };
}

export class Random {
    readonly seed: string;

    private useA: boolean;
    private randomGeneratorA: ReturnType<typeof sfc32>;
    private randomGeneratorB: ReturnType<typeof sfc32>;

    constructor(seed?: string) {
        if (!seed) {
            seed = Random.hash();
        }

        this.seed = seed;

        this.useA = true;
        this.randomGeneratorA = sfc32(seed.substring(2, 34));
        this.randomGeneratorB = sfc32(seed.substring(34, 66));
    }

    current_seed(): string {
        return (
            "0x" +
            this.randomGeneratorA.uint128Hex() +
            this.randomGeneratorB.uint128Hex()
        );
    }

    random() {
        const r = this.useA
            ? this.randomGeneratorA.generate()
            : this.randomGeneratorB.generate();
        this.useA = !this.useA;
        return r;
    }

    static random() {
        return Math.random();
    }

    choice<T extends any[]>(list: T): T[number] {
        return list[Math.floor(this.random() * list.length)];
    }

    static choice<T extends any[]>(list: T): T[number] {
        return list[Math.floor(this.random() * list.length)];
    }

    weighted_choice(where: number[]): number {
        return weighted_choice.bind(this)(where);
    }

    static weighted_choice(where: number[]): number {
        return weighted_choice.bind(this)(where);
    }

    hash(): string {
        let hash = "0x";
        for (let i = 0; i < 64; i++)
            hash += Math.floor(this.random() * 16).toString(16);
        return hash;
    }

    static hash(): string {
        let hash = "0x";
        for (let i = 0; i < 64; i++)
            hash += Math.floor(this.random() * 16).toString(16);
        return hash;
    }

    uuid(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (this.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    static uuid(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (this.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}

function weighted_choice(
    this: {
        random: () => number;
    },
    where: number[],
): number {
    let tLen = 0;
    for (let i = 0; i < where.length; i++) {
        if (where[i]! > 0) {
            tLen += where[i]!;
        }
    }
    if (tLen == 0) return -1;

    for (let i = 0; i < where.length; i++) {
        if (where[i]! > 0) {
            tLen += where[i]!;
        }
    }

    let rand = Interval.remap([0, 1], [0, tLen])(this.random());

    for (let i = 0; i < where.length; i++) {
        const wi = where[i]!;
        if (wi > 0) {
            tLen -= wi!;
            rand -= wi!;
            if (rand < 0) {
                return i;
            }
        }
    }

    return where.length - 1;
}
