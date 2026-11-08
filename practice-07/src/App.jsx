import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import { addTask, updateTask, toggleTask, removeTask, selectTasks, getTaskStats } from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';
  // TODO: вычислить visibleTasks, stats и editingTask; реализовать обработчики.
  // TODO: передать данные и обратные вызовы компонентам согласно методичке.
export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);

  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = tasks.find(task => task.id === editingId) ?? null;

  function handleToggle(id) {
    setTasks(previous => toggleTask(previous, id));
  }

  function handleDelete(id) {
    if (!window.confirm('Удалить задачу?')) return;
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
  }

  function handleSave(value) {
    if (editingId !== null) {
      if (!tasks.some(task => task.id === editingId)) return false;
      setTasks(previous => updateTask(previous, editingId, value));
      setEditingId(null);
      return true;
    }
    setTasks(previous => {
      const nextId = previous.reduce((max, task) => Math.max(max, task.id), 0) + 1;
      return addTask(previous, value, nextId);
    });
    return true;
  }

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>ПР7: данные в памяти. Обновление страницы восстанавливает исходный набор.</p>
      <p role="status">В наборе {tasks.length} задач, категорий: {categories.length}.</p>
      <TaskStats stats={stats} />
      <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
      <TaskForm
        key={editingId ?? 'new'}
        categories={categories}
        initialTask={editingTask}
        onSave={handleSave}
        onCancel={() => setEditingId(null)}
      />
      <TaskList
        tasks={visibleTasks}
        categories={categories}
        total={stats.total}
        onToggle={handleToggle}
        onEdit={setEditingId}
        onDelete={handleDelete}
      />
    </main>
  );
}
