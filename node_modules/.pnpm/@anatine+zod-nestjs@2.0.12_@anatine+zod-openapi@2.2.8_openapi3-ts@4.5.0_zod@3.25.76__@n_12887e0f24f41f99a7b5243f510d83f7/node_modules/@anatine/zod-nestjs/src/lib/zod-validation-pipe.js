"use strict";
/**
 * This file was originally taken directly from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/ZodValidationPipe.ts
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const http_errors_1 = require("./http-errors");
let ZodValidationPipe = exports.ZodValidationPipe = class ZodValidationPipe {
    constructor(options) {
        this.errorHttpStatusCode =
            (options === null || options === void 0 ? void 0 : options.errorHttpStatusCode) || common_1.HttpStatus.BAD_REQUEST;
    }
    transform(value, metadata) {
        var _a;
        const zodSchema = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.metatype) === null || _a === void 0 ? void 0 : _a.zodSchema;
        if (zodSchema) {
            const parseResult = zodSchema.safeParse(value);
            if (!parseResult.success) {
                const { error } = parseResult;
                const message = error.errors.map((error) => `${error.path.join('.')}: ${error.message}`);
                throw new http_errors_1.HTTP_ERRORS_BY_CODE[this.errorHttpStatusCode](message);
            }
            return parseResult.data;
        }
        return value;
    }
};
exports.ZodValidationPipe = ZodValidationPipe = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object])
], ZodValidationPipe);
//# sourceMappingURL=zod-validation-pipe.js.map