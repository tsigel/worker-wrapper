import { curry } from './curry';


export * from './curry';
export * from './pipe';

export const equal = curry(<T>(a: T, b: T) => a === b);
export const not = (data: any) => !data;
export const last = <T>(list: Array<T>) => list[list.length - 1];
