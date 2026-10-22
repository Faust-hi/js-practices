// Собственные проверки ПР6 (вариант 8): доп. задание — автосброс редактирования.
// Реальная сеть и DOM не используются. Запуск: node checks/own.checks.js
import assert from "node:assert/strict";
import { createAppController } from "../src/app-controller.js";

let passed = 0;
let failed = 0;

async function check(name, action) {
  try {
    await action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.stack ?? error.message);
  }
}

function task(overrides = {}) {
  return {
    id: 4,
    title: "Подготовить модель задач",
    completed: false,
    priority: "high",
    categoryId: 2,
    ...overrides,
  };
}

function categories() {
  return [
    { id: 1, name: "Учёба" },
    { id: 2, name: "Проект" },
  ];
}

function createViewDouble() {
  return {
    states: [], tasks: [], categories: [], totals: [], formTasks: [], errors: [], pending: [], notices: [],
    setListState(...args) { this.states.push(args); },
    setTasks(...args) { this.tasks.push(args); },
    setCategories(value) { this.categories.push(value); },
    setTotal(value) { this.totals.push(value); },
    setFormTask(value) { this.formTasks.push(value); },
    showFormErrors(value) { this.errors.push(value); },
    setMutationPending(value) { this.pending.push(value); },
    notify(...args) { this.notices.push(args); },
  };
}

function createApiDouble(overrides = {}) {
  const list = [task()];
  const cats = categories();
  return {
    async loadInitialData() { return { tasks: list, categories: cats, meta: { total: 1, filters: {} } }; },
    async getTasks() { return { tasks: list, meta: { total: 1, filters: {} } }; },
    async createTask(draft) { return task({ id: 35, ...draft }); },
    async updateTask(id, changes) { return task({ id, ...changes }); },
    async setTaskCompleted(id, completed) { return task({ id, completed }); },
    async deleteTask() { return null; },
    async resetDemoData() { return { reset: true, total: 12 }; },
    ...overrides,
  };
}

await check("С1. задача исчезла из выборки — редактирование отменено автоматически", async () => {
  const view = createViewDouble();
  const api = createApiDouble({
    async getTasks() { return { tasks: [], meta: { total: 0, filters: { q: "нет такой" } } }; },
  });
  const controller = createAppController({ api, view });
  await controller.start({});
  controller.beginEdit(4);
  assert.equal(view.formTasks.at(-1).id, 4);
  await controller.applyFilters({ q: "нет такой" });
  assert.equal(view.formTasks.at(-1), null);
  assert.match(view.notices.at(-1)[0], /отменено/i);
  assert.equal(view.states.at(-1)[0], "empty");
});

await check("С2. задача осталась в выборке — редактирование продолжается", async () => {
  const view = createViewDouble();
  const controller = createAppController({ api: createApiDouble(), view });
  await controller.start({});
  controller.beginEdit(4);
  await controller.applyFilters({ priority: "high" });
  assert.equal(view.formTasks.at(-1).id, 4);
  const cancelNotices = view.notices.filter(([message]) => /отменено/i.test(message));
  assert.equal(cancelNotices.length, 0);
});

await check("С3. после автосброса submit создаёт новую задачу, а не обновляет", async () => {
  const view = createViewDouble();
  const calls = [];
  const api = createApiDouble({
    async getTasks() { return { tasks: [], meta: { total: 0, filters: { q: "нет такой" } } }; },
    async createTask(draft) { calls.push(["create", draft]); return task({ id: 35, ...draft }); },
    async updateTask(id, changes) { calls.push(["update", id, changes]); return task({ id, ...changes }); },
  });
  const controller = createAppController({ api, view });
  await controller.start({});
  controller.beginEdit(4);
  await controller.applyFilters({ q: "нет такой" });
  await controller.submit({ title: "Новая после сброса", priority: "low", categoryId: "1" });
  assert.deepEqual(calls, [["create", { title: "Новая после сброса", priority: "low", categoryId: 1 }]]);
});

console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed > 0) process.exitCode = 1;