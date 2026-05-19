import { commentsRepository } from "./comments.repository.js";
import { tasksRepository } from "../tasks/tasks.repository.js";
import { authRepository } from "../auth/auth.repository.js";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";

export const commentsService = {
  async listByTask(userId: string, taskId: string) {
    const task = await tasksRepository.findByIdForUser(taskId, userId);
    if (!task) throw new NotFoundError("Tarefa");
    return commentsRepository.listByTask(taskId);
  },

  async create(userId: string, taskId: string, content: string) {
    const task = await tasksRepository.findByIdForUser(taskId, userId);
    if (!task) throw new NotFoundError("Tarefa");
    const user = await authRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuário");
    return commentsRepository.create({ taskId, content, author: user.name });
  },

  async delete(userId: string, commentId: string) {
    const c = await commentsRepository.findById(commentId);
    if (!c) throw new NotFoundError("Comentário");
    const task = await tasksRepository.findByIdForUser(c.taskId, userId);
    if (!task) throw new ForbiddenError();
    await commentsRepository.delete(commentId);
  },
};
