import { z } from "zod";

export const commentSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  content: z.string().min(1).max(1000),
  author: z.string().min(1),
  createdAt: z.date(),
});
export type Comment = z.infer<typeof commentSchema>;

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comentário não pode ser vazio").max(1000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
