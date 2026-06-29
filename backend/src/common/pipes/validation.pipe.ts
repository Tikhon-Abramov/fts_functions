import {
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
  Optional,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';


@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(@Optional() private readonly schema?: ZodSchema) { }

  transform(value: any, metadata: ArgumentMetadata) {
    if (!this.schema) {
      return value;
    }

    const normalizedValue =
      metadata.type === 'query' ? this.normalizeKeys(value) : value;

    const result = this.schema.safeParse(normalizedValue);

    if (!result.success) {
      throw new BadRequestException(this.formatErrors(result.error));
    }

    return result.data;
  }

  private normalizeKeys(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in obj) {
      const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      result[camelKey] = obj[key];
    }
    return result;
  }

  private formatErrors(error: ZodError) {
    return error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }
}
