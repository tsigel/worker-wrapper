import { IAddProcessorTask, IMessage, IResponse, IWorkTask, TTask } from './interface';


export const enum MESSAGE_TYPE {
    ADD_LIBS,
    ADD_PROCESSOR,
    WORK
}

export class WorkerBody {

    private child: any;

    constructor() {
        this.setHandlers();
    }

    protected setHandlers(): void {
        (self as any).onmessage = (message: IMessage<TTask>) => {
            this.onMessage(message.data);
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
        libs.forEach((lib) => self.importScripts(lib));
    }

    protected addProcessor(data: IAddProcessorTask): void {
        const Child = eval(data.codeData.template);
        if (data.codeData.isSimple) {
            this.child = Child(data.params);
        } else {
            this.child = new Child(data.params);
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
        try {
            (self as any).postMessage(data);
        } catch (e) {
            debugger;
        }
    }

    protected doWork(message: IWorkTask): void {
        try {
            const processor = eval(message.job);
            const result = this.child ? processor(this.child, message.params) : processor(message.params);
            if (result && result.then && typeof result.then === 'function') {
                result.then((data) => {
                    this.send({ id: message.id, state: true, body: data });
                }, (error) => {
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
