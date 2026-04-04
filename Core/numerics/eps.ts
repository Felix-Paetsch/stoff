export const EPS = {
    equals: (a: number, b: number): boolean => {
        return Math.abs(a - b) < EPS.tiny;
    },
    is_zero: (a: number): boolean => {
        return EPS.equals(a, 0);
    },
    tiny: 0.0000001,
};
