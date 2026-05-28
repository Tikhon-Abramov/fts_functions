import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string(),
});

export class IdParamsDto extends createZodDto(IdParamSchema) {}
