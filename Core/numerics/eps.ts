export const EPS = {
    tiny: 0.0000001,
    equals: (a: number, b: number): boolean => {
        return Math.abs(a - b) < EPS.tiny;
    },
    is_zero: (a: number): boolean => {
        return EPS.equals(a, 0);
    },
    less_than: (a: number, b: number): boolean => {
        return a - b < EPS.tiny;
    },
    greater_than: (a: number, b: number): boolean => {
        return a - b > -EPS.tiny;
    },
};
