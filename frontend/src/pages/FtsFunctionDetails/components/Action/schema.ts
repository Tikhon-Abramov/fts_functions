import { number, z } from "zod";


export const GeneralInfoActionsFormSchema = z.object({
  actionsInput: z.string(),
  actionsOutput: z.string(),
});

export const ActionFormSchema = z.object({
  ftsFunctionDetailId: z.number(),
  statusId: z.number(),
  priorityActionId: number().optional(),
  characterActionId: z.number().optional(),
  personPerformingActionId: z.number().optional(),
  // Обязательность проверяется в компоненте только при personPerformingActionCode === "OTHER_PERSON".
  otherPersonPerformingAction: z
    .string()
    .trim()
    .max(4096, 'Иное лицо, выполняющее действие не может превышать 4096 символов')
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Обязательное поле")
    .max(4096, 'Описание не может превышать 4096 символов'),
});

export const ActionsFeedbackFormSchema = z.object({
  feedbackQualityMetricsId: z.number(),
  ftsMethodologyStatusId: z.number(),
  feedbackSourceIds: z.array(z.number()).min(1, "Обязательное поле"),
  problemDescription: z
    .string()
    .trim()
    .min(1, "Обязательное поле")
    .max(4096, 'Описание проблемы не может превышать 4096 символов'),
  initiatorRequisites: z
    .string()
    .trim()
    .min(1, "Обязательное поле")
    .max(4096, 'Реквизиты автора инициатора не могут превышать 4096 символов'),
  initiatorAcceptance: z
    .string()
    .trim()
    .min(1, "Обязательное поле")
    .max(4096, 'Акцепт автора не может превышать 4096 символов'),
  deadline: z.string()
    .optional()
    .refine(val => !val || !isNaN(Date.parse(val)), {
      message: 'Некорректная дата',
    }),
});

export type GeneralInfoActionsFormData = z.infer<typeof GeneralInfoActionsFormSchema>;
export type ActionFormData = z.infer<typeof ActionFormSchema>;
export type ActionsFeedbackFormData = z.infer<typeof ActionsFeedbackFormSchema>;
