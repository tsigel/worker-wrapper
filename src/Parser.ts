import { Ijsonify, IjsonifyClass, IjsonifyPathInstance, TjsonifyPath } from './interface';
import { DATA_TYPES } from './utils';


export class Parser {

    private _classes: IHash<any>;

    constructor() {
        this._classes = Object.create(null);
    }

    public parse(data: Ijsonify): any {
        data.classes.forEach(this._addClassData, this);

        if (!data.data && data.paths.length) {
            data.data = this._getPathData(data.paths.shift());
        }

        this._fill(data.data, data.paths);

        return data.data;
    }

    private _fill(data: any, paths: Array<TjsonifyPath>): void {
        paths.forEach((path) => {
            this._set(data, path.path, this._getPathData(path));
        });
    }

    private _set(target, path, data): void {
        let tmp = target;
        path.split('.').forEach((part, index, list) => {
            if (index === list.length - 1) {
                tmp[part] = data;
            } else {
                if (!tmp[part]) {
                    tmp[part] = Object.create(null);
                }
                tmp = tmp[part];
            }
        });
    }

    private _getPathData(path: TjsonifyPath): any {
        switch (path.type) {
            case DATA_TYPES.CLASS:
                return this._classes[path.name];
            case DATA_TYPES.FUNCTION:
                return this._parseFunc(path.value);
            case DATA_TYPES.INSTANCE:
                return this._parseInstance(path);
        }
    }

    private _parseInstance(path: IjsonifyPathInstance): any {
        const instance = Object.create(this._classes[path.name].prototype);
        Object.keys(path.value || {}).forEach((key) => {
            instance[key] = path.value[key];
        });
        return instance;
    }

    private _addClassData(classData: IjsonifyClass) {
        if (!this._classes[classData.name]) {
            this._classes[classData.name] = this._parseFunc(classData.value);
            self[classData.name] = this._classes[classData.name];
        }
    }

    private _parseFunc(template: string): any {
        return eval(template);
    }

}