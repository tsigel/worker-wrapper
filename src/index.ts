import { getWorkerBody } from './WorkerBody';
import { IAnyClass, IConfig, IMain, TAnyFunction } from './interface';
import { Serializer } from './Serializer';
import { Wrap } from './Wrap';
import { Parser } from './Parser';


class Main implements IMain {

    private _options: IConfig = {
        libs: [],
        customWorker: getWorkerBody(Serializer, Parser),
        stringifyMode: false
    };

    public classes = {
        Serializer: Serializer,
        Parser: Parser,
        WorkerBody: getWorkerBody(Serializer, Parser)
    };

    public config(options: Partial<IConfig>): void {
        this._options = { ...this._options, ...options };
    }

    public getConfig(): Readonly<IConfig> {
        return { ...this._options };
    }

    public create(arg1?: any, arg2?: any, arg3?: any): any {
        let processor: IAnyClass<any, any> | undefined;
        let options: Partial<IConfig> | undefined;
        let params;
        if (typeof arg1 === 'function') {
            processor = arg1;
        } else {
            if (this._isConfig(arg1)) {
                options = arg1;
            }
        }

        if (arg2) {
            if (this._isConfig(arg2)) {
                options = arg2;
            } else {
                params = arg2;
                if (arg3) {
                    options = arg3;
                }
            }
        }

        options = options || Object.create(null);

        const myOptions = { ...this._options, ...options };
        const worker = this._createWorker(myOptions.customWorker, myOptions.stringifyMode);

        return new Wrap(worker, { child: processor, params }, myOptions.libs, myOptions.stringifyMode);
    }

    private _createWorker(customWorker: typeof Wrap, stringifyMode?: boolean): Worker {
        const template = `var MyWorker = ${this._createTemplate(customWorker)}; new MyWorker(${stringifyMode})`;
        const blob = new Blob([template], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    }

    private _createTemplate(WorkerBody: typeof Wrap): string {
        const Name = Serializer.getFnName(WorkerBody);

        if (!Name) {
            throw new Error('Unnamed Worker Body class! Please add name to Worker Body class!');
        }

        return [
            '(function () {', ...[
                Serializer,
                Parser,
                WorkerBody].map(this._getFullClassTemplate),
            `return ${Name}})();`]
            .join('\n');
    }

    private _getFullClassTemplate(Factory: TAnyFunction): string {
        return Serializer.getFullClassTemplate(Factory).reduce((template, data) => {
            return `var ${data.name} = ${data.template}`;
        }, '');
    }

    private _isConfig(data: any): boolean {
        const keys = data && Object.keys(data) as Array<keyof IConfig> || [];
        return !!keys.length && keys.every((key) => {
            return !!this._options[key] &&
                typeof data[key] === typeof this._options[key] &&
                Array.isArray(data[key]) === Array.isArray(this._options[key]);
        });
    }

}

export default new Main() as IMain;