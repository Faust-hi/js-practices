import { useCallback, useEffect, useRef, useState } from 'react';

// Основное задание ПР8. api создаётся один раз в config.js, поэтому ссылка стабильна.
export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);

  const { q, completed, priority, categoryId } = filters;
  const mountedRef = useRef(false);
  const readRef = useRef(null);
  const mutationRef = useRef(null);

  // Признак монтирования восстанавливается в setup: StrictMode делает cleanup между двумя setup.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      readRef.current?.abort();
      mutationRef.current?.abort();
      readRef.current = null;
      mutationRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    readRef.current = controller;
    let active = true;
    const query = { q, completed, priority, categoryId };
    setStatus('loading');
    setError(null);

    async function run() {
      try {
        const result = await api.loadInitialData(query, { signal: controller.signal });
        if (!active) return;
        setSnapshot(result);
        setStatus('ready');
        setError(null);
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        setStatus('error');
        setError(cause);
      }
    }

    void run();
    return () => {
      active = false;
      controller.abort();
      if (readRef.current === controller) readRef.current = null;
    };
  }, [api, q, completed, priority, categoryId, revision]);

  const refresh = useCallback(() => {
    setRevision(value => value + 1);
  }, []);

  // Общая функция для всех операций изменения. Блокировка ставится до первого await.
  const mutate = useCallback(async operation => {
    if (!mountedRef.current || mutationRef.current !== null) return false;
    const controller = new AbortController();
    mutationRef.current = controller;
    setPending(true);
    setMutationError(null);
    try {
      await operation(controller.signal);
      if (!mountedRef.current || mutationRef.current !== controller) return false;
      setRevision(value => value + 1);
      return true;
    } catch (cause) {
      if (mountedRef.current && mutationRef.current === controller) setMutationError(cause);
      return false;
    } finally {
      if (mutationRef.current === controller) mutationRef.current = null;
      if (mountedRef.current) setPending(false);
    }
  }, []);

  const saveTask = useCallback((id, value) => mutate(signal =>
    id === null ? api.createTask(value, { signal }) : api.updateTask(id, value, { signal })
  ), [api, mutate]);

  const toggleTask = useCallback(task => mutate(signal =>
    api.setTaskCompleted(task.id, !task.completed, { signal })
  ), [api, mutate]);

  const deleteTask = useCallback(id => mutate(signal =>
    api.deleteTask(id, { signal })
  ), [api, mutate]);

  const resetData = useCallback(() => mutate(signal =>
    api.resetDemoData({ signal })
  ), [api, mutate]);

  return {
    snapshot, status, error, mutationError, pending,
    refresh, saveTask, toggleTask, deleteTask, resetData,
  };
}
