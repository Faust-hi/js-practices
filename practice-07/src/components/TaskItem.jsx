const priorities = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
 // TODO: реализовать контракт компонента.
export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  return (
    <li>
      <h3>{task.title}</h3>
      <p>{task.completed ? 'Выполнена' : 'В работе'} · {priorities[task.priority]} · {categoryName}</p>
      <div className="actions">
        <button type="button" onClick={() => onToggle(task.id)}>Переключить статус</button>
        <button type="button" onClick={() => onEdit(task.id)}>Редактировать</button>
        <button type="button" onClick={() => onDelete(task.id)}>Удалить</button>
      </div>
    </li>
  );
}
