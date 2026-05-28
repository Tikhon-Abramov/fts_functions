import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(@Optional() private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!this.schema) {
      return value;
    }

    const normalizedValue =
      metadata.type === 'query' && value !== null && typeof value === 'object'
        ? this.normalizeKeys(value as Record<string, unknown>)
        : value;

    const result = this.schema.safeParse(normalizedValue);

    if (!result.success) {
      throw new BadRequestException(this.formatErrors(result.error));
    }

    return result.data;
  }

  private normalizeKeys(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      const camelKey = key.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
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
