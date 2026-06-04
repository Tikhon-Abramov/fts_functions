import z from 'zod';

import { ERROR_MESSAGE } from '@common/strings';

export const booleanFromString = z
  .union([
    z.boolean(),
    z.string().transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      throw new Error(ERROR_MESSAGE.EXPECTED_BOOLEAN);
    }),
  ])
  .optional();
