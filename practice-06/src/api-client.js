export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

// Соединяет абсолютный baseUrl, путь и непустые query-параметры.
export function buildUrl(baseUrl, path, query = {}) {
  let base;
  try {
    base = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным http- или https-адресом.");
  }
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать протокол http или https.");
  }
  if (base.search || base.hash) {
    throw new TypeError("baseUrl не должен содержать query и hash.");
  }
  if (typeof path !== "string" || path.trim() === "") {
    throw new TypeError("path должен быть непустой строкой.");
  }
  if (query === null || typeof query !== "object" || Array.isArray(query)) {
    throw new TypeError("query должен быть обычным объектом.");
  }

  const url = new URL(`${base.href.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`);
  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(name, String(value));
  }
  return url.href;
}

// requestJson(path, { method, query, body, signal, timeoutMs } = {})
// поддерживает GET, POST, PATCH и DELETE; ответ 204 преобразуется в null.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  let normalizedBase;
  try {
    normalizedBase = buildUrl(baseUrl ?? "", "/");
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным http- или https-адресом без query и hash.");
  }
  normalizedBase = normalizedBase.replace(/\/$/, "");
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }

  async function requestJson(path, { method = "GET", query, body, signal, timeoutMs: perCallTimeout } = {}) {
    const normalizedMethod = String(method).toUpperCase();
    if (!ALLOWED_METHODS.has(normalizedMethod)) {
      throw new TypeError(`Метод ${method} не поддерживается. Разрешены GET, POST, PATCH, DELETE.`);
    }
    if (body !== undefined && normalizedMethod === "GET") {
      throw new TypeError("GET-запрос не может иметь body.");
    }
    if (body !== undefined && (body === null || typeof body !== "object" || Array.isArray(body))) {
      throw new TypeError("body должен быть обычным объектом.");
    }

    const url = buildUrl(normalizedBase, path, query);
    const effectiveTimeout = perCallTimeout ?? timeoutMs;
    if (!Number.isSafeInteger(effectiveTimeout) || effectiveTimeout <= 0) {
      throw new TypeError("timeoutMs должен быть положительным целым числом.");
    }
    if (signal !== undefined && !(signal instanceof AbortSignal)) {
      throw new TypeError("signal должен быть экземпляром AbortSignal.");
    }

    const headers = { Accept: "application/json" };
    const requestBody = body === undefined ? undefined : JSON.stringify(body);
    if (requestBody !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const timeoutSignal = AbortSignal.timeout(effectiveTimeout);
    const combinedSignal = signal === undefined
      ? timeoutSignal
      : AbortSignal.any([signal, timeoutSignal]);

    let response;
    try {
      response = await fetchFn(url, {
        method: normalizedMethod,
        headers,
        body: requestBody,
        signal: combinedSignal,
      });
    } catch (cause) {
      if (timeoutSignal.aborted) {
        throw new ApiError(`Истекло время ожидания ответа (${effectiveTimeout} мс).`, {
          kind: "timeout",
          url,
          cause,
        });
      }
      if (signal?.aborted) {
        throw new ApiError("Запрос отменён вызывающим кодом.", {
          kind: "aborted",
          url,
          cause,
        });
      }
      throw new ApiError("Не удалось соединиться с сервером.", {
        kind: "network",
        url,
        cause,
      });
    }

    if (!(response instanceof Response)) {
      throw new ApiError("fetchFn вернул значение, не являющееся Response.", {
        kind: "invalid-response",
        url,
      });
    }

    if (!response.ok) {
      const status = response.status;
      let code = null;
      let details = null;
      let message = `Сервер вернул ошибку HTTP ${status}.`;
      try {
        const payload = await response.json();
        if (payload && typeof payload === "object" && payload.error && typeof payload.error === "object") {
          if (typeof payload.error.message === "string") message = payload.error.message;
          if (typeof payload.error.code === "string") code = payload.error.code;
          if (payload.error.details !== undefined) details = payload.error.details;
        }
      } catch {
        // Тело ошибки не является корректным JSON — сохраняем статус и вид http.
      }
      throw new ApiError(message, { kind: "http", status, code, details, url });
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError("Ожидался ответ с Content-Type application/json.", {
        kind: "invalid-response",
        url,
      });
    }

    let payload;
    try {
      payload = await response.json();
    } catch (cause) {
      throw new ApiError("Тело ответа не является корректным JSON.", {
        kind: "invalid-response",
        url,
        cause,
      });
    }
    return payload;
  }

  return { requestJson };
}