import { Expect } from "@/Core/expect";
import { HistogramBucketCollection } from "./buckets";
import { normal_distribution_histogram } from "./normal_distribution";

export class Histogram {
    constructor(public data: number[]) {
        Expect.that(data.length > 0);
        this.data.sort((a, b) => a - b);
    }

    add_data(data: number[]) {
        Expect.that(data.length > 0);

        this.data = this.data.concat(data);
        this.data.sort((a, b) => a - b);
    }

    median(): number {
        const middle = Math.floor(this.data.length / 2);

        if (this.data.length % 2 === 0) {
            return (this.data[middle - 1]! + this.data[middle]!) / 2;
        }

        return this.data[middle]!;
    }

    average(): number {
        return (
            this.data.reduce((sum, value) => sum + value, 0) / this.data.length
        );
    }

    percentile(n: number): number {
        Expect.that(n >= 0 && n <= 100);

        const index = (n / 100) * (this.data.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);

        if (lower === upper) {
            return this.data[lower]!;
        }

        const fraction = index - lower;

        return (
            this.data[lower]! +
            (this.data[upper]! - this.data[lower]!) * fraction
        );
    }

    variance(): number {
        const mean = this.average();

        return (
            this.data.reduce((sum, value) => {
                const difference = value - mean;
                return sum + difference * difference;
            }, 0) / this.data.length
        );
    }

    min(): number {
        return this.data[0]!;
    }

    max(): number {
        return this.data[this.data.length - 1]!;
    }

    percentile_of_number(n: number): number {
        const length = this.data.length;

        if (n < this.data[0]!) {
            return 0;
        }

        if (n > this.data[length - 1]!) {
            return 100;
        }

        let upper = 0;

        while (upper < length && this.data[upper]! < n) {
            upper++;
        }

        if (upper === 0) {
            return 0;
        }

        if (upper === length) {
            return 100;
        }

        const left = this.data[upper - 1]!;
        const right = this.data[upper]!;
        const leftPercentile = ((upper - 1) / (length - 1)) * 100;
        const rightPercentile = (upper / (length - 1)) * 100;

        if (right === left) {
            return rightPercentile;
        }

        const fraction = (n - left) / (right - left);

        return leftPercentile + (rightPercentile - leftPercentile) * fraction;
    }

    map(f: (a: number) => number): Histogram {
        return new Histogram(this.data.map(f));
    }

    print() {
        const data = [
            ["min", this.min()],
            ["p10", this.percentile(10)],
            ["p20", this.percentile(20)],
            ["average", this.average()],
            ["p80", this.percentile(80)],
            ["p90", this.percentile(90)],
            ["max", this.max()],
            ["median", this.median()],
        ] as const;

        for (let i = 0; i < data.length; i++) {
            console.log((data[i]![0] + ":").padEnd(11) + data[i]![1]);
        }
    }

    static normal_distribution(
        avg: number = 0,
        variance: number = 1,
        samples: number = 100,
    ) {
        return normal_distribution_histogram(avg, variance, samples);
    }

    gap_histogram(): Histogram {
        Expect.that(this.data.length > 1);

        const data: number[] = [];

        for (let i = 0; i < this.data.length - 1; i++) {
            data.push(this.data[i + 1]! - this.data[i]!);
        }

        return new Histogram(data);
    }

    buckets(bucket_number: number): HistogramBucketCollection {
        Expect.that(Number.isInteger(bucket_number));
        Expect.that(bucket_number > 0);
        Expect.that(bucket_number <= this.data.length);

        if (bucket_number === 1) {
            return new HistogramBucketCollection([this.data]);
        }

        const gaps = this.data
            .slice(0, -1)
            .map((value, index) => ({
                index,
                gap: this.data[index + 1]! - value,
            }))
            .sort((a, b) => {
                if (b.gap !== a.gap) {
                    return b.gap - a.gap;
                }

                return a.index - b.index;
            });

        const splitAfter = new Set(
            gaps.slice(0, bucket_number - 1).map((entry) => entry.index),
        );

        const buckets: number[][] = [];
        let start = 0;

        for (let i = 0; i < this.data.length - 1; i++) {
            if (splitAfter.has(i)) {
                buckets.push(this.data.slice(start, i + 1));
                start = i + 1;
            }
        }

        buckets.push(this.data.slice(start));

        return new HistogramBucketCollection(buckets);
    }

    buckets_with_spacer(bucket_spacer: number): HistogramBucketCollection {
        Expect.that(Number.isFinite(bucket_spacer));
        Expect.that(bucket_spacer >= 0);

        const buckets: number[][] = [];
        let start = 0;

        for (let i = 0; i < this.data.length - 1; i++) {
            const gap = this.data[i + 1]! - this.data[i]!;

            if (gap >= bucket_spacer) {
                buckets.push(this.data.slice(start, i + 1));
                start = i + 1;
            }
        }

        buckets.push(this.data.slice(start));

        return new HistogramBucketCollection(buckets);
    }

    buckets_by_size(bucket_size: number): HistogramBucketCollection {
        Expect.that(Number.isInteger(bucket_size));
        Expect.that(bucket_size > 0);

        const buckets: number[][] = [];

        for (let start = 0; start < this.data.length; start += bucket_size) {
            buckets.push(this.data.slice(start, start + bucket_size));
        }

        return new HistogramBucketCollection(buckets);
    }
}
