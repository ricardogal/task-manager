import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  icon: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Icon deve usar kebab-case (apenas a-z, 0-9, -)"),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategorySchema = categorySchema.omit({ id: true });
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
