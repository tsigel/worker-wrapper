///<reference path="interface.d.ts"/>

class WorkerWrapper<T extends Function> {

    public static defaultOptions: IOptions = {
        workerPath: '',
        libs: []
    };

    private _worker: Worker;
    private _actionsHash: IHash<IDefer<any>>;

    constructor(child: T, options: IOptions) {
        const path = options.workerPath || WorkerWrapper.defaultOptions.workerPath;

        if (path === '') {
            throw new Error('Has no path for load worker!');
        }

        this._worker = new Worker(options.workerPath || WorkerWrapper.defaultOptions.workerPath);
        this._actionsHash = Object.create(null);

        this._worker.postMessage({
            type: 'initialize',
            contentData: WorkerWrapper.stringify(child),
            libs: options.libs || WorkerWrapper.defaultOptions.libs
        });
        this.setHandlers();
    }

    public process<R>(cb: (T) => Promise<R>): Promise<R> {
        const id = Date.now();
        return new Promise((resolve, reject) => {
            this._actionsHash[id] = {
                resolve: resolve,
                reject: reject
            };
            this._worker.postMessage({
                type: 'work',
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

    private setHandlers() {
        this._worker.onmessage = (e) => {
            if (e.data.error != null) {
                this._actionsHash[e.data.id].reject(e.data.result);
            } else {
                this._actionsHash[e.data.id].resolve(e.data.result);
            }
        }
    }

    private static stringify(child: any): { template: string; isSimple: boolean } {

        if (typeof child !== 'function') {
            throw new Error('Wrong params!');
        }

        let template = '(function () {';

        if (WorkerWrapper.isSimple(child)) {
            template += `return ${String(child)}})();`;
            return { template, isSimple: true };
        }

        WorkerWrapper.getParentList(child).forEach((item, i, list) => {

            const name = item.name || 'Class';
            const _super = list[i - 1];

            let Constructor = String(item) + ';';

            if (Constructor.indexOf(`class ${name}`) === 0) {
                template += Constructor;
                return null;
            }

            template += `var ${name} = ${WorkerWrapper.processSuper(Constructor, _super, false)}`;
            if (_super) {
                template += `${name}.prototype = new ${_super.name}();`;
                template += `${name}.prototype.constructor = ${name};`;
            }

            WorkerWrapper.getContent(item.prototype, true)
                .concat(WorkerWrapper.getContent(item, false))
                .forEach((content) => {
                    const value = WorkerWrapper.processSuper(content.value, _super, content.isPrototype);
                    if (content.isPrototype) {
                        template += `${name}.prototype.${content.name} = ${value};`;
                    } else {
                        template += `${name}.${content.name} = ${value};`;
                    }
                });
        });

        template += `return ${child.name};})()`;

        return { template, isSimple: false };
    }

    private static isSimple(child: any): boolean {
        return Object.getOwnPropertyNames(child.prototype).length === 1 && child.prototype.constructor === child;
    }

    private static getContent(content, isPrototype: boolean): Array<IContent> {
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

    private static getParentList(child) {
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

    private static processSuper(content: string, parent: any, isPrototype: boolean) {
        const reg = /\b(_super)\b/;
        return content.replace(reg, function () {
            if (isPrototype) {
                return `${parent.name}.prototype`;
            } else {
                return parent.name;
            }
        })
    }

}

