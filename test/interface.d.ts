import { WorkerWrapper as Worker } from '../src/WorkerWrapper';
import { WorkerBody as Body } from '../src/WorkerBody';


declare module workerWrapper {
    const WorkerWrapper: typeof Worker;
    const WorkerBody: typeof Body;
}
