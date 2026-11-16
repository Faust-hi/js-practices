import { Router } from 'express';
import { ApiError } from './errors.js';
import { parsePositiveId, parseFilters } from './validation.js';

export function createRouter(store) {
  const router = Router({ caseSensitive: true });

  router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));

  router.get('/categories', (req, res) => {
    const data = store.listCategories();
    res.json({ data, meta: { total: data.length } });
  });

  router.get('/tasks', (req, res) => {
    const searchParams = new URL(req.originalUrl, 'http://localhost').searchParams;
    const filters = parseFilters(searchParams);
    const data = store.listTasks(filters);
    res.json({ data, meta: { total: data.length, filters } });
  });

  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) throw new ApiError(400, 'INVALID_ID', 'Некорректный id задачи.');
    const data = store.getTask(id);
    if (!data) throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });
    res.json({ data });
  });

  // Изменяющие методы на известных путях запрещены: 405 и Allow.
  // OPTIONS обработан приложением, HEAD — GET-маршрутами выше.
  for (const path of ['/health', '/categories', '/tasks', '/tasks/:id']) {
    router.all(path, (req, res) => {
      res.set('Allow', 'GET, HEAD, OPTIONS');
      throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается.');
    });
  }

  return router;
}
