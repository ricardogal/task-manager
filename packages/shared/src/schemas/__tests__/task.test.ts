import { describe, expect, it } from "vitest";
import {
  taskPrioritySchema,
  taskStatusSchema,
  taskSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  PRIORITY_LABELS_PT,
  STATUS_LABELS_PT,
} from "../task";

describe("taskPrioritySchema", () => {
  it("aceita LOW/MEDIUM/HIGH", () => {
    expect(taskPrioritySchema.safeParse("LOW").success).toBe(true);
    expect(taskPrioritySchema.safeParse("MEDIUM").success).toBe(true);
    expect(taskPrioritySchema.safeParse("HIGH").success).toBe(true);
  });
  it("rejeita outros", () => {
    expect(taskPrioritySchema.safeParse("URGENT").success).toBe(false);
  });
});

describe("taskStatusSchema", () => {
  it("aceita TODO/IN_PROGRESS/DONE", () => {
    expect(taskStatusSchema.safeParse("TODO").success).toBe(true);
    expect(taskStatusSchema.safeParse("IN_PROGRESS").success).toBe(true);
    expect(taskStatusSchema.safeParse("DONE").success).toBe(true);
  });
});

describe("createTaskSchema", () => {
  it("aceita input mínimo", () => {
    expect(
      createTaskSchema.safeParse({
        title: "Implementar feature X",
        priority: "HIGH",
        categoryId: "c1",
      }).success,
    ).toBe(true);
  });

  it("rejeita title vazio", () => {
    expect(
      createTaskSchema.safeParse({ title: "", priority: "HIGH", categoryId: "c1" }).success,
    ).toBe(false);
  });

  it("aceita dueDate como ISO string", () => {
    const parsed = createTaskSchema.safeParse({
      title: "X",
      priority: "LOW",
      categoryId: "c1",
      dueDate: "2026-12-31T00:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejeita dueDate inválida", () => {
    expect(
      createTaskSchema.safeParse({
        title: "X",
        priority: "LOW",
        categoryId: "c1",
        dueDate: "not-a-date",
      }).success,
    ).toBe(false);
  });
});

describe("updateTaskStatusSchema", () => {
  it("aceita status válido", () => {
    expect(updateTaskStatusSchema.safeParse({ status: "DONE" }).success).toBe(true);
  });
});

describe("taskSchema", () => {
  it("aceita task completa", () => {
    expect(
      taskSchema.safeParse({
        id: "t1",
        title: "Implementar X",
        description: "Detalhes",
        priority: "HIGH",
        status: "IN_PROGRESS",
        dueDate: new Date(),
        userId: "u1",
        categoryId: "c1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).success,
    ).toBe(true);
  });
});

describe("updateTaskSchema (partial)", () => {
  it("aceita apenas alguns campos", () => {
    expect(updateTaskSchema.safeParse({ title: "Novo título" }).success).toBe(true);
  });
});

describe("labels pt-BR", () => {
  it("traduz prioridade", () => {
    expect(PRIORITY_LABELS_PT.HIGH).toBe("Alta");
    expect(PRIORITY_LABELS_PT.MEDIUM).toBe("Média");
    expect(PRIORITY_LABELS_PT.LOW).toBe("Baixa");
  });
  it("traduz status", () => {
    expect(STATUS_LABELS_PT.TODO).toBe("A Fazer");
    expect(STATUS_LABELS_PT.IN_PROGRESS).toBe("Em Progresso");
    expect(STATUS_LABELS_PT.DONE).toBe("Concluída");
  });
});
