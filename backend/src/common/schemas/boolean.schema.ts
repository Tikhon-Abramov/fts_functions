import z from "zod";

export const booleanFromString = z
  .union([
    z.boolean(),
    z.string().transform(val => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      throw new Error('Ожидался тип - булево значение (true/false)');
    })
  ])
  .optional();