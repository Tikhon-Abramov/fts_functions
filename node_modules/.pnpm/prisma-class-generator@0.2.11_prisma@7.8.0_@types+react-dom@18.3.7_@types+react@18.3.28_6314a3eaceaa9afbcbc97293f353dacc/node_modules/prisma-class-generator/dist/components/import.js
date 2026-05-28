"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaImport = void 0;
const util_1 = require("../util");
const file_1 = require("./file");
class PrismaImport {
    constructor(from, items) {
        this.echo = (alias) => {
            let content = this.items;
            if (alias) {
                content = content.map((item) => `${item} as ${alias}${item}`);
            }
            return `import { ${content.join(',')} } from '${this.from}'`;
        };
        this.from = from;
        this.items = (0, util_1.toArray)(items);
    }
    add(item) {
        if (this.items.includes(item)) {
            return;
        }
        this.items.push(item);
    }
    getReplacePath(classToPath) {
        var _a;
        if (this.from.includes(file_1.PrismaClassFile.TEMP_PREFIX) === false) {
            return null;
        }
        const key = this.from.replace(file_1.PrismaClassFile.TEMP_PREFIX, '');
        return (_a = classToPath[key]) !== null && _a !== void 0 ? _a : null;
    }
}
exports.PrismaImport = PrismaImport;
//# sourceMappingURL=import.js.map