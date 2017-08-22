interface IOptions {
    workerPath?: string;
    libs?: Array<string>;
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

interface IInitializeMessage {
    type: 'initialize';
    contentData: IContentData;
    libs: Array<string>;
}

interface IWorkAction {
    type: 'work',
    data: {
        id: number;
        job: string;
    }
}

interface IContentData {
    isSimple: boolean;
    template: string;
}

interface IDefer<T> {
    resolve: (data: T) => void;
    reject: (data: any) => void;
}

type TPoseMessage = IInitializeMessage | IWorkAction;

type TTypeList = 'string' | 'number' | 'function' | 'object' | 'boolean' | 'undefined'