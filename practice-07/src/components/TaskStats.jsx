// TODO: реализовать контракт компонента.
export default function TaskStats({ stats }) {
  return (
    <section aria-label="Статистика">
      <h2>Статистика</h2>
      <p>Всего: {stats.total}; выполнено: {stats.completed}; в работе: {stats.active}.</p>
    </section>
  );
}
