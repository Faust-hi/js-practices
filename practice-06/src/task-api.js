import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
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

export function isCategory(value) {
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

function validateTaskPayload(payload) {
  if (!payload || typeof payload !== "object" || !isTask(payload.data)) {
    throw invalidResponse("Ответ задачи не соответствует схеме.");
  }
  return payload.data;
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

function dataOptions(signal) {
  return signal === undefined ? undefined : { signal };
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi требует клиента с методом requestJson.");
  }

  async function getTasks(filters = {}, { signal } = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", {
      query,
      ...dataOptions(signal),
    });
    const tasks = validateCollection(payload, isTask, "tasks");
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id, { signal } = {}) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`, dataOptions(signal));
    return validateTaskPayload(payload);
  }

  async function getCategories({ signal } = {}) {
    const payload = await client.requestJson("/categories", dataOptions(signal));
    const categories = validateCollection(payload, isCategory, "categories");
    return categories;
  }

  async function createTask(draft, { signal } = {}) {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
      throw new TypeError("Черновик задачи должен быть обычным объектом.");
    }
    const body = { ...draft };
    delete body.id;
    delete body.completed;
    const payload = await client.requestJson("/tasks", {
      method: "POST",
      body,
      ...dataOptions(signal),
    });
    return validateTaskPayload(payload);
  }

  async function updateTask(id, changes, { signal } = {}) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
      throw new TypeError("Изменения задачи должны быть обычным объектом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: { ...changes },
      ...dataOptions(signal),
    });
    return validateTaskPayload(payload);
  }

  async function setTaskCompleted(id, completed, { signal } = {}) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    if (typeof completed !== "boolean") {
      throw new TypeError("Статус completed должен быть логическим значением.");
    }
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: { completed },
      ...dataOptions(signal),
    });
    return validateTaskPayload(payload);
  }

  async function deleteTask(id, { signal } = {}) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    const result = await client.requestJson(`/tasks/${id}`, {
      method: "DELETE",
      ...dataOptions(signal),
    });
    if (result !== null) {
      throw invalidResponse("Удаление должно возвращать пустой ответ 204.");
    }
    return null;
  }

  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", {
      method: "POST",
      ...dataOptions(signal),
    });
    const data = payload && typeof payload === "object" ? payload.data : null;
    if (!data || typeof data !== "object" || data.reset !== true || !isPositiveSafeInteger(data.total)) {
      throw invalidResponse("Ответ сброса не соответствует контракту.");
    }
    return data;
  }

  async function loadInitialData(filters = {}, { signal } = {}) {
    const query = normalizeFilters(filters);
    const tasksPromise = getTasks(query, { signal });
    const categoriesPromise = getCategories({ signal });
    const [taskResult, categories] = await Promise.all([tasksPromise, categoriesPromise]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
    loadInitialData,
  };
}