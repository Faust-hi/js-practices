import { Router } from 'express';
import { ApiError } from './errors.js';
import { parsePositiveId, parseFilters } from './validation.js';

export function createRouter(store) {
  const router = Router({ caseSensitive: true });

  router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));

  router.get('/demo-invalid', (req, res) => {
  res.type('html').send(
    '<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Проверка валидации</title></head>' +
    '<body><h1>POST /api/tasks — невалидный title</h1><pre id="out">Отправка запроса…</pre>' +
    '<script>' +
    "fetch('/api/tasks', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title:'   '})})" +
    ".then(async r => { document.getElementById('out').textContent = r.status + ' ' + r.statusText + '\\n' + JSON.stringify(await r.json(), null, 2); })" +
    '</script></body></html>'
  );
});


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
  router.post('/tasks', (req, res) => {
    const parsed = req.body || {};
    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    if (title.length < 1 || title.length > 100) throw new ApiError(400, 'VALIDATION_ERROR', 'Название должно содержать от 1 до 100 символов.');
    const created = store.createTask({ title, priority: parsed.priority, categoryId: parsed.categoryId });
    res.status(201).json({ data: created });
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
