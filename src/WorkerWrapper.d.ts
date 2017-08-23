import { IOptions, TWrapped } from './interface';
export declare class WorkerWrapper<T> {
    static defaultOptions: IOptions;
    private _worker;
    private _actionsHash;
    constructor(child: TWrapped<T>, options?: IOptions);
    process<R>(cb: (data: T) => Promise<R>): Promise<R>;
    terminate(): void;
    private _createWorker(optopns);
    private _initializeWorker(child, options);
    private _setHandlers();
    private static _stringify(child);
    private static _isSimple(child);
    private static _getContent(content, isPrototype);
    private static _getParentList(child);
    private static _processSuper(content, parent, isPrototype);
}
