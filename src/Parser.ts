import { IClassData, ISerialized, TSerializedDataITem } from './Serializer';
import { TAnyFunction } from './utils/interface';


export class Parser {

    private readonly _classes: Record<string, any> = Object.create(null);
    private _cache: Array<{ code: string; compiled: any }> = [];
    private static _canUseUrl: boolean = true;
    private static _compileCount: number = 0;


    constructor() {
        this._classes = Object.create(null);
    }

    public parse(data: ISerialized): any {
        // data.classes.forEach(this._addClassData, this);

        const loop = (item: any): any => {
            if (Parser._isSerializedField(data.data)) {
                return this._parseSerializedItem(data.data, data.classes);
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
        // TODO need refactor
        switch (data.__type) {
            case 'serialized-class':
                return Parser._compile(classes[data.index].template);
            case 'serialized-function':
                return Parser._compile(data.template);
            case 'serialized-instance':
                return this._parseInstance(data.data, Parser._compile(classes[data.index].template));
        }
    }

    private _parseInstance(data: any, Factory: TAnyFunction): any {
        const instance = Object.create(Factory.prototype);
        Object.entries(data || {}).forEach(([key, value]) => {
            instance[key] = value;
        });
        return instance;
    }

    private _addClassData(classData: IClassData) {
        //TODO Add safe mode for compile classes!
        if (!this._classes[classData.name]) {
            const root = Parser._getRoot();
            if (root[classData.name]) {
                this._classes[classData.name] = root[classData.name];
            } else {
                this._classes[classData.name] = this._parseFunc(classData.template);
                root[classData.name] = this._classes[classData.name];
            }
        }
    }

    private _parseFunc(template: string): any {
        // TODO need create without eval
        // TODO need cache and queue
        return eval(template);
    }

    private static _getRoot(): any {
        return self;
    }

    private static _isSerializedField(data: any): data is TSerializedDataITem {
        return data && '__type' in data && [
            'serialized-function',
            'serialized-class',
            'serialized-instance'
        ].indexOf(data.__type) !== -1;
    }

    private static _compile(code: string): Promise<any> {
        if (Parser._canUseUrl) {
            return Parser._evalByUrl(code)
                .catch(() => {
                    Parser._canUseUrl = false;
                    return Parser._eval(code);
                });
        }
        return Promise.resolve(Parser._eval(code));
    }

    private static _eval(code: string): any {
        const name = Parser._getCompileName() as keyof typeof self;
        const template = `self['${name}'] = ${code}`;
        eval(template);
        return self[name];
    }

    private static _evalByUrl(code: string): Promise<any> {
        const name = Parser._getCompileName() as keyof typeof self;
        const template = `self['${name}'] = ${code}`;
        const url = URL.createObjectURL(new Blob([template], { type: 'application/json' }));

        return Parser._addScript(url)
            .then(() => {
                return self[name];
            });
    }

    private static _getCompileName() {
        return `compile_${Parser._compileCount++}`;
    }

    private static _loadScript(url: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.addEventListener('load', () => resolve());
            script.addEventListener('error', reject);
            script.src = url;
            document.body.appendChild(script);
        });
    }

    private static _addScript(url: string): Promise<void> {
        if ('importScripts' in self) {
            try {
                (self as WorkerUtils).importScripts(url);
                return Promise.resolve();
            } catch (e) {
                return Promise.reject(e);
            }
        }
        return Parser._loadScript(url);
    }

}
