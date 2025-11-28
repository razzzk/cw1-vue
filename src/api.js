// src/api.js
const API = 'http://localhost:3000'; // 

export function fetchLessons() {
  return fetch(`${API}/lessons`).then(r => r.json());
}

export function postOrder(payload) {
  return fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export function putLesson(id, data) {
  return fetch(`${API}/lessons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json());
}