"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decoratable = exports.PrismaDecorator = void 0;
class PrismaDecorator {
    constructor(input) {
        this.params = [];
        const { name, params, importFrom } = input;
        this.name = name;
        if (params) {
            this.params = Array.isArray(params) ? params : [params];
        }
        this.importFrom = importFrom;
    }
    echo() {
        const content = this.params.reduce((result, param) => {
            if (typeof param === 'object') {
                if (Object.keys(param).length > 0) {
                    result.push(`{${Object.entries(param)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}}`);
                }
            }
            else {
                result.push(param);
            }
            return result;
        }, []);
        return `@${this.name}(${content.join(', ')})`;
    }
    add(param) {
        if (this.params.includes(param)) {
            return;
        }
        this.params.push(param);
    }
}
exports.PrismaDecorator = PrismaDecorator;
class Decoratable {
    constructor(obj) {
        this.decorators = [];
        this.addDecorator = (input) => {
            const { name, param, importFrom } = input;
            const oldIndex = this.decorators.findIndex((v) => v.name === name);
            if (oldIndex > -1) {
                this.decorators[oldIndex].params.push({
                    value: param,
                });
                return;
            }
            const decorator = new PrismaDecorator({
                name: name,
                params: param,
                importFrom: importFrom,
            });
            this.decorators.push(decorator);
            return;
        };
        this.echoDecorators = () => {
            const lines = this.decorators.map((decorator) => decorator.echo());
            return lines.join('\r\n');
        };
        Object.assign(this, obj);
    }
}
exports.Decoratable = Decoratable;
//# sourceMappingURL=decorator.js.map