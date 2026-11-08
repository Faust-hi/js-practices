// TODO: реализовать контракт компонента.
import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, total, onToggle, onEdit, onDelete }) {
  return (
    <section aria-label="Список задач">
      <h2>Задачи</h2>
      <p>Найдено: {tasks.length}</p>
      {tasks.length === 0
        ? <p>{total === 0 ? 'Задач пока нет. Создайте первую.' : 'По выбранным условиям задач нет.'}</p>
        : <ul>
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                categoryName={categories.find(category => category.id === task.categoryId)?.name ?? 'Неизвестная категория'}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>}
    </section>
  );
}
