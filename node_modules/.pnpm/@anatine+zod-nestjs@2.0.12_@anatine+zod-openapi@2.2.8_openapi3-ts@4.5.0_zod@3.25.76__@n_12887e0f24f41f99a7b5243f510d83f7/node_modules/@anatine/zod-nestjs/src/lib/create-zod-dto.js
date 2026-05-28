"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZodDto = void 0;
const zod_openapi_1 = require("@anatine/zod-openapi");
const createZodDto = (zodSchema) => {
    class SchemaHolderClass {
        constructor() {
            this.schema = (0, zod_openapi_1.generateSchema)(zodSchema);
        }
        /** Found from METADATA_FACTORY_NAME
         * in Nestjs swagger module.
         * https://github.com/nestjs/swagger/blob/491b168cbff3003191e55ee96e77e69d8c1deb66/lib/type-helpers/mapped-types.utils.ts
         * METADATA_FACTORY_NAME is defined here as '_OPENAPI_METADATA_FACTORY' here:
         * https://github.com/nestjs/swagger/blob/491b168cbff3003191e55ee96e77e69d8c1deb66/lib/plugin/plugin-constants.ts
         */
        static _OPENAPI_METADATA_FACTORY() {
            const generatedSchema = (0, zod_openapi_1.generateSchema)(zodSchema);
            SchemaHolderClass.convertSchemaObject(generatedSchema);
            return generatedSchema.properties;
        }
        static convertSchemaObject(schemaObject, required) {
            var _a, _b, _c, _d, _e, _f, _g;
            if ('$ref' in schemaObject) {
                return;
            }
            // Recursively convert all sub-schemas
            const subSchemaObjects = [
                ...((_a = schemaObject.allOf) !== null && _a !== void 0 ? _a : []),
                ...((_b = schemaObject.oneOf) !== null && _b !== void 0 ? _b : []),
                ...((_c = schemaObject.anyOf) !== null && _c !== void 0 ? _c : []),
                ...(schemaObject.not ? [schemaObject.not] : []),
                ...(schemaObject.items ? [schemaObject.items] : []),
                ...(typeof schemaObject.additionalProperties === 'object'
                    ? [schemaObject.additionalProperties]
                    : []),
                ...((_d = schemaObject.prefixItems) !== null && _d !== void 0 ? _d : []),
            ];
            for (const subSchemaObject of subSchemaObjects) {
                SchemaHolderClass.convertSchemaObject(subSchemaObject);
            }
            for (const [key, subSchemaObject] of Object.entries((_e = schemaObject.properties) !== null && _e !== void 0 ? _e : {})) {
                SchemaHolderClass.convertSchemaObject(subSchemaObject, (_g = (_f = schemaObject.required) === null || _f === void 0 ? void 0 : _f.includes(key)) !== null && _g !== void 0 ? _g : false);
            }
            /** For some reason the SchemaObject model has everything except for the
             * required field, which is an array.
             * The NestJS swagger module requires this to be a boolean representative
             * of each property.
             * This logic takes the SchemaObject, and turns the required field from an
             * array to a boolean.
             */
            const convertedSchemaObject = schemaObject;
            if (required !== undefined) {
                convertedSchemaObject.required = required;
            }
            // @nestjs/swagger expects OpenAPI 3.0-style schema objects
            // Nullable
            if (Array.isArray(convertedSchemaObject.type)) {
                convertedSchemaObject.nullable =
                    convertedSchemaObject.type.includes('null') || undefined;
                convertedSchemaObject.type =
                    convertedSchemaObject.type.find((item) => item !== 'null') ||
                        'string';
            }
            else if (convertedSchemaObject.type === 'null') {
                convertedSchemaObject.type = 'string'; // There ist no explicit null value in OpenAPI 3.0
                convertedSchemaObject.nullable = true;
            }
            // Array handling (NestJS references 'isArray' boolean)
            if (convertedSchemaObject.type === 'array') {
                convertedSchemaObject.isArray = true;
            }
            // Exclusive minimum and maximum
            const { exclusiveMinimum, exclusiveMaximum } = schemaObject;
            if (exclusiveMinimum !== undefined) {
                convertedSchemaObject.minimum = exclusiveMinimum;
                convertedSchemaObject.exclusiveMinimum = true;
            }
            if (exclusiveMaximum !== undefined) {
                convertedSchemaObject.maximum = exclusiveMaximum;
                convertedSchemaObject.exclusiveMaximum = true;
            }
        }
        static create(input) {
            return this.zodSchema.parse(input);
        }
    }
    SchemaHolderClass.zodSchema = zodSchema;
    return SchemaHolderClass;
};
exports.createZodDto = createZodDto;
//# sourceMappingURL=create-zod-dto.js.map