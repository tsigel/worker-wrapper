import { IContentData, IWorkAction, TMessage } from './interface';


export const enum MESSAGE_TYPE {
    INITIALIZE,
    WORK
}

export class WorkerBody {

    private child: any;

    constructor() {
        this.setHandlers();
    }

    protected setHandlers(): void {
        (self as any).onmessage = (message: TMessage) => {
            this.onMessage(message);
        };
    }

    protected onMessage(message: TMessage): void {
        switch (message.data.type) {
            case MESSAGE_TYPE.INITIALIZE:
                const url = message.data.url;
                if (message.data.libs && message.data.libs.length) {
                    message.data.libs.forEach(lib => (self as any).importScripts(url + lib));
                }
                this.createWorkerBody(message.data.contentData);
                break;
            case MESSAGE_TYPE.WORK:
                this.doWork(message.data);
                break;
        }
    }

    protected send(data: any): void {
        (self as any).postMessage(data);
    }

    protected doWork(message: IWorkAction): void {
        try {
            const processor = eval(`(${message.data.job})`);
            processor(this.child).then((result) => {
                this.send({ id: message.data.id, result });
            }, (error) => {
                this.send({ id: message.data.id, error });
            });
        } catch (e) {
            this.send({id: message.data.id, e});
        }
    }

    protected createWorkerBody(content: IContentData) {
        try {
            const Child = eval(content.template);
            if (content.isSimple) {
                this.child = Child;
            } else {
                this.child = new Child();
            }
        } catch (e) {
            this.send({type: 'ERROR', error: e});
        }
    }

}
