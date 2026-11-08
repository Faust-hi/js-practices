import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';
// TODO: реализовать контракт компонента.
export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const emptyDraft = () => ({ title: '', priority: 'medium', categoryId: String(categories[0]?.id ?? '') });
  const [draft, setDraft] = useState(() => initialTask
    ? { title: initialTask.title, priority: initialTask.priority, categoryId: String(initialTask.categoryId) }
    : emptyDraft());
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');

  const change = event => setDraft(previous => ({ ...previous, [event.target.name]: event.target.value }));

  function submit(event) {
    event.preventDefault();
    const result = validateTaskDraft(draft, categories);
    setErrors(result.errors);
    if (!result.valid) {
      setMessage('');
      setFailure('');
      return;
    }
    const saved = onSave(result.value);
    if (saved) {
      setMessage('Задача сохранена.');
      setFailure('');
      setErrors({});
      if (!initialTask) setDraft(emptyDraft());
    } else {
      setMessage('');
      setFailure('Сохранение не выполнено. Проверьте данные и попробуйте снова.');
    }
  }

  return (
    <section aria-label="Форма задачи">
      <h2>{initialTask ? 'Редактирование задачи' : 'Новая задача'}</h2>
      <form onSubmit={submit} noValidate>
        <label htmlFor="task-title">Название</label>
        <input
          id="task-title" name="title" value={draft.title} onChange={change}
          aria-invalid={Boolean(errors.title)} aria-describedby="title-error"
        />
        <p id="title-error" className="error">{errors.title}</p>

        <label htmlFor="task-priority">Приоритет</label>
        <select
          id="task-priority" name="priority" value={draft.priority} onChange={change}
          aria-invalid={Boolean(errors.priority)} aria-describedby="priority-error"
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        <p id="priority-error" className="error">{errors.priority}</p>

        <label htmlFor="task-category">Категория</label>
        <select
          id="task-category" name="categoryId" value={draft.categoryId} onChange={change}
          aria-invalid={Boolean(errors.categoryId)} aria-describedby="category-error"
        >
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <p id="category-error" className="error">{errors.categoryId}</p>

        <button type="submit">Сохранить</button>
        {initialTask && <button type="button" onClick={onCancel}>Отмена</button>}
      </form>
      <p role="status">{message}</p>
      {failure && <p role="alert">{failure}</p>}
    </section>
  );
}
