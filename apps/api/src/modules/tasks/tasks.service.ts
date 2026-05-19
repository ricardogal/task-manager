import { tasksRepository } from "./tasks.repository.js";
import { categoriesRepository } from "../categories/categories.repository.js";
import { NotFoundError } from "../../lib/errors.js";
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from "@taskboard/shared";

function toDate(s?: string | null): Date | null {
  return s ? new Date(s) : null;
}

export const tasksService = {
  async list(
    userId: string,
    filters: { status?: TaskStatus; priority?: string; categoryId?: string },
  ) {
    return tasksRepository.listByUser(userId, filters as never);
  },

  async getById(userId: string, id: string) {
    const task = await tasksRepository.findByIdForUser(id, userId);
    if (!task) throw new NotFoundError("Tarefa");
    return task;
  },

  async create(userId: string, input: CreateTaskInput) {
    const cat = await categoriesRepository.findById(input.categoryId);
    if (!cat) throw new NotFoundError("Categoria");
    return tasksRepository.create({
      userId,
      title: input.title,
      description: input.description ?? "",
      priority: input.priority,
      categoryId: input.categoryId,
      dueDate: toDate(input.dueDate),
    });
  },

  async update(userId: string, id: string, input: UpdateTaskInput) {
    const existing = await tasksRepository.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError("Tarefa");

    if (input.categoryId && input.categoryId !== existing.categoryId) {
      const cat = await categoriesRepository.findById(input.categoryId);
      if (!cat) throw new NotFoundError("Categoria");
    }

    return tasksRepository.update(id, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.categoryId !== undefined && { category: { connect: { id: input.categoryId } } }),
      ...(input.dueDate !== undefined && { dueDate: toDate(input.dueDate) }),
      ...(input.status !== undefined && { status: input.status }),
    });
  },

  async updateStatus(userId: string, id: string, status: TaskStatus) {
    const existing = await tasksRepository.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError("Tarefa");
    return tasksRepository.updateStatus(id, status);
  },

  async delete(userId: string, id: string) {
    const existing = await tasksRepository.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError("Tarefa");
    await tasksRepository.delete(id);
  },
};
