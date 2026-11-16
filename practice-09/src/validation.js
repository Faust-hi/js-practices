import { ApiError } from './errors.js';

const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);
const ALLOWED_NAMES = new Set(['completed', 'priority', 'categoryId', 'q']);
const MAX_QUERY_LENGTH = 100;

function invalidQuery(message) {
  return new ApiError(400, 'INVALID_QUERY', message);
}

// raw: строка; результат: безопасное положительное целое либо null.
export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

// URLSearchParams -> { completed: boolean|null, priority: string|null,
// categoryId: number|null, q: string }. Ошибка: ApiError(400, 'INVALID_QUERY', ...).
export function parseFilters(searchParams) {
  const filters = { completed: null, priority: null, categoryId: null, q: '' };

  for (const name of searchParams.keys()) {
    if (!ALLOWED_NAMES.has(name)) throw invalidQuery(`Неизвестный параметр запроса: ${name}.`);
  }
  for (const name of ALLOWED_NAMES) {
    if (searchParams.getAll(name).length > 1) throw invalidQuery(`Параметр ${name} указан более одного раза.`);
  }

  const completed = searchParams.get('completed');
  if (completed !== null) {
    if (completed !== 'true' && completed !== 'false') throw invalidQuery('completed принимает только true или false.');
    filters.completed = completed === 'true';
  }

  const priority = searchParams.get('priority');
  if (priority !== null) {
    if (!ALLOWED_PRIORITIES.has(priority)) throw invalidQuery('Недопустимое значение priority.');
    filters.priority = priority;
  }

  const categoryId = searchParams.get('categoryId');
  if (categoryId !== null) {
    const value = parsePositiveId(categoryId);
    if (value === null) throw invalidQuery('categoryId должен быть положительным целым числом.');
    filters.categoryId = value;
  }

  const q = (searchParams.get('q') ?? '').trim();
  if (q.length > MAX_QUERY_LENGTH) throw invalidQuery(`Поисковая строка не длиннее ${MAX_QUERY_LENGTH} символов.`);
  filters.q = q;

  return filters;
}
