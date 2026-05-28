"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClass = void 0;
const change_case_1 = require("change-case");
const path = __importStar(require("path"));
const file_1 = require("./file");
const decorator_1 = require("./decorator");
const class_1 = require("../templates/class");
class PrismaClass extends decorator_1.Decoratable {
    constructor() {
        super(...arguments);
        this.echo = () => {
            const fieldContent = this.fields.map((_field) => _field.echo());
            return class_1.CLASS_TEMPLATE.replace('#!{DECORATORS}', this.echoDecorators())
                .replace('#!{NAME}', `${this.name}`)
                .replace('#!{FIELDS}', fieldContent.join('\r\n'));
        };
        this.reExportPrefixed = (prefix) => {
            return `export class ${this.name} extends ${prefix}${this.name} {}`;
        };
    }
    toFileClass(output) {
        const prismaClassFile = new file_1.PrismaClassFile(this);
        prismaClassFile.dir = path.resolve(output);
        prismaClassFile.filename = `${(0, change_case_1.snakeCase)(this.name)}.ts`;
        prismaClassFile.resolveImports();
        return prismaClassFile;
    }
}
exports.PrismaClass = PrismaClass;
//# sourceMappingURL=class.js.map