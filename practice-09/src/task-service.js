// Все фильтры объединяются через И. Исходный массив не изменяется.
export function selectTasks(tasks, filters) {
  const q = typeof filters.q === 'string' ? filters.q.trim().toLocaleLowerCase('ru-RU') : '';
  return tasks.filter(task => {
    if (filters.completed !== null && task.completed !== filters.completed) return false;
    if (filters.priority !== null && task.priority !== filters.priority) return false;
    if (filters.categoryId !== null && task.categoryId !== filters.categoryId) return false;
    if (q && !task.title.toLocaleLowerCase('ru-RU').includes(q)) return false;
    return true;
  });
}

// Поиск по полю id, не по индексу. Возвращает задачу или null.
export function findTask(tasks, id) {
  return tasks.find(task => task.id === id) ?? null;
}
