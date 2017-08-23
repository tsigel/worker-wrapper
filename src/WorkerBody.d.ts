import { IContentData, IWorkAction, TMessage } from './interface';
export declare const enum MESSAGE_TYPE {
    INITIALIZE = 0,
    WORK = 1,
}
export declare class WorkerBody {
    private child;
    constructor();
    protected setHandlers(): void;
    protected onMessage(message: TMessage): void;
    protected send(data: any): void;
    protected doWork(message: IWorkAction): void;
    protected createWorkerBody(content: IContentData): void;
}
