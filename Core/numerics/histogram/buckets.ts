import { Expect } from "@/Core/expect";
import { Histogram } from "./histogram";

export class HistogramBucketCollection {
    constructor(public buckets: number[][]) {
        Expect.that(buckets.length > 0 && buckets.every((b) => b.length > 0));
    }

    bucket_count(): number {
        return this.buckets.length;
    }

    histogram(): Histogram {
        return new Histogram(this.buckets.flat());
    }
}
