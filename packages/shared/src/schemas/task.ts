import { z } from "zod";

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  dueDate: z.date().nullable().optional(),
  userId: z.string().min(1),
  categoryId: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  description: z.string().max(2000).optional(),
  priority: taskPrioritySchema,
  categoryId: z.string().min(1, "Categoria obrigatória"),
  dueDate: z.string().datetime({ message: "dueDate deve ser ISO 8601" }).optional().nullable(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: taskStatusSchema.optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
});
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const PRIORITY_LABELS_PT: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

export const STATUS_LABELS_PT: Record<TaskStatus, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Progresso",
  DONE: "Concluída",
};
