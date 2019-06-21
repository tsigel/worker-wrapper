export const curry: ICurry = (func: (...args: Array<any>) => any) => {
    function loop(callback: (...args: Array<any>) => any, ...local: Array<any>) {
        if (callback.length <= local.length) {
            return callback(...local);
        } else {
            return (...args: Array<any>) => loop(func, ...local.concat(args));
        }
    }

    return (...args: Array<any>) => loop(func, ...args);
};

export interface ICurry {
    <A, R>(cb: (a: A) => R): ICurriedFunction1<A, R>;

    <A, B, R>(cb: (a: A, b: B) => R): ICurriedFunction2<A, B, R>;

    <A, B, C, R>(cb: (a: A, b: B, c: C) => R): ICurriedFunction3<A, B, C, R>;

    <A, B, C, D, R>(cb: (a: A, b: B, c: C, d: D) => R): ICurriedFunction4<A, B, C, D, R>;

    <A, B, C, D, E, R>(cb: (a: A, b: B, c: C, d: D, e: E) => R): ICurriedFunction5<A, B, C, D, E, R>;
}

export interface ICurriedFunction1<A, R> {
    (a: A): R
}

export interface ICurriedFunction2<A, B, R> {
    (param1: A): ICurriedFunction1<B, R>;

    (param1: A, param2: B): R;
}

export interface ICurriedFunction3<A, B, C, R> {
    (param1: A): ICurriedFunction2<B, C, R>

    (param1: A, param2: B): ICurriedFunction1<C, R>;

    (param1: A, param2: B, param3: C): R;
}

export interface ICurriedFunction4<A, B, C, D, R> {
    (param1: A): ICurriedFunction3<B, C, D, R>

    (param1: A, param2: B): ICurriedFunction2<C, D, R>

    (param1: A, param2: B, param3: C): ICurriedFunction1<D, R>;

    (param1: A, param2: B, param3: C, param4: D): R;
}

export interface ICurriedFunction5<A, B, C, D, E, R> {
    (param1: A): ICurriedFunction4<B, C, D, E, R>

    (param1: A): (param2: B) => ICurriedFunction3<C, D, E, R>;

    (param1: A, param2: B, param3: C): ICurriedFunction2<D, E, R>

    (param1: A, param2: B, param3: C, param4: D): ICurriedFunction1<E, R>;

    (param1: A, param2: B, param3: C, param4: D, param5: E): R;
}