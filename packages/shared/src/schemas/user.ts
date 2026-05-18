import { z } from "zod";

export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  passwordHash: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const publicUserSchema = userSchema.omit({ passwordHash: true });
export type PublicUser = z.infer<typeof publicUserSchema>;
