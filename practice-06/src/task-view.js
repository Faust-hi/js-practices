const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

// Серверный текст считается недоверенным: он выводится через textContent,
// а не через innerHTML, поэтому разметка в названии остаётся простым текстом.
export function createTaskElement(task, category) {
  const item = document.createElement("li");
  item.className = task.completed ? "task-card is-completed" : "task-card";
  item.dataset.taskId = String(task.id);

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;
  item.append(title);

  const meta = document.createElement("p");
  meta.className = "task-meta";

  const categoryLabel = document.createElement("span");
  categoryLabel.className = "task-category";
  categoryLabel.textContent = category ? category.name : "Без категории";

  const priorityLabel = document.createElement("span");
  priorityLabel.className = "task-priority";
  priorityLabel.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;

  const statusLabel = document.createElement("span");
  statusLabel.className = "task-status";
  statusLabel.textContent = task.completed ? "Выполнено" : "В работе";

  meta.append(categoryLabel, priorityLabel, statusLabel);
  item.append(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  function actionButton(name, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = name;
    const text = document.createElement("span");
    text.className = "action-label";
    text.textContent = label;
    button.append(text);
    return button;
  }

  actions.append(
    actionButton("toggle", task.completed ? "Вернуть в работу" : "Выполнить"),
    actionButton("edit", "Изменить"),
    actionButton("delete", "Удалить"),
  );
  item.append(actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const cards = tasks.map((task) => createTaskElement(task, categoryById.get(task.categoryId)));
  list.replaceChildren(...cards);
}