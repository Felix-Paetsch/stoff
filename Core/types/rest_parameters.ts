export type AsRestParameter<T> = undefined extends T ? [] | [T] : [T];
