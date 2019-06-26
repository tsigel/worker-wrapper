import { IClassData, ISerialized, TSerializedDataITem } from './Serializer';
import { TAnyFunction } from './interface';

type TGlobalKey = keyof typeof self;


export class Parser {

    private readonly _classes: Record<string, { name: string, Factory: TAnyFunction }> = Object.create(null);


    public parse(data: ISerialized): any {
        this._addClassData(data.classes);

        const loop = (item: any): any => {
            if (Parser._isSerializedField(item)) {
                return this._parseSerializedItem(item, data.classes);
            }

            if (Array.isArray(item)) {
                return item.map(loop);
            }

            if (!item) {
                return item;
            }

            if (typeof item !== 'object') {
                return item;
            }

            return Object.entries(item)
                .reduce(
                    (acc, [key, value]) => Object.assign(acc, { [key]: loop(value) }),
                    {}
                );
        };

        return loop(data.data);
    }

    private _parseSerializedItem(data: TSerializedDataITem, classes: Array<IClassData>): any {
        switch (data.__type) {
            case 'serialized-class':
                return this._classes[classes[data.index].template].Factory;
            case 'serialized-function':
                // TODO Add Cache
                return Parser._compile(data.template);
            case 'serialized-instance':
                return Parser._parseInstance(data.data, this._classes[classes[data.index].template].Factory);
        }
    }

    private _addClassData(list: Array<IClassData>): void {
        list.forEach((classData, index, list) => {
            if (this._classes[classData.template]) {
                return undefined;
            }

            if (classData.name in self && classData.template === self[classData.name as TGlobalKey].constructor.toString()) {
                return undefined;
            }

            const parent = classData.parent != null && list[classData.parent] || undefined;
            this._compileClass(classData, parent);
        });
    }

    private _compileClass(classData: IClassData, parent?: IClassData): void {
        const needReplace = parent && parent.name in self && parent.template !== self[parent.name as TGlobalKey].constructor.toString();
        const hasValue = !parent || parent.name in self;
        const parentOrigin = needReplace && self[(parent as IClassData).name as TGlobalKey];

        if (!hasValue || needReplace) {
            self[(parent as IClassData).name as any] = this._classes[(parent as IClassData).template].Factory as any;
        }

        const Factory = eval(`(function () { return ${classData.template} })();`);

        if (needReplace) {
            self[(parent as IClassData).name as any] = parentOrigin;
        }

        this._classes[classData.template] = {
            name: classData.name,
            Factory
        };
    }

    private static _parseInstance(data: any, Factory: TAnyFunction): any {
        const instance = Object.create(Factory.prototype);
        Object.assign(instance, data);
        return instance;
    }

    private static _isSerializedField(data: any): data is TSerializedDataITem {
        return typeof data === 'object' && data && '__type' in data && [
            'serialized-function',
            'serialized-class',
            'serialized-instance'
        ].indexOf(data.__type) !== -1;
    }

    private static _compile(code: string): any {
        const template = `(function () { return ${code} })();`;
        return eval(template);
    }

}
