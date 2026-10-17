const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
function parseDraftId(rawId) {
  if (typeof rawId === "number") {
    return Number.isSafeInteger(rawId) && rawId > 0 ? rawId : null;
  }
  if (typeof rawId !== "string") {
    return null;
  }
  const trimmed = rawId.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const id = Number(trimmed);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id = null;

  if (editingId !== null) {
    if (!Number.isSafeInteger(editingId) || editingId <= 0) {
      errors.id = "Идентификатор редактируемой задачи некорректен";
    } else if (!tasks.some((task) => task.id === editingId)) {
      errors.id = `Задача с id ${editingId} не найдена`;
    } else {
      id = editingId;
    }
  } else {
    id = parseDraftId(draft.id);
    if (id === null) {
      errors.id = "id должен быть положительным целым числом";
    } else if (tasks.some((task) => task.id === id)) {
      errors.id = `Задача с id ${id} уже существует`;
      id = null;
    }
  }

  let title = null;
  if (typeof draft.title !== "string") {
    errors.title = "Название должно быть строкой";
  } else {
    title = draft.title.trim();
    if (title.length < 1) {
      errors.title = "Название не должно быть пустым";
      title = null;
    } else if (title.length > 100) {
      errors.title = "Название не должно превышать 100 символов";
      title = null;
    }
  }

  if (!ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = 'Приоритет должен быть "low", "medium" или "high"';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { id, title, priority: draft.priority } };
}