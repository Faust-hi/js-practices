// Собственные проверки ПР5 (вариант 8). Требуется запущенный API: npm start.
// Запуск: node checks/own.checks.js
import assert from "node:assert/strict";
import { ApiError, buildUrl, createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";

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

const client = createApiClient({ baseUrl: "http://127.0.0.1:5505/api", timeoutMs: 2000 });
const api = createTaskApi(client);

// 1. Собственная комбинация query-параметров.
await check("С1. фильтры categoryId=1 и priority=low дают только задачу 7", async () => {
  const result = await api.getTasks({ categoryId: 1, priority: "low" });
  assert.deepEqual(result.tasks.map((task) => task.id), [7]);
  assert.equal(result.meta.total, 1);
});

// 2. Дополнительный ошибочный HTTP-сценарий.
await check("С2. completed=yes даёт HTTP 400 INVALID_QUERY", async () => {
  let caught;
  try {
    await client.requestJson("/tasks", { query: { completed: "yes" } });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ApiError);
  assert.equal(caught.kind, "http");
  assert.equal(caught.status, 400);
  assert.equal(caught.code, "INVALID_QUERY");
});

// 3. Граница тайм-аута.
await check("С3. /debug/delay 150 мс при timeoutMs 20 даёт kind timeout", async () => {
  let caught;
  try {
    await client.requestJson("/debug/delay", { query: { ms: 150 }, timeoutMs: 20 });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ApiError);
  assert.equal(caught.kind, "timeout");
});

// 4. Доп. задание А: успех обоих запросов.
await check("С4. allSettled: оба запроса успешны — обе части ok", async () => {
  const result = await api.loadInitialDataSafe({ completed: false, priority: "high", categoryId: 2 });
  assert.equal(result.tasks.ok, true);
  assert.deepEqual(result.tasks.value.map((task) => task.id), [4, 34]);
  assert.equal(result.categories.ok, true);
  assert.deepEqual(result.categories.value.map((category) => category.id), [1, 2, 3]);
});

// 5. Доп. задание А: отказ задач при доступных категориях.
await check("С5. allSettled: отказ задач не теряет категории", async () => {
  const source = new ApiError("Нет связи.", { kind: "network" });
  const brokenApi = createTaskApi({
    requestJson(path) {
      if (path === "/tasks") return Promise.reject(source);
      return Promise.resolve({ data: [{ id: 1, name: "Учёба" }], meta: { total: 1 } });
    },
  });
  const result = await brokenApi.loadInitialDataSafe({});
  assert.equal(result.tasks.ok, false);
  assert.equal(result.tasks.error, source);
  assert.equal(result.categories.ok, true);
  assert.deepEqual(result.categories.value.map((category) => category.id), [1]);
});

// 6. Доп. задание А: отказ категорий при доступных задачах.
await check("С6. allSettled: отказ категорий не теряет задачи", async () => {
  const source = new ApiError("Нет связи.", { kind: "network" });
  const brokenApi = createTaskApi({
    requestJson(path) {
      if (path === "/categories") return Promise.reject(source);
      return Promise.resolve({
        data: [{
          id: 4,
          title: "Подготовить модель задач",
          completed: false,
          priority: "high",
          categoryId: 2,
        }],
        meta: { total: 1, filters: {} },
      });
    },
  });
  const result = await brokenApi.loadInitialDataSafe({});
  assert.equal(result.categories.ok, false);
  assert.equal(result.categories.error, source);
  assert.equal(result.tasks.ok, true);
  assert.deepEqual(result.tasks.value.map((task) => task.id), [4]);
});

// 7. Доп. задание А: отказ обоих запросов.
await check("С7. allSettled: отказ обоих запросов виден в обеих частях", async () => {
  const tasksError = new ApiError("Нет связи.", { kind: "network" });
  const categoriesError = new ApiError("Нет связи.", { kind: "timeout" });
  const brokenApi = createTaskApi({
    requestJson(path) {
      return path === "/tasks"
        ? Promise.reject(tasksError)
        : Promise.reject(categoriesError);
    },
  });
  const result = await brokenApi.loadInitialDataSafe({});
  assert.equal(result.tasks.ok, false);
  assert.equal(result.tasks.error, tasksError);
  assert.equal(result.categories.ok, false);
  assert.equal(result.categories.error, categoriesError);
});

console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed > 0) process.exitCode = 1;