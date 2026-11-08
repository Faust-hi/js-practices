// Чистые функции: без React, DOM, сети, случайных значений и изменения аргументов.
// Точные контракты и допустимые входы приведены в методичке.

const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);
 // TODO: { valid, value: { title, priority, categoryId }, errors }.
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const title = typeof draft.title === 'string' ? draft.title.trim() : '';
  if (typeof draft.title !== 'string' || title.length < 1 || title.length > 100) {
    errors.title = 'Название должно содержать от 1 до 100 символов.';
  }
  if (!ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = 'Приоритет должен быть low, medium или high.';
  }

  let categoryId = null;
  let categoryInvalid = false;
  if (typeof draft.categoryId === 'number') {
    categoryId = draft.categoryId;
  } else if (typeof draft.categoryId === 'string' && /^[1-9]\d*$/.test(draft.categoryId)) {
    categoryId = Number(draft.categoryId);
  } else {
    categoryInvalid = true;
  }
  if (!categoryInvalid && (!Number.isSafeInteger(categoryId) || categoryId <= 0
      || !categories.some(category => category.id === categoryId))) {
    categoryInvalid = true;
  }
  if (categoryInvalid) errors.categoryId = 'Выберите существующую категорию.';

  const value = { title, priority: draft.priority, categoryId };
  return { valid: Object.keys(errors).length === 0, value, errors };
}
  // TODO: совместное применение q, completed, priority, categoryId.
export function selectTasks(tasks, filters) {
  const q = typeof filters.q === 'string' ? filters.q.trim().toLocaleLowerCase('ru-RU') : '';
  return tasks.filter(task => {
    if (q && !task.title.toLocaleLowerCase('ru-RU').includes(q)) return false;
    if (filters.completed === 'true' && !task.completed) return false;
    if (filters.completed === 'false' && task.completed) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.categoryId !== '' && filters.categoryId !== null && filters.categoryId !== undefined
        && task.categoryId !== Number(filters.categoryId)) return false;
    return true;
  });
}
  // TODO: { total, completed, active } по всему массиву.
export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  return { total, completed, active: total - completed };
}
 // TODO: новый массив, новая задача completed:false, проверка уникального id.
export function addTask(tasks, value, id) {
  if (!Number.isSafeInteger(id) || id <= 0 || tasks.some(task => task.id === id)) {
    throw new TypeError('id должен быть положительным целым и уникальным.');
  }
  return [...tasks, { id, ...value, completed: false }];
}
 // TODO: заменить title/priority/categoryId, сохранить id и completed.
export function updateTask(tasks, id, value) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => task.id === id
    ? { ...task, title: value.title, priority: value.priority, categoryId: value.categoryId }
    : task);
}
// TODO: инвертировать completed только у найденной задачи.
export function toggleTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}
// TODO: удалить задачу по id.
export function removeTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.filter(task => task.id !== id);
}
