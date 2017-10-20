import { IHash, Ijsonify, IjsonifyClass, IContent, TTypeList } from './interface';
import { DATA_TYPES } from './utils';


export class Jsonify {

    private _classes: IHash<string>;

    constructor() {
        this._classes = Object.create(null);
    }

    public toJSON(data: any): Ijsonify {
        const result = {
            data: null,
            classes: [],
            paths: []
        };

        switch (typeof data) {
            case 'object':
                if (this._isInstance(data)) {
                    this._addJSONObject(null, result, data);
                } else {
                    result.data = this._addJSONObject(null, result, data);
                }
                break;
            case 'function':
                this._addJSONFunction(null, result, data);
                break;
            default:
                result.data = data;
        }

        return result;
    }

    private _addJSONObject(path: string, json: Ijsonify, data: any) {

        if (this._isInstance(data)) {
            const classes = this._getInstanceClass(data);
            this._addClassToJSON(json, classes);
            json.paths.push({
                type: DATA_TYPES.INSTANCE,
                path: path,
                value: data,
                name: classes[classes.length - 1].name
            });
        }

        Object.keys(data).forEach((key: string) => {
            const item = data[key];
            switch (typeof item) {
                case 'function':
                    delete data[key];
                    this._addJSONFunction(path ? `${path}.${key}` : key, json, item);
                    break;
                case 'object':
                    if (this._isInstance(item)) {
                        delete data[key];
                    }
                    this._addJSONObject(path ? `${path}.${key}` : key, json, item);
            }
        });
        return data;
    }

    private _addJSONFunction(path: string, json: Ijsonify, func: any) {
        let type;
        let value;
        let name;

        if (this._isFunction(func)) {
            value = this._toStringFunction(func);
            type = DATA_TYPES.FUNCTION;
        } else {
            const classes = this._toStringClass(func);
            this._addClassToJSON(json, classes);
            type = DATA_TYPES.CLASS;
            name = classes[classes.length - 1].name;
        }

        json.paths.push({
            path: path,
            value,
            type,
            name
        });
    }

    private _addClassToJSON(json: Ijsonify, classData: IjsonifyClass | Array<IjsonifyClass>): void {
        if (Array.isArray(classData)) {
            classData.forEach((data) => {
                return this._addClassToJSON(json, data);
            });
        } else {
            const hasClass = json.classes.some((data) => {
                return data.name === classData.name;
            });
            if (!hasClass) {
                json.classes.push(classData);
            }
        }
    }

    //TODO fix is function by function code or some
    private _isFunction(child: any): boolean {
        if (!child.prototype) {
            return true;
        }
        return Object.getOwnPropertyNames(child.prototype).length === 1 && this._getClassParents(child).length === 1;
    }

    private _toStringFunction(func): string {
        let template = '(function () {\n';
        template += `   return ${String(func)}})();`;
        return template;
    }

    private _isInstance(some: any): boolean {
        const constructor = some.constructor;

        if (!constructor) {
            return false;
        }

        return !this._isNative(constructor);
    }

    private _isNative(fn: Function): boolean {
        return fn.toString().indexOf('[native code]') !== -1;
    }

    private _getInstanceClass(some: any): Array<IjsonifyClass> {
        return this._toStringClass(some.constructor);
    }

    private _toStringClass(rootConstructor): Array<{ name: string, value: string }> {
        return this._getClassParents(rootConstructor).map((item, i, list) => {
            const _super = list[i - 1];
            return { name: this._getFnName(item), value: this._toStringTartetClass(item, _super) };
        });
    }

    private _toStringTartetClass(target: any, parent: any): string {
        const targetName = this._getFnName(target);
        if (this._classes[targetName]) {
            return this._classes[targetName];
        }

        let template = '(function () {\n';

        let Constructor = String(target) + ';';

        if (Constructor.indexOf(`class ${targetName}`) === 0) {
            template += Constructor;
        } else {

            template += `   var ${targetName} = ${this._processSuper(Constructor, parent, false)}` + '\n';
            if (parent) {
                template += `   ${targetName}.prototype = new ${this._getFnName(parent)}();` + '\n';
                template += `   ${targetName}.prototype.constructor = ${targetName};` + '\n';
            }

            this._getContent(target.prototype, true)
                .concat(this._getContent(target, false))
                .forEach((content) => {
                    const value = this._processSuper(content.value, parent, content.isPrototype);
                    if (content.isPrototype) {
                        template += `   ${targetName}.prototype.${content.name} = ${value};` + '\n';
                    } else {
                        template += `   ${targetName}.${content.name} = ${value};` + '\n';
                    }
                });
        }

        template += `   return ${targetName};\n})()` + '\n';
        this._classes[targetName] = template;
        return template;
    }

    private _getClassParents(constructor): Array<any> {
        const result = [constructor];
        let tmp = constructor;
        let item = Object.getPrototypeOf(tmp);

        while (item.prototype) {
            result.push(item);
            tmp = item;
            item = Object.getPrototypeOf(tmp);
        }

        return result.reverse();
    }

    private _getFnName(fn): string {
        const s = ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
        return (s && s[1] || 'anonymous');
    }

    private _processSuper(content: string, parent: any, isPrototype: boolean): string {
        const reg = /\b(_super)\b/g;
        return content.replace(reg, function () {
            if (isPrototype) {
                return `${parent.name}.prototype`;
            } else {
                return parent.name;
            }
        });
    }

    private _getContent(content, isPrototype: boolean): Array<IContent> {
        return Object.keys(content || {})
            .filter((name) => name !== 'constructor')
            .map((name) => {
                const item = content[name];
                const type = typeof item as TTypeList;
                let value: string;

                switch (type) {
                    case 'string':
                        value = item;
                        break;
                    case 'object':
                        //TODO add support classes in static props or prototype
                        try {
                            value = JSON.stringify(item);
                        } catch (e) {
                            throw new Error('Stringify error!');
                        }
                        break;
                    default:
                        value = String(item);
                }

                return { name, type, value, isPrototype };
            });
    }

}
