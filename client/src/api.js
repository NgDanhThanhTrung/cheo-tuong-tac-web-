// src/api.js
const BASE = "/api";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Da xay ra loi.");
  return data;
}

export const api = {
  register: (fullName, phone) =>
    fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone }),
    }).then(handle),

  login: (phone) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    }).then(handle),

  getUsers: (token) =>
    fetch(`${BASE}/users`, { headers: authHeaders(token) }).then(handle),

  getLeaderboard: (token) =>
    fetch(`${BASE}/users/leaderboard`, { headers: authHeaders(token) }).then(handle),

  getTasks: (ownerId, token) =>
    fetch(`${BASE}/tasks?ownerId=${ownerId}`, { headers: authHeaders(token) }).then(handle),

  createTask: (title, url, token) =>
    fetch(`${BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ title, url }),
    }).then(handle),

  confirmCross: (taskId, token) =>
    fetch(`${BASE}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ taskId }),
    }).then(handle),
};
