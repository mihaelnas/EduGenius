// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error(
    "❌ Erreur: La variable d'environnement NEXT_PUBLIC_API_BASE_URL n'est pas définie."
  );
}

// Normalize headers to a lowercase record (safer for checking content-type)
function normalizeHeaders(input?: HeadersInit): Record<string, string> {
  const result: Record<string, string> = {};
  if (!input) return result;

  if (input instanceof Headers) {
    input.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
  } else if (Array.isArray(input)) {
    input.forEach(([key, value]) => {
      result[key.toLowerCase()] = value;
    });
  } else {
    Object.entries(input).forEach(([k, v]) => {
      result[k.toLowerCase()] = String(v);
    });
  }

  return result;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = normalizeHeaders(options.headers);

  const isFormData = options.body instanceof FormData;
  const isUrlParams = options.body instanceof URLSearchParams;

  // add content-type only when body is JSON and not explicitly set
  if (!isFormData && !isUrlParams && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 204) return null;

    // try to parse json, fallback to text
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text || null;
    }

    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`;
    
      if (data) {
        if (typeof data.detail === "string") {
          message = data.detail;
        } 
        else if (data.detail && typeof data.detail === "object") {
          message = JSON.stringify(data.detail);
        }
        else if (data.message) {
          message = data.message;
        }
      }
    
      const error: any = new Error(message);
      error.status = res.status;
      error.body = data;
      throw error;
    }

    return data;
  } catch (err) {
    // rethrow to be handled by caller
    throw err;
  }
}
