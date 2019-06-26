import { IAddProcessorTask, IMessage, IResponse, IWorkTask, TTask } from './interface';
import { Parser, Serializer } from '.';


export const enum MESSAGE_TYPE {
    ADD_LIBS,
    ADD_PROCESSOR,
    WORK
}


export class WorkerBody {

    public static Serializer: typeof Serializer;
    public static Parser: typeof Parser;
    private readonly _stringifyMode: boolean;
    private readonly _serializer: Serializer;
    private readonly _parser: Parser;
    private child: any;


    constructor(Serialize: typeof Serializer, Parse: typeof Parser, stringifyMode: boolean) {
        WorkerBody.Serializer = Serialize;
        WorkerBody.Parser = Parse;
        this._serializer = new WorkerBody.Serializer();
        this._parser = new WorkerBody.Parser();
        this._stringifyMode = stringifyMode;
        this.setHandlers();
    }

    protected setHandlers(): void {
        (self as any).onmessage = (message: IMessage<TTask>) => {
            this.onMessage(this._stringifyMode ? JSON.parse(message.data as any) : message.data);
        };
    }

    protected onMessage(message: TTask): void {
        switch (message.type) {
            case MESSAGE_TYPE.ADD_LIBS:
                this.process(() => this.addLibs(message.libs), message.id);
                break;
            case MESSAGE_TYPE.ADD_PROCESSOR:
                this.process(() => this.addProcessor(message), message.id);
                break;
            case MESSAGE_TYPE.WORK:
                this.doWork(message);
                break;
        }
    }

    protected addLibs(libs: Array<string>): void {
        libs.forEach((lib) => (self as any).importScripts(lib));
    }

    protected addProcessor(data: IAddProcessorTask): void {
        const params = this._parser.parse(data.params);
        const Child = this._parser.parse(data.codeData);

        if (WorkerBody.Serializer.isFunction(Child)) {
            this.child = Child(params);
        } else {
            this.child = new Child(params);
        }
    }

    protected process(cb: Function, id: string): void {
        try {
            cb();
            this.send({ id, state: true, body: null });
        } catch (e) {
            this.send({ id, state: false, body: String(e) });
        }
    }

    protected send(data: IResponse<any>): void {
        data.body = this._serializer.serialize(data.body);
        try {
            (self as any).postMessage(this._stringifyMode ? JSON.stringify(data) : data);
        } catch (e) {
            const toSet = {
                id: data.id,
                state: false,
                body: String(e)
            };
            (self as any).postMessage(this._stringifyMode ? JSON.stringify(toSet) : toSet);
        }
    }

    protected doWork(message: IWorkTask): void {
        try {
            const processor = this._parser.parse(message.job);
            const params = this._parser.parse(message.params);
            const result = this.child ? processor(this.child, params) : processor(params);
            if (result && result.then && typeof result.then === 'function') {
                result.then((data: any) => {
                    this.send({ id: message.id, state: true, body: data });
                }, (error: any) => {
                    if (error instanceof Error) {
                        error = String(error);
                    }
                    this.send({ id: message.id, state: false, body: error });
                });
            } else {
                this.send({ id: message.id, state: true, body: result });
            }
        } catch (e) {
            this.send({ id: message.id, state: false, body: String(e) });
        }
    }
}