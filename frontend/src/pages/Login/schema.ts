import z from "zod";


export const LoginSchema = z.object({
  username: z
    .string()
    .nonempty('Обязательное поле')
    .max(50, 'Логин должен содержать не более 50 символов')
    .transform(value => value.replace(/\s+/g, ' ').trim()),

  password: z
    .string()
    .nonempty('Обязательное поле')
    .max(128, 'Пароль должен содержать не более 128 символов')
    .transform(value => value.replace(/\s+/g, ' ').trim()),
});

export type LoginDto = z.infer<typeof LoginSchema>;
