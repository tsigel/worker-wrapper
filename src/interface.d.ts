import { MESSAGE_TYPE } from './WorkerBody';
import { DATA_TYPES } from './utils';

export interface IMain {
    create<T, R>(child: IAnyClass<T, R> | ICallback<R, T>, params: R, options?: Partial<IConfig>): IWrapProcess<T>;

    create<T>(child: IAnyClass<T, void> | ICallback<void, T>, options?: Partial<IConfig>): IWrapProcess<T>;

    create<T, R>(child: IAnyClass<T, R> | ICallback<R, T>, params: R): IWrapProcess<T>;

    create<T>(child: IAnyClass<T, void> | ICallback<void, T>): IWrapProcess<T>;

    create(options: Partial<IConfig>): ISimpleWrap;

    create(): ISimpleWrap;

    getConfig(): Readonly<IConfig>;

    config(config: Partial<IConfig>): void;
}

export interface IWorkerClassData<T, R> {
    child: IAnyClass<T, R> | T;
    params: R
}

export interface IConfig {
    libs?: Array<string>;
    customWorker?: any;
    stringifyMode?: boolean;
}

export interface IContent {
    name: string;
    value: string;
    type: TTypeList;
    isPrototype: boolean;
}

export interface IHash<T> {
    [key: string]: T;
}

export interface IContentData {
    isSimple: boolean;
    template: string;
}

export interface IDefer<T> {
    resolve: (data: T) => void;
    reject: (data: any) => void;
}

export interface IAnyClass<T, R> {
    new (data: R): T;
}

export interface IWrapProcess<T> {
    process<P, R>(cb: (item: T, data: P) => Promise<R> | R, data: P): Promise<R>;

    process<P, R>(cb: (item: T) => Promise<R> | R): Promise<R>;

    terminate(): void;
}

export interface ISimpleWrap {
    process<P, R>(cb: (data: P) => Promise<R> | R, data: P): Promise<R>;

    process<R>(cb: () => Promise<R> | R): Promise<R>;

    terminate(): void;
}

export interface IDefaultMessage {
    id: string;
}

export interface IMessage<T> extends MessageEvent {
    data: T;
}

export interface IResponse<T> extends IDefaultMessage {
    state: boolean;
    body: T;
}

export interface IAddLibsTask extends IDefaultMessage {
    type: MESSAGE_TYPE.ADD_LIBS;
    libs: Array<string>;
}

export interface IWorkTask extends IDefaultMessage {
    type: MESSAGE_TYPE.WORK;
    params: any;
    job: string;
}

export interface IAddProcessorTask extends IDefaultMessage {
    type: MESSAGE_TYPE.ADD_PROCESSOR,
    codeData: IContentData;
    params: any;
}

export interface ICallback<P, R> {
    (data: P): R;
}

export interface Ijsonify {
    data: any;
    classes: Array<IjsonifyClass>;
    paths: Array<TjsonifyPath>;
}

export interface IjsonifyClass {
    name: string;
    value: string;
}

export interface IjsonifyPathFunction {
    type: DATA_TYPES.FUNCTION,
    path: string;
    value: string;
}

export interface IjsonifyPathClass {
    type: DATA_TYPES.CLASS,
    path: string;
    name: string;
}

export interface IjsonifyPathInstance {
    type: DATA_TYPES.INSTANCE,
    path: string;
    value: Object;
    name: string;
}

export type TjsonifyPath = IjsonifyPathFunction | IjsonifyPathInstance | IjsonifyPathClass;

export type TTask = IAddLibsTask | IWorkTask | IAddProcessorTask;
export type TTypeList = 'string' | 'number' | 'function' | 'object' | 'boolean' | 'undefined'