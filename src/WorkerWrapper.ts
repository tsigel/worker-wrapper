import { WorkerBody, MESSAGE_TYPE } from './WorkerBody';
import { IContent, IDefer, IHash, IOptions, TTypeList, TWrapped } from './interface';


export class WorkerWrapper<T> {


    public static defaultOptions: IOptions = {
        libs: [],
        customWorker: WorkerBody
    };

    private _worker: Worker;
    private _actionsHash: IHash<IDefer<any>>;


    constructor(child: TWrapped<T>, options: IOptions = Object.create(null)) {

        const myOptions = { ...WorkerWrapper.defaultOptions, ...options };
        this._actionsHash = Object.create(null);
        this._createWorker(myOptions);
        this._setHandlers();
        this._initializeWorker(child, myOptions);
    }

    public process<R>(cb: (data: T) => Promise<R>): Promise<R> {
        const id = Date.now();
        return new Promise((resolve, reject) => {
            this._actionsHash[id] = {
                resolve: resolve,
                reject: reject
            };
            this._worker.postMessage({
                type: MESSAGE_TYPE.WORK,
                data: {
                    id: id,
                    job: cb.toString()
                }
            });
        });
    }

    public terminate(): void {
        this._actionsHash = null;
        this._worker.terminate();
    }

    private _createWorker(optopns: IOptions): void {
        const codeData = WorkerWrapper._stringify(optopns.customWorker);
        const template = `var MyWorker = ${codeData.template} ;new MyWorker()`;

        const blob = new Blob([template], { type: 'application/javascript' });
        this._worker = new Worker(URL.createObjectURL(blob));
    }

    private _initializeWorker(child: TWrapped<T>, options: IOptions): void {
        this._worker.postMessage({
            type: MESSAGE_TYPE.INITIALIZE,
            contentData: WorkerWrapper._stringify(child),
            libs: options.libs,
            url: `${location.protocol}//${location.host}`
        });
    }

    private _setHandlers(): void {
        this._worker.onmessage = (e) => {
            if (e.data.type === 'ERROR') {
                this.terminate();
                throw new Error(e.data.error);
            }
            if (e.data.error != null) {
                this._actionsHash[e.data.id].reject(e.data.error);
            } else {
                this._actionsHash[e.data.id].resolve(e.data.result);
            }
        }
    }

    private static _stringify(child: any): { template: string; isSimple: boolean } {

        if (typeof child !== 'function') {
            throw new Error('Wrong params!');
        }

        let template = '(function () {\n';

        if (WorkerWrapper._isSimple(child)) {
            template += `   return ${String(child)}})();`;
            return { template, isSimple: true };
        }

        WorkerWrapper._getParentList(child).forEach((item, i, list) => {

            const name = item.name || 'Class';
            const _super = list[i - 1];

            let Constructor = String(item) + ';';

            if (Constructor.indexOf(`class ${name}`) === 0) {
                template += Constructor;
                return null;
            }

            template += `   var ${name} = ${WorkerWrapper._processSuper(Constructor, _super, false)}` + '\n';
            if (_super) {
                template += `   ${name}.prototype = new ${_super.name}();` + '\n';
                template += `   ${name}.prototype.constructor = ${name};` + '\n';
            }

            WorkerWrapper._getContent(item.prototype, true)
                .concat(WorkerWrapper._getContent(item, false))
                .forEach((content) => {
                    const value = WorkerWrapper._processSuper(content.value, _super, content.isPrototype);
                    if (content.isPrototype) {
                        template += `   ${name}.prototype.${content.name} = ${value};` + '\n';
                    } else {
                        template += `   ${name}.${content.name} = ${value};` + '\n';
                    }
                });
        });

        template += `   return ${child.name};\n})()` + '\n';

        return { template, isSimple: false };
    }

    private static _isSimple(child: any): boolean {
        return Object.getOwnPropertyNames(child.prototype).length === 1 && child.prototype.constructor === child;
    }

    private static _getContent(content, isPrototype: boolean): Array<IContent> {
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

    private static _getParentList(child): Array<any> {
        const result = [child];
        let tmp = child;
        let item = Object.getPrototypeOf(tmp);

        while (item.prototype) {
            result.push(item);
            tmp = item;
            item = Object.getPrototypeOf(tmp);
        }

        return result.reverse();
    }

    private static _processSuper(content: string, parent: any, isPrototype: boolean): string {
        const reg = /\b(_super)\b/g;
        return content.replace(reg, function () {
            if (isPrototype) {
                return `${parent.name}.prototype`;
            } else {
                return parent.name;
            }
        })
    }

}

