import { DATA_TYPES } from './src/utils';

interface IMain {
    create<T, R>(child: IAnyClass<T, R> | ICallback<R, T>, params: R, options?: Partial<IConfig>): IWrapProcess<T>;

    create<T>(child: IAnyClass<T, void> | ICallback<void, T>, options?: Partial<IConfig>): IWrapProcess<T>;

    create<T, R>(child: IAnyClass<T, R> | ICallback<R, T>, params: R): IWrapProcess<T>;

    create<T>(child: IAnyClass<T, void> | ICallback<void, T>): IWrapProcess<T>;

    create(options: Partial<IConfig>): ISimpleWrap;

    create(): ISimpleWrap;

    getConfig(): Readonly<IConfig>;

    config(config: Partial<IConfig>): void;
}

declare const enum MESSAGE_TYPE {
    ADD_LIBS = 0,
    ADD_PROCESSOR = 1,
    WORK = 2
}

declare class WorkerBody {
    private child;

    constructor();

    protected setHandlers(): void;

    protected onMessage(message: TTask): void;

    protected addLibs(libs: Array<string>): void;

    protected addProcessor(data: IAddProcessorTask): void;

    protected process(cb: Function, id: string): void;

    protected send(data: IResponse<any>): void;

    protected doWork(message: IWorkTask): void;
}

interface IWorkerClassData<T, R> {
    child: IAnyClass<T, R> | T;
    params: R
}

interface IConfig {
    libs?: Array<string>;
    customWorker?: typeof WorkerBody;
    stringifyMode?: boolean;
}

interface IContent {
    name: string;
    value: string;
    type: TTypeList;
    isPrototype: boolean;
}

interface IHash<T> {
    [key: string]: T;
}

interface IContentData {
    type: DATA_TYPES.FUNCTION | DATA_TYPES.CLASS;
    template: string;
}

interface IDefer<T> {
    resolve: (data: T) => void;
    reject: (data: any) => void;
}

interface IAnyClass<T, R> {
    new(data: R): T;
}

interface IWrapProcess<T> {
    process<P, R>(cb: (item: T, data: P) => Promise<R> | R, data: P): Promise<R>;

    process<P, R>(cb: (item: T) => Promise<R> | R): Promise<R>;

    terminate(): void;
}

interface ISimpleWrap {
    process<P, R>(cb: (data: P) => Promise<R> | R, data: P): Promise<R>;

    process<R>(cb: () => Promise<R> | R): Promise<R>;

    terminate(): void;
}

interface IDefaultMessage {
    id: string;
}

interface IMessage<T> extends MessageEvent {
    data: T;
}

interface IResponse<T> extends IDefaultMessage {
    state: boolean;
    body: T;
}

interface IAddLibsTask extends IDefaultMessage {
    type: MESSAGE_TYPE.ADD_LIBS;
    libs: Array<string>;
}

interface IWorkTask extends IDefaultMessage {
    type: MESSAGE_TYPE.WORK;
    params: any;
    job: string;
}

interface IAddProcessorTask extends IDefaultMessage {
    type: MESSAGE_TYPE.ADD_PROCESSOR,
    codeData: IContentData;
    params: any;
}


interface ICallback<P, R> {
    (data: P): R;
}

type TTask = IAddLibsTask | IWorkTask | IAddProcessorTask;
type TTypeList = 'string' | 'number' | 'function' | 'object' | 'boolean' | 'undefined'

declare module 'worker-wrapper' {
    const main: IMain;
    export = main;
}

declare const workerWrapper: IMain;
