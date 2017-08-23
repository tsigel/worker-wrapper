import { MESSAGE_TYPE, WorkerBody } from './WorkerBody';


export interface IOptions {
    libs?: Array<string>;
    customWorker?: typeof WorkerBody;
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

export interface IInitializeMessage {
    type: MESSAGE_TYPE.INITIALIZE;
    contentData: IContentData;
    libs: Array<string>;
    url: string;
}

export interface IWorkAction {
    type: MESSAGE_TYPE.WORK;
    data: {
        id: number;
        job: string;
    }
}

export interface IMessage<T> extends MessageEvent {
    data: T;
}

export interface IContentData {
    isSimple: boolean;
    template: string;
}

export interface IDefer<T> {
    resolve: (data: T) => void;
    reject: (data: any) => void;
}

export interface IAnyClass<T> {
    new (): T;
}

export type TWrapped<T> = IAnyClass<T> | T

export type TMessage = IMessage<IInitializeMessage> | IMessage<IWorkAction>;

export type TTypeList = 'string' | 'number' | 'function' | 'object' | 'boolean' | 'undefined'