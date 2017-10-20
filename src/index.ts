import { WorkerBody } from './WorkerBody';
import { Jsonify } from './Jsonify';
import { Jsonify } from './Parser';
import { IAnyClass, IConfig, IMain } from './interface';
import { stringify } from './utils';
import { Wrap } from './Wrap';


class Main implements IMain {

    private _options: IConfig = {
        libs: [],
        customWorker: WorkerBody,
        stringifyMode: false
    };

    public config(options: Partial<IConfig>): void {
        this._options = { ...this._options, ...options };
    }

    public getConfig(): Readonly<IConfig> {
        return { ...this._options };
    }

    public create(arg1?: any, arg2?: any, arg3?: any): any {
        let processor: IAnyClass<any, any>;
        let options: Partial<IConfig>;
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

    private _createWorker(customWorker: typeof WorkerBody, stringifyMode: boolean): Worker {
        const codeData = stringify(customWorker);
        const template = `var MyWorker = ${codeData.template} ;new MyWorker(${stringifyMode})`;

        const blob = new Blob([template], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    }

    private _isConfig(data: any): boolean {
        const keys = data && Object.keys(data) || [];
        return keys.length && keys.every((key) => {
            return this._options[key] &&
                typeof data[key] === typeof this._options[key] &&
                Array.isArray(data[key]) === Array.isArray(this._options[key]);
        });
    }

}

export = (new Main()) as IMain;