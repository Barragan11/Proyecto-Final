// funciones/api.js

const API_BASE_URL = "http://localhost:3000/api";

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("astro_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(API_BASE_URL + endpoint, config);

  const contentType = response.headers.get("Content-Type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      data && data.message
        ? data.message
        : `Error ${response.status} al llamar ${endpoint}`;
    throw new Error(message);
  }

  return data;
}

window.API = {
  API_BASE_URL,
  apiFetch,
};
