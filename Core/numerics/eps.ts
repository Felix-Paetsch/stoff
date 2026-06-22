import { CONF } from "@/Core/config";

export const EPS = {
    tiny: CONF.core_approximately_zero,
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
    less_than_or_eq: (a: number, b: number): boolean => {
        return a - b < EPS.tiny;
    },
    greater_than_or_eq: (a: number, b: number): boolean => {
        return a - b > -EPS.tiny;
    },
};
