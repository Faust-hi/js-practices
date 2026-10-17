export const STORAGE_VERSION = 1;

// Все функции принимают объект storage явно, чтобы их можно было проверить
// без обращения к глобальному window.localStorage.

function isValidId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isValidTask(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  if (!isValidId(value.id)) return false;
  if (typeof value.title !== "string") return false;
  const title = value.title.trim();
  if (title.length < 1 || title.length > 100) return false;
  if (value.completed !== true && value.completed !== false) return false;
  if (value.priority !== "low" && value.priority !== "medium" && value.priority !== "high") {
    return false;
  }
  return true;
}

function copyTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

function fallbackResult(fallbackTasks, error) {
  return { ok: false, source: "fallback", tasks: copyTasks(fallbackTasks), error };
}

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const seenIds = new Set();
  for (const task of value) {
    if (!isValidTask(task)) return false;
    if (seenIds.has(task.id)) return false;
    seenIds.add(task.id);
  }
  return true;
}

export function loadTasks(storage, key, fallbackTasks) {
  const initialCopy = copyTasks(fallbackTasks);
  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return { ok: true, source: "initial", tasks: initialCopy };
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return fallbackResult(fallbackTasks, `Сохранённые данные повреждены: ${error.message}`);
    }
    if (
      parsed === null
      || typeof parsed !== "object"
      || parsed.version !== STORAGE_VERSION
      || !isValidTaskList(parsed.tasks)
    ) {
      return fallbackResult(fallbackTasks, "Сохранённые данные не соответствуют схеме приложения.");
    }
    return { ok: true, source: "storage", tasks: copyTasks(parsed.tasks) };
  } catch (error) {
    return fallbackResult(fallbackTasks, `Хранилище недоступно: ${error.message}`);
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Список задач не соответствует схеме; запись не выполнена." };
  }
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить данные: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` };
  }
}