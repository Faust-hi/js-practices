// Заготовка модуля. throw ниже отмечает отсутствие реализации,
// а не способ обработки некорректных данных в готовом решении.
// Для предусмотренных ошибок необходимо возвращать { ok: false, error: "..." }.
// console.log(), prompt(), document и чтение внешнего состояния здесь не нужны.

function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}
function normalizeTitle(value) {
  if (typeof value !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const title = value.trim();
  if (title.length < 1) {
    return { ok: false, error: "Название не должно быть пустым" };
  }
  if (title.length > 100) {
    return { ok: false, error: "Название не должно превышать 100 символов" };
  }
  return { ok: true, title };
}
export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  const checkedTitle = normalizeTitle(title);
  if (!checkedTitle.ok) {
    return checkedTitle;
  }
  if (priority !== "low" && priority !== "medium" && priority !== "high") {
    return { ok: false, error: 'Приоритет должен быть "low", "medium" или "high"' };
  }
  return { ok: true, task: { id, title: checkedTitle.title, completed: false, priority } };
}
export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}
export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}
export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}
export function getTaskStats(tasks) {
  let completed = 0;
  for (const task of tasks) {
    if (task.completed === true) completed += 1;
  }
  const total = tasks.length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : (completed / total) * 100;
  return { total, completed, pending, progress };
}
export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) return created;
  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }
  return { ok: true, tasks: [...tasks, created.task] };
}
export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (typeof completed !== "boolean") {
    return { ok: false, error: "Признак выполнения должен быть true или false" };
  }
  const task = findTaskById(tasks, id);
  if (task === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }
  const nextTasks = tasks.map((item) => (item.id === id ? { ...item, completed } : item));
  return { ok: true, tasks: nextTasks };
}
export function renameTask(tasks, id, title) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  const checkedTitle = normalizeTitle(title);
  if (!checkedTitle.ok) return checkedTitle;
  const task = findTaskById(tasks, id);
  if (task === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }
  const nextTasks = tasks.map((item) =>
    item.id === id ? { ...item, title: checkedTitle.title } : item,
  );
  return { ok: true, tasks: nextTasks };
}
export function removeTask(tasks, id) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}