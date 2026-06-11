/**
 * 公共工具函数
 */

// 占位图（灰色人像 SVG）
const PHOTO_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='100'%3E%3Crect fill='%23f0f0f0' width='80' height='100'/%3E%3Ctext x='40' y='55' text-anchor='middle' fill='%23ccc' font-size='28'%3E👦%3C/text%3E%3C/svg%3E";

const KEY_ID = 'gy_user_id';
const KEY_NAME = 'gy_user_name';
const KEY_PHONE = 'gy_user_phone';

function getUserId() {
  return localStorage.getItem(KEY_ID) || '';
}
function setUserId(id) {
  localStorage.setItem(KEY_ID, id);
}
function getUserName() {
  return localStorage.getItem(KEY_NAME) || '';
}
function getUserPhone() {
  return localStorage.getItem(KEY_PHONE) || '';
}
function saveUserInfo(name, phone) {
  localStorage.setItem(KEY_NAME, name);
  localStorage.setItem(KEY_PHONE, phone);
}

function showToast(msg, type) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function setActiveNav(page) {
  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}
