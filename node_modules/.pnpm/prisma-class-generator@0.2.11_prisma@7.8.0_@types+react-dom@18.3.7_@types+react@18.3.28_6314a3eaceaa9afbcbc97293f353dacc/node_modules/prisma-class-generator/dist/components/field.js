"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaField = void 0;
const field_1 = require("../templates/field");
const decorator_1 = require("../components/decorator");
class PrismaField extends decorator_1.Decoratable {
    constructor(obj) {
        super(obj);
        this.echo = () => {
            return field_1.FIELD_TEMPLATE.replace('#!{NAME}', this.name)
                .replace('#!{TYPE}', this.type)
                .replace('#!{DECORATORS}', this.echoDecorators());
        };
    }
}
exports.PrismaField = PrismaField;
//# sourceMappingURL=field.js.map