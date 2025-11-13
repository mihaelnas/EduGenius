// Ce fichier servira de client centralisé pour toutes les requêtes vers votre API FastAPI.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("La variable d'environnement NEXT_PUBLIC_API_BASE_URL n'est pas définie.");
}

/**
 * Une fonction fetch générique pour interagir avec votre API.
 * Elle inclut automatiquement les cookies pour gérer les sessions d'authentification HttpOnly.
 * @param endpoint - La route de l'API à appeler (ex: '/users', '/login').
 * @param options - Les options de la requête fetch (method, headers, body, etc.).
 * @returns La réponse JSON de l'API.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const defaultHeaders = {
    // 'Content-Type': 'application/json', // Le content-type peut varier (ex: pour les formulaires)
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: defaultHeaders,
    credentials: 'include', // Essentiel pour envoyer les cookies HttpOnly au backend
  });

  if (!response.ok) {
    // Tente de lire l'erreur depuis le corps de la réponse
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Erreur API: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  // Si la réponse n'a pas de contenu (ex: statut 204), on renvoie null
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
