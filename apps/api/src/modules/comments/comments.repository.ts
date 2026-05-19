import { prisma } from "../../prisma.js";

export const commentsRepository = {
  listByTask(taskId: string) {
    return prisma.comment.findMany({ where: { taskId }, orderBy: { createdAt: "asc" } });
  },
  create(input: { taskId: string; content: string; author: string }) {
    return prisma.comment.create({ data: input });
  },
  findById(id: string) {
    return prisma.comment.findUnique({ where: { id } });
  },
  delete(id: string) {
    return prisma.comment.delete({ where: { id } });
  },
};
