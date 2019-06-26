import { MESSAGE_TYPE } from './WorkerBody';

import { IDefer, IMessage, IResponse, ISimpleWrap, IWorkerClassData, IWrapProcess, TTask } from './interface';
import { Serializer } from './Serializer';
import { Parser } from './Parser';


export class Wrap<T, R> implements ISimpleWrap, IWrapProcess<T> {

    private readonly _worker: Worker;
    private readonly _actionsHash: Record<string, IDefer<any>>;
    private readonly _ready: Promise<boolean>;
    private readonly _stringifyMode: boolean;
    private readonly _serializer: Serializer;
    private readonly _parser: Parser;


    constructor(worker: Worker, classData: IWorkerClassData<T, R>, libs?: Array<string>, stringifyMode?: boolean) {
        this._worker = worker;
        this._actionsHash = Object.create(null);
        this._stringifyMode = stringifyMode == null ? false : stringifyMode;
        this._serializer = new Serializer();
        this._parser = new Parser();

        this._setHandlers();

        this._ready = Promise.all([
            this._addLibs(libs),
            this._addProcessor(classData)
        ]).then((...args) => {
            return args.every(Boolean);
        }).catch((e) => {
            this.terminate();
            console.error(e);
            throw new Error(e);
        });
    }

    public process(cb: Function, params?: any): Promise<any> {
        return this._ready.then(() => {
            return this._sendMessage({
                type: MESSAGE_TYPE.WORK,
                params: this._serializer.serialize(params),
                job: this._serializer.serialize(cb)
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
        };
    }

    private _onMessage(data: IResponse<any>): void {
        if (this._stringifyMode) {
            data = JSON.parse(data as any);
        }
        if (!data.id) {
            throw new Error(data as any);
        }
        const method = data.state ? 'resolve' : 'reject';
        this._actionsHash[data.id][method](this._parser.parse(data.body));
        delete this._actionsHash[data.id];
    }

    private _sendMessage(body: Partial<TTask>): Promise<any> {
        const id = `${Date.now()}-${Math.random()}`;
        return new Promise((resolve, reject) => {
            this._actionsHash[id] = { resolve, reject };
            try {
                this._worker.postMessage(this._getSendData(body, id));
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    }

    private _getSendData(body: Partial<TTask>, id: string): any {
        const data = { ...body, id };
        if (this._stringifyMode) {
            return JSON.stringify(data);
        } else {
            return data;
        }
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
            codeData: this._serializer.serialize(classData.child),
            params: this._serializer.serialize(classData.params)
        });
    }

}