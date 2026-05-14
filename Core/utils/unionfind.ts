export class UnionFind {
    private parent: number[];
    private rank: number[];

    constructor(size: number) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = new Array(size).fill(0);
    }

    find(x: number): number {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]!);
        }
        return this.parent[x]!;
    }

    union(a: number, b: number): boolean {
        let ra = this.find(a);
        let rb = this.find(b);

        if (ra === rb) return false;

        const rankA = this.rank[ra]!;
        const rankB = this.rank[rb]!;

        if (rankA < rankB) {
            this.parent[ra] = rb;
        } else if (rankA > rankB) {
            this.parent[rb] = ra;
        } else {
            this.parent[rb] = ra;
            this.rank[ra]!++;
        }

        return true;
    }
}
