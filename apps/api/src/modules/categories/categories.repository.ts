import { prisma } from "../../prisma.js";

export const categoriesRepository = {
  async list() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },
  async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },
};
