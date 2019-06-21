import { TAnyFunction } from './interface';

export function getFnName(fn: (...args: Array<any>) => any): string | null {
    const s = ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
    return (s && s[1] || null);
}

export const getUniqFunctionName = (() => {
    let count = 0;
    return () => `Unnamed_${count++}`;
})();

export function getFnNameForce(func: TAnyFunction): string {
    return getFnName(func) || getUniqFunctionName();
}
