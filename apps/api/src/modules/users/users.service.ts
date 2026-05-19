import { authRepository } from "../auth/auth.repository.js";
import { NotFoundError } from "../../lib/errors.js";

export const usersService = {
  async getById(id: string) {
    const user = await authRepository.findById(id);
    if (!user) throw new NotFoundError("Usuário");
    return user;
  },
};
