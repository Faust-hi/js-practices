const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

function titleError(rawTitle) {
  if (typeof rawTitle !== "string" || rawTitle.trim().length < 1) {
    return "Название должно содержать от 1 до 100 символов.";
  }
  if (rawTitle.trim().length > 100) {
    return "Название не должно быть длиннее 100 символов.";
  }
  return "";
}

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const source = draft && typeof draft === "object" ? draft : {};
  const categoryList = Array.isArray(categories) ? categories : [];
  const errors = {};

  const rawTitle = typeof source.title === "string" ? source.title : "";
  const titleMessage = titleError(rawTitle);
  if (titleMessage) errors.title = titleMessage;

  const rawPriority = source.priority;
  if (!ALLOWED_PRIORITIES.has(rawPriority)) {
    errors.priority = "Приоритет должен быть одним из значений: низкий, средний, высокий.";
  }

  const categoryId = Number(source.categoryId);
  const categoryExists = categoryList.some((category) => category.id === categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !categoryExists) {
    errors.categoryId = "Выберите категорию из загруженного списка.";
  }

  const value = {
    title: rawTitle.trim(),
    priority: ALLOWED_PRIORITIES.has(rawPriority) ? rawPriority : "medium",
    categoryId: Number.isSafeInteger(categoryId) && categoryId > 0 ? categoryId : 0,
  };

  return { valid: Object.keys(errors).length === 0, value, errors };
}