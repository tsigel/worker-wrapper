import { IContent, TTypeList } from './interface';


export function stringify(child: any): { template: string; isSimple: boolean } {

    if (typeof child !== 'function') {
        throw new Error('Wrong params!');
    }

    let template = '(function () {\n';

    if (isSimple(child)) {
        template += `   return ${String(child)}})();`;
        return { template, isSimple: true };
    }

    getParentList(child).forEach((item, i, list) => {

        const name = item.name || 'Class';
        const _super = list[i - 1];

        let Constructor = String(item) + ';';

        if (Constructor.indexOf(`class ${name}`) === 0) {
            template += Constructor;
            return null;
        }

        template += `   var ${name} = ${processSuper(Constructor, _super, false)}` + '\n';
        if (_super) {
            template += `   ${name}.prototype = new ${_super.name}();` + '\n';
            template += `   ${name}.prototype.constructor = ${name};` + '\n';
        }

        getContent(item.prototype, true)
            .concat(getContent(item, false))
            .forEach((content) => {
                const value = processSuper(content.value, _super, content.isPrototype);
                if (content.isPrototype) {
                    template += `   ${name}.prototype.${content.name} = ${value};` + '\n';
                } else {
                    template += `   ${name}.${content.name} = ${value};` + '\n';
                }
            });
    });

    template += `   return ${child.name};\n})()` + '\n';

    return { template, isSimple: false };
}

export function isSimple(child: any): boolean {
    return Object.getOwnPropertyNames(child.prototype).length === 1 && child.prototype.constructor === child;
}

export function getContent(content, isPrototype: boolean): Array<IContent> {
    return Object.keys(content || {})
        .filter((name) => name !== 'constructor')
        .map((name) => {
            const item = content[name];
            const type = typeof item as TTypeList;
            let value: string;

            switch (type) {
                case 'string':
                    value = item;
                    break;
                case 'object':
                    try {
                        value = JSON.stringify(item);
                    } catch (e) {
                        throw new Error('Stringify error!');
                    }
                    break;
                default:
                    value = String(item);
            }

            return { name, type, value, isPrototype };
        });
}

export function getParentList(child): Array<any> {
    const result = [child];
    let tmp = child;
    let item = Object.getPrototypeOf(tmp);

    while (item.prototype) {
        result.push(item);
        tmp = item;
        item = Object.getPrototypeOf(tmp);
    }

    return result.reverse();
}

export function processSuper(content: string, parent: any, isPrototype: boolean): string {
    const reg = /\b(_super)\b/g;
    return content.replace(reg, function () {
        if (isPrototype) {
            return `${parent.name}.prototype`;
        } else {
            return parent.name;
        }
    })
}