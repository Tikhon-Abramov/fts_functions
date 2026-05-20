import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  statusCode: z.number(),
  code: z.string(),
  params: z.record(z.any()).optional(),
  message: z.union([z.string(), z.array(z.string()), z.array(z.any())]),
  timestamp: z.string().datetime(),
});

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
