export const pipe: IPipe =
    (...processors: Array<Function>) =>
        (initial: any) => processors.reduce((acc, cb) => cb(acc), initial);

export interface IPipe {
    <A, B>(cb1: (a: A) => B): (a: A) => B;

    <A, B, R>(cb1: (a: A) => B, cb2: (b: B) => R): (a: A) => R;

    <A, B, C, R>(cb1: (a: A) => B, cb2: (b: B) => C, cb3: (c: C) => R): (a: A) => R;

    <A, B, C, D, R>(cb1: (a: A) => B, cb2: (b: B) => C, cb3: (c: C) => D, cb4: (c: D) => R): (a: A) => R;

    <A, B, C, D, E, R>(cb1: (a: A) => B, cb2: (b: B) => C, cb3: (c: C) => D, cb4: (c: D) => E, cb5: (data: E) => R): (a: A) => R;

    <A, B, C, D, E, J, R>(cb1: (a: A) => B, cb2: (b: B) => C, cb3: (c: C) => D, cb4: (c: D) => E, cb5: (data: E) => J, cb6: (data: J) => R): (a: A) => R;
}
