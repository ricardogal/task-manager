import { prisma } from "../../prisma.js";
import type { Prisma, Status } from "@prisma/client";

export const tasksRepository = {
  async create(input: {
    userId: string;
    title: string;
    description: string;
    priority: Prisma.TaskCreateInput["priority"];
    categoryId: string;
    dueDate: Date | null;
  }) {
    return prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
        user: { connect: { id: input.userId } },
        category: { connect: { id: input.categoryId } },
      },
      include: { category: true },
    });
  },

  async listByUser(
    userId: string,
    filters: {
      status?: Status;
      priority?: Prisma.TaskCreateInput["priority"];
      categoryId?: string;
    } = {},
  ) {
    return prisma.task.findMany({
      where: { userId, ...filters },
      include: { category: true },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  },

  async findByIdForUser(id: string, userId: string) {
    return prisma.task.findFirst({
      where: { id, userId },
      include: { category: true, comments: { orderBy: { createdAt: "asc" } } },
    });
  },

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({ where: { id }, data, include: { category: true } });
  },

  async updateStatus(id: string, status: Status) {
    return prisma.task.update({ where: { id }, data: { status }, include: { category: true } });
  },

  async delete(id: string) {
    await prisma.task.delete({ where: { id } });
  },
};
