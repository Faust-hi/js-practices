import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Разрешены только completed, priority, categoryId и q. Логическое false
// сохраняется: отбрасывать его проверкой if (value) нельзя.
function normalizeFilters(filters) {
  if (filters === undefined) return {};
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть обычным объектом.");
  }
  const normalized = {};
  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) {
      throw new TypeError(`Неизвестный фильтр: ${name}.`);
    }
    if (value === undefined) continue;
    if (name === "completed") {
      if (typeof value !== "boolean") {
        throw new TypeError("Фильтр completed должен быть логическим значением.");
      }
      normalized.completed = value;
    } else if (name === "priority") {
      if (!ALLOWED_PRIORITIES.has(value)) {
        throw new TypeError("Фильтр priority должен быть low, medium или high.");
      }
      normalized.priority = value;
    } else if (name === "categoryId") {
      if (!isPositiveSafeInteger(value)) {
        throw new TypeError("Фильтр categoryId должен быть положительным целым числом.");
      }
      normalized.categoryId = value;
    } else if (name === "q") {
      if (typeof value !== "string" || value.trim().length > 100) {
        throw new TypeError("Фильтр q должен быть строкой до 100 символов.");
      }
      normalized.q = value.trim();
    }
  }
  return normalized;
}

function hasUniqueIds(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value.id)) return false;
    seen.add(value.id);
  }
  return true;
}

function validateCollection(payload, isItem, label) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
    throw invalidResponse(`Поле data коллекции «${label}» должно быть массивом.`);
  }
  const items = payload.data;
  if (!items.every(isItem)) {
    throw invalidResponse(`Коллекция «${label}» содержит запись неверной схемы.`);
  }
  if (!hasUniqueIds(items)) {
    throw invalidResponse(`Коллекция «${label}» содержит повторяющиеся id.`);
  }
  if (!payload.meta || typeof payload.meta !== "object" || payload.meta.total !== items.length) {
    throw invalidResponse(`meta.total коллекции «${label}» не совпадает с длиной data.`);
  }
  return items;
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
// loadInitialDataSafe(filters) -> частичный результат (доп. задание А)
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi требует клиента с методом requestJson.");
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });
    const tasks = validateCollection(payload, isTask, "tasks");
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`);
    if (!payload || typeof payload !== "object" || !isTask(payload.data)) {
      throw invalidResponse("Ответ задачи не соответствует схеме.");
    }
    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    const categories = validateCollection(payload, isCategory, "categories");
    return categories;
  }

  async function loadInitialData(filters = {}) {
    const query = normalizeFilters(filters);
    const tasksPromise = getTasks(query);
    const categoriesPromise = getCategories();
    const [taskResult, categories] = await Promise.all([tasksPromise, categoriesPromise]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  // Доп. задание А: частичный результат через Promise.allSettled.
  // Оба запроса стартуют до ожидания; отказ одного не теряет результат другого.
  // Контракт: { tasks: { ok, value?, meta?, error? }, categories: { ok, value?, error? } }.
  async function loadInitialDataSafe(filters = {}) {
    const query = normalizeFilters(filters);
    const tasksPromise = getTasks(query);
    const categoriesPromise = getCategories();
    const [tasksResult, categoriesResult] = await Promise.allSettled([
      tasksPromise,
      categoriesPromise,
    ]);
    return {
      tasks: tasksResult.status === "fulfilled"
        ? { ok: true, value: tasksResult.value.tasks, meta: tasksResult.value.meta }
        : { ok: false, error: tasksResult.reason },
      categories: categoriesResult.status === "fulfilled"
        ? { ok: true, value: categoriesResult.value }
        : { ok: false, error: categoriesResult.reason },
    };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData, loadInitialDataSafe };
}