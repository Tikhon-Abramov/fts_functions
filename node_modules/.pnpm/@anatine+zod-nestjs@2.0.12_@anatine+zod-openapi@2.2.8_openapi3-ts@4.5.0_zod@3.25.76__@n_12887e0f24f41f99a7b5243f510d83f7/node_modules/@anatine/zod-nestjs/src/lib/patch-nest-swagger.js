"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchNestjsSwagger = void 0;
/**
 * This file was copied from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/OpenApi/patchNestjsSwagger.ts
 */
const zod_openapi_1 = require("@anatine/zod-openapi");
const patchNestjsSwagger = (schemaObjectFactoryModule = undefined, openApiVersion = '3.0') => {
    const { SchemaObjectFactory } = (schemaObjectFactoryModule !== null && schemaObjectFactoryModule !== void 0 ? schemaObjectFactoryModule : require('@nestjs/swagger/dist/services/schema-object-factory'));
    const orgExploreModelSchema = SchemaObjectFactory.prototype.exploreModelSchema;
    SchemaObjectFactory.prototype.exploreModelSchema = function (type, schemas, schemaRefsStack = []
    // type: Type<unknown> | Function | any,
    // schemas: Record<string, SchemaObject>,
    // schemaRefsStack: string[] = []
    ) {
        // @ts-expect-error Reported as private, but since we are patching, we will be able to reach it
        if (this.isLazyTypeFunc(type)) {
            // eslint-disable-next-line @typescript-eslint/ban-types
            type = type();
        }
        if (!type.zodSchema) {
            return orgExploreModelSchema.call(this, type, schemas, schemaRefsStack);
        }
        schemas[type.name] = (0, zod_openapi_1.generateSchema)(type.zodSchema, false, openApiVersion);
        return type.name;
    };
};
exports.patchNestjsSwagger = patchNestjsSwagger;
//# sourceMappingURL=patch-nest-swagger.js.map