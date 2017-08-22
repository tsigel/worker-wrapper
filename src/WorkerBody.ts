class WorkerBody {

    private child: any;

    constructor() {
        this.setHandlers();
    }

    private setHandlers(): void {
        self.onmessage = (message: IWorkerMessage) => {
            switch (message.data.type) {
                case 'initialize':
                    if (message.data.libs && message.data.libs.length) {
                        message.data.libs.forEach(lib => (self as any).importScripts(lib));
                    }
                    this.createWorkerBody(message.data.contentData);
                    break;
                case 'work':
                    this.doWork(message.data);
                    break;
            }
        };
    }

    private doWork(message: IWorkAction): void {
        const processor = eval(`(${message.data.job})`);
        processor(this.child).then((result) => {
            (self as any).postMessage({ id: message.data.id, result });
        }, (error) => {
            (self as any).postMessage({ id: message.data.id, error });
        });
    }

    private createWorkerBody(content: IContentData) {
        const Child = eval(content.template);
        if (content.isSimple) {
            this.child = Child;
        } else {
            this.child = new Child();
        }
    }

}

interface IWorkerMessage {
    data: TPoseMessage;
}

new WorkerBody();