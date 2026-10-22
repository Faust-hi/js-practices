import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

function isAbortError(error) {
  return error?.name === "AbortError"
    || (error instanceof ApiError && error.kind === "aborted");
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const apiValid = Boolean(
    api
    && typeof api === "object"
    && typeof api.loadInitialData === "function"
    && typeof api.getTasks === "function"
    && typeof api.createTask === "function"
    && typeof api.updateTask === "function"
    && typeof api.setTaskCompleted === "function"
    && typeof api.deleteTask === "function"
    && typeof api.resetDemoData === "function",
  );
  const viewValid = Boolean(
    view
    && typeof view === "object"
    && typeof view.setListState === "function"
    && typeof view.setTasks === "function"
    && typeof view.setCategories === "function"
    && typeof view.setTotal === "function"
    && typeof view.setFormTask === "function"
    && typeof view.showFormErrors === "function"
    && typeof view.setMutationPending === "function"
    && typeof view.notify === "function",
  );
  if (!apiValid || !viewValid) {
    throw new TypeError("createAppController требует api и view с полным набором методов.");
  }

  let tasks = [];
  let categories = null;
  let filters = {};
  let editingId = null;
  let loadController = null;
  let loadSeq = 0;

  // Каждая загрузка получает последовательный номер: результат применяется,
  // только если номер совпал с последним запущенным запросом.
  function beginLoad() {
    loadController?.abort();
    const controller = new AbortController();
    loadController = controller;
    loadSeq += 1;
    return { controller, seq: loadSeq };
  }

  function isCurrent(seq) {
    return seq === loadSeq;
  }

  function showListResult(list, total) {
    tasks = list;
    // Доп. задание: если редактируемая задача исчезла из текущей выборки,
    // редактирование отменяется автоматически, как по кнопке «Отменить».
    if (editingId !== null && !tasks.some((task) => task.id === editingId)) {
      editingId = null;
      view.setFormTask(null);
      view.notify("Редактируемая задача больше не входит в выборку; редактирование отменено.");
    }
    view.setTasks(tasks, categories ?? []);
    view.setTotal(total);
    view.setListState(tasks.length > 0 ? "ready" : "empty");
  }

  function showLoadError(error) {
    if (isAbortError(error)) return;
    view.setListState("error", messageForError(error));
  }

  async function loadInitial() {
    const { controller, seq } = beginLoad();
    view.setListState("loading");
    try {
      const result = await api.loadInitialData(filters, { signal: controller.signal });
      if (!isCurrent(seq)) return;
      categories = result.categories;
      view.setCategories(categories);
      showListResult(result.tasks, result.meta?.total ?? result.tasks.length);
    } catch (error) {
      if (!isCurrent(seq)) return;
      showLoadError(error);
    }
  }

  async function loadCurrentTasks() {
    const { controller, seq } = beginLoad();
    view.setListState("loading");
    try {
      const result = await api.getTasks(filters, { signal: controller.signal });
      if (!isCurrent(seq)) return;
      showListResult(result.tasks, result.meta?.total ?? result.tasks.length);
    } catch (error) {
      if (!isCurrent(seq)) return;
      showLoadError(error);
    }
  }

  async function runMutation(action) {
    view.setMutationPending(true);
    try {
      await action();
      view.notify("Операция выполнена.", "success");
      await loadCurrentTasks();
      return true;
    } catch (error) {
      view.notify(messageForError(error), "error");
      return false;
    } finally {
      view.setMutationPending(false);
    }
  }

  return {
    start(initialFilters = {}) {
      filters = { ...initialFilters };
      return loadInitial();
    },

    applyFilters(nextFilters = {}) {
      filters = { ...nextFilters };
      // Категории могли не загрузиться при первой неудаче — тогда повторяем
      // начальную загрузку, а не только запрос списка.
      return categories === null ? loadInitial() : loadCurrentTasks();
    },

    refresh() {
      return categories === null ? loadInitial() : loadCurrentTasks();
    },

    async submit(draft) {
      const { valid, value, errors } = validateDraft(draft, categories ?? []);
      view.showFormErrors(errors);
      if (!valid) return;

      const targetId = editingId;
      const succeeded = targetId === null
        ? await runMutation(() => api.createTask(value))
        : await runMutation(() => api.updateTask(targetId, value));
      if (succeeded) {
        editingId = null;
        view.setFormTask(null);
      }
    },

    beginEdit(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      editingId = id;
      view.setFormTask(task);
    },

    cancelEdit() {
      editingId = null;
      view.setFormTask(null);
    },

    toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      const nextCompleted = task ? !task.completed : true;
      return runMutation(() => api.setTaskCompleted(id, nextCompleted));
    },

    deleteTask(id) {
      return runMutation(() => api.deleteTask(id));
    },

    resetData() {
      return runMutation(() => api.resetDemoData());
    },

    destroy() {
      loadController?.abort();
    },
  };
}