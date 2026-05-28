import { z } from 'zod';

export const BaseResponseSchema = z.object({
  message: z.string(),
});
