 // TODO: реализовать контракт компонента.
export default function TaskFilters({ filters, categories, onChange }) {
  const change = event => onChange({ ...filters, [event.target.name]: event.target.value });
  const reset = () => onChange({ q: '', completed: '', priority: '', categoryId: '' });
  return (
    <section aria-label="Фильтры">
      <h2>Фильтры</h2>
      <label htmlFor="filter-q">Поиск по названию</label>
      <input id="filter-q" name="q" value={filters.q} onChange={change} />
      <label htmlFor="filter-completed">Статус</label>
      <select id="filter-completed" name="completed" value={filters.completed} onChange={change}>
        <option value="">Все</option>
        <option value="false">В работе</option>
        <option value="true">Выполненные</option>
      </select>
      <label htmlFor="filter-priority">Приоритет</label>
      <select id="filter-priority" name="priority" value={filters.priority} onChange={change}>
        <option value="">Все</option>
        <option value="low">Низкий</option>
        <option value="medium">Средний</option>
        <option value="high">Высокий</option>
      </select>
      <label htmlFor="filter-category">Категория</label>
      <select id="filter-category" name="categoryId" value={filters.categoryId} onChange={change}>
        <option value="">Все</option>
        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <button type="button" onClick={reset}>Сбросить фильтры</button>
    </section>
  );
}
