import { MESSAGE_TYPE } from './WorkerBody';

import { IDefer, IHash, IMessage, IResponse, ISimpleWrap, IWorkerClassData, IWrapProcess, TTask } from './interface';
import { stringify } from './utils';


export class Wrap<T, R> implements ISimpleWrap, IWrapProcess<T> {

    private readonly _worker: Worker;
    private readonly _actionsHash: IHash<IDefer<any>>;
    private readonly _ready: Promise<boolean>;


    constructor(worker: Worker, classData?: IWorkerClassData<T, R>, libs?: Array<string>,) {
        this._worker = worker;
        this._actionsHash = Object.create(null);

        this._setHandlers();

        this._ready = Promise.all([
            this._addLibs(libs),
            this._addProcessor(classData)
        ]).then((...args) => {
            return args.every(Boolean);
        }).catch((e) => {
            this.terminate();
            throw new Error(e);
        });
    }

    public process(cb: Function, params?): Promise<any> {
        return this._ready.then(() => {
            return this._sendMessage({
                type: MESSAGE_TYPE.WORK,
                params: params,
                job: stringify(cb).template
            });
        });
    }

    public terminate(): void {
        Object.keys(this._actionsHash).forEach((id) => {
            this._actionsHash[id].reject('Worker was terminated!');
            delete this._actionsHash[id];
        });
        this._worker.terminate();
    }

    private _setHandlers(): void {
        this._worker.onmessage = (e: IMessage<IResponse<any>>) => {
            this._onMessage(e.data);
        }
    }

    private _onMessage(data: IResponse<any>): void {
        if (!data.id) {
            throw new Error(data as any);
        }
        const method = data.state ? 'resolve' : 'reject';
        this._actionsHash[data.id][method](data.body);
    }

    private _sendMessage(body: Partial<TTask>): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = `${Date.now()}-${Math.random()}`;
            this._actionsHash[id] = { resolve, reject };
            this._worker.postMessage({ ...body, id });
        });
    }

    private _addLibs(libs?: Array<string>): Promise<boolean> {
        if (!libs || !libs.length) {
            return Promise.resolve(true);
        }

        return this._sendMessage({
            type: MESSAGE_TYPE.ADD_LIBS,
            libs: libs.map((item) => {
                const urlPart = `${location.host}/${item}`.replace('//', '/');
                return `${location.protocol}//${urlPart}`;
            })
        });
    }

    private _addProcessor(classData?: IWorkerClassData<T, R>): Promise<boolean> {
        if (!classData || !classData.child) {
            return Promise.resolve(true);
        }

        return this._sendMessage({
            type: MESSAGE_TYPE.ADD_PROCESSOR,
            codeData: stringify(classData.child),
            params: classData.params
        });
    }

}