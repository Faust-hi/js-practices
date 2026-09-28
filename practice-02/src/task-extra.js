export function searchTasks(tasks, query) {
  const q = query.trim().toLowerCase();
  if (q === "") return [...tasks];
  return tasks.filter((task) => task.title.toLowerCase().includes(q));
}