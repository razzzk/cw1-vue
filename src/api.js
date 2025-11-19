// src/api.js
const API = 'http://localhost:3000'; //This has to be switched up to render.com, currently working on local for troubleshooting

export function fetchLessons() {
  return fetch(`${API}/lessons`).then(r => r.json());
}