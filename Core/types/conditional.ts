import { And } from "./booleans";

export type IfThen<If extends boolean, Then> = IfThenElse<If, Then, never>;
export type IfThenElse<If extends boolean, Then, Else> = If extends true
    ? Then
    : Else;
export type WeakIfThenElse<If extends boolean, Then, Else> = If extends true
    ? If extends false
        ? Then | Else
        : Then
    : Else;

export type Extends<A, B> = A extends B ? true : false;
export type Is<A, B> = And<Extends<A, B>, Extends<B, A>>;

type SingletonArrayInner<T> = T extends [infer U] ? U : never;
type NonSingletonArrayMembers<T> = T extends [any] ? never : T;
export type IsUnionMember<X, Union> = [X] extends [
    NonSingletonArrayMembers<Union> | SingletonArrayInner<Union>,
]
    ? true
    : false;

export type BaseAndIfThenAlso<
    Base,
    If extends boolean,
    Additional,
> = IfThenElse<If, Base | Additional, Base>;
