import { z } from "zod";

/**
 * One graded item, matching the worksheet's own printed numbering exactly.
 * This shape maps 1:1 onto the `grading_results` table columns.
 */
export const GradingItemSchema = z.object({
  question_number: z
    .string()
    .describe(
      "The exact question number as printed on the worksheet (e.g. '8', '3(b)'). Never renumber or reorder."
    ),
  sub_question_blank: z
    .string()
    .nullable()
    .describe(
      "The specific blank/sub-part label if this section has multiple blanks (e.g. 'A1', 'A2'). Null if the question has only one part."
    ),
  subject: z
    .string()
    .describe("e.g. 'Mathematics', 'Chinese', 'English'"),
  student_answer: z.string().nullable(),
  correct_answer: z.string().nullable(),
  is_correct: z.boolean(),
  explanation_cantonese: z
    .string()
    .describe(
      "Short, natural, localized Cantonese explanation in Traditional Chinese."
    ),
  topic_tags: z
    .array(z.string())
    .describe("e.g. ['Algebraic Equations'], ['Vocabulary'], ['Tenses']"),
});

export const GradingResponseSchema = z.object({
  items: z.array(GradingItemSchema),
});

export type GradingItem = z.infer<typeof GradingItemSchema>;
export type GradingResponse = z.infer<typeof GradingResponseSchema>;
