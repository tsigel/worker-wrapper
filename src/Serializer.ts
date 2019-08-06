import { TAnyFunction } from './interface';


export class Serializer {

    private _constructorList: Array<TAnyFunction> = [];
    private _classes: Array<IClassData> = [];
    private static _getUniqFunctionName = (() => {
        let count = 0;
        return () => `Unnamed_${count++}`;
    })();


    public serialize(data: any): ISerialized {

        const result = {
            data: null,
            classes: this._classes
        };

        const loop = (origin: any): any => {
            switch (typeof origin) {
                case 'function':
                    if (Serializer.isFunction(origin)) {
                        return {
                            __type: 'serialized-function',
                            template: Serializer.functionToString(origin)
                        };
                    } else {
                        const index = this._addConstructor(origin);
                        return {
                            __type: 'serialized-class',
                            index
                        };
                    }
                case 'object':
                    if (!origin) {
                        return origin;
                    }

                    if (Serializer.isInstance(origin)) {
                        const index = this._addConstructor(origin.constructor);
                        return {
                            __type: 'serialized-instance',
                            index,
                            // TODO add support instance of class in this
                            // TODO add support getters/setters
                            data: origin
                        };
                    } else {
                        if (Serializer.isNative(origin.constructor) && !['Object', 'Array'].includes(origin.constructor.name)) {
                            return {
                                __type: 'serialized-native-instance',
                                constructorName: origin.constructor.name,
                                data: origin
                            };
                        } else if (Array.isArray(origin)) {
                            return origin.map(loop);
                        } else {
                            const local = Object.create(null);
                            Object.entries(origin).forEach(([key, value]) => {
                                local[key] = loop(value);
                            });
                            return local;
                        }
                    }
                default:
                    return origin;
            }
        };

        result.data = loop(data);
        this._clear();

        return result;
    }

    private _addConstructor(Factory: TAnyFunction): number {
        const index = this._constructorList.indexOf(Factory);
        if (index === -1) {
            Serializer.getFullClassTemplate(Factory).forEach((item, i, list) => {
                if (this._constructorList.indexOf(item.factory) === -1) {
                    const parentData = list[i - 1];
                    const parent = parentData ? this._classes.length - 1 : undefined;
                    this._constructorList.push(item.factory);
                    this._classes.push({ template: item.template, name: item.name, parent });
                }
            });
            return this._constructorList.length - 1;
        } else {
            return index;
        }
    }

    private _clear() {
        this._classes = [];
        this._constructorList = [];
    }

    public static isNative(data: (...args: Array<any>) => any): boolean {
        return /function .*\(\).*\n?.*\[native code\]/.test(data.toString());
    }

    public static isInstance(some: any): boolean {
        const constructor = some.constructor;

        if (!constructor) {
            return false;
        }

        return !Serializer.isNative(constructor);
    }

    public static getClassParents(Factory: TAnyFunction): Array<TAnyFunction> {
        const result = [Factory];
        let tmp = Factory;
        let item = Object.getPrototypeOf(tmp);

        while (item.prototype) {
            result.push(item);
            tmp = item;
            item = Object.getPrototypeOf(tmp);
        }

        return result.reverse();
    }

    public static isFunction(Factory: TAnyFunction): boolean {
        if (!Factory.prototype) {
            // Arrow function has no prototype
            return true;
        }

        const prototypePropsLength = Object.getOwnPropertyNames(Factory.prototype)
            .filter(item => item !== 'constructor')
            .length;

        return prototypePropsLength === 0 && Serializer.getClassParents(Factory).length === 1;
    }

    public static functionToString(func: (...args: Array<any>) => any): string {
        return `(function () {\n   return ${func.toString()}\n})();`;
    }

    public static getFullClassTemplate(Factory: TAnyFunction): Array<{ name: string; template: string, factory: TAnyFunction }> {
        debugger;
        const dataList: Array<IClassDetails> = Serializer.getClassParents(Factory).map(item => Serializer._getClassData(item));

        return dataList.map((info, index, list) => {
            const parent = list[index - 1];
            return {
                name: info.Name,
                template: Serializer._getClassTemplate(info, parent),
                factory: info.Factory
            };
        });
    }

    public static getFnName(fn: TAnyFunction): string | null {
        const s = ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
        return (s && s[1] || null);
    }

    public static getFnNameForce(func: TAnyFunction): string {
        return Serializer.getFnName(func) || Serializer._getUniqFunctionName();
    }

    private static _getClassData(Factory: TAnyFunction): IClassDetails;
    private static _getClassData(Factory: undefined): undefined;
    private static _getClassData(Factory: TAnyFunction | undefined): IClassDetails | undefined {
        return Factory ? {
            Name: Serializer.getFnNameForce(Factory),
            Factory
        } : undefined;
    }

    private static _getClassTemplate(target: IClassDetails, parent?: IClassDetails): string {
        // TODO Add Es6 support
        const ParentName = parent && parent.Name || undefined;
        return [
            `(function () { `,
            Serializer._getConstructorTemplate(target.Factory, target.Name, ParentName),
            Serializer._getPrototypeTemplate(target.Factory, target.Name, ParentName),
            Serializer._getStaticTemplate(target.Factory, target.Name),
            `return ${target.Name}; })();`
        ].join('\n');
    }

    private static _getConstructorTemplate(Factory: TAnyFunction, ClassName: string, ParentName?: string): string {

        const ClassConstructorTemplate = Serializer._replaceSuper(Factory, ParentName);

        const parts = [
            `var ${ClassName} = ${ClassConstructorTemplate};`
        ];

        if (ParentName) {
            parts.push(`${ClassName}.prototype = Object.create(${ParentName}.prototype);`);
            parts.push(`${ClassName}.prototype.constructor = ${ClassName};`);
        }

        return parts.join('\n');
    }

    private static _getPrototypeTemplate(Factory: TAnyFunction, ClassName: string, ParentName?: string): string {
        return Object.entries(Factory.prototype)
            .filter(([key]) => key !== 'constructor')
            .reduce((template, [propName, value]) => {
                return `${template}\n${Serializer._getPrototypeItemTemplate(value, propName, ClassName, ParentName)}`;
            }, '');
    }

    private static _getStaticTemplate(Factory: TAnyFunction, ClassName: string): string {
        return Object.entries(Factory).reduce((template, [propName, value]) => {
            return `${template}\n${Serializer._getStaticItemTemplate(value, propName, ClassName)}`;
        }, '');
    }

    private static _getPrototypeItemTemplate(item: any, propName: string, ClassName: string, ParentName?: string): string {
        switch (typeof item) {
            case 'object':
                // TODO Add instance check
                // TODO Add stringify error catch
                return `${ClassName}.prototype.${propName} = ${JSON.stringify(item)};`;
            case 'function':
                // TODO Add Class check
                // TODO Add super support
                // TODO Add support getters/setters
                return `${ClassName}.prototype.${propName} = ${Serializer._replaceSuper(item, ParentName)};`;
            default:
                // TODO Add support getters/setters
                return `${ClassName}.prototype.${propName} = ${item};`;
        }
    }

    private static _getStaticItemTemplate(item: any, propName: string, ClassName: string): string {
        switch (typeof item) {
            case 'object':
                // TODO Add instance check
                // TODO Add stringify error catch
                // TODO Add support getters/setters
                return `${ClassName}.${propName} = ${JSON.stringify(item)};`;
            case 'function':
                // TODO Add Class check
                return `${ClassName}.${propName} = ${item.toString()};`;
            default:
                // TODO Add support getters/setters
                return `${ClassName}.${propName} = ${item};`;
        }
    }

    private static _replaceSuper(Factory: TAnyFunction, ParentName?: string): string {
        if (!ParentName) {
            return Factory.toString();
        }
        return Factory.toString().replace(Serializer._getSuperReg(), `${ParentName}`);
    }

    private static _getSuperReg(): RegExp {
        return /\b(_super)\b/g;
    }

}

export interface ISerialized {
    data: any;
    classes: Array<IClassData>;
}

export interface IClassData {
    name: string;
    template: string;
    parent?: number;
}

export interface IFunctionDataItem {
    __type: 'serialized-function';
    template: string;
}

export interface IClassDataItem {
    __type: 'serialized-class';
    index: number;
}

export interface IInstanceDataItem {
    __type: 'serialized-instance';
    index: number;
    data: any;
}

export interface INativeInstanceItem {
    __type: 'serialized-native-instance';
    constructorName: string;
    data: any;
}

export type TSerializedDataITem = IFunctionDataItem | IClassDataItem | IInstanceDataItem | INativeInstanceItem;

interface IClassDetails {
    Name: string;
    Factory: TAnyFunction;
}
