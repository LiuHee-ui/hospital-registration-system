
const API_BASE = 'http://localhost:3000/api';

async function api(path, options) {
  const opts = options || {};
  const token = localStorage.getItem('hms_token') || '';
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    token ? { 'X-Auth-Token': token } : {},
    opts.headers || {}
  );
  const res = await fetch(API_BASE + path, Object.assign({}, opts, {
    headers,
    cache: 'no-store',
  }));
  let data = {};
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    throw new Error(data.error || '请求失败 (' + res.status + ')');
  }
  return data;
}

function escapeHtml(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function setMsg(el, text, isError) {
  if (!el) return;
  el.textContent = text || '';
  el.classList.remove('is-error', 'is-success');
  el.removeAttribute('style');
  if (isError) el.classList.add('is-error');
  else if (text) el.classList.add('is-success');
}

/**
 * 登录守卫：在需要登录的页面顶部调用此函数。
 * 若用户未登录则立即跳转到 login.html。
 */
function requireLogin() {
  const info = localStorage.getItem('hms_user');
  if (!info) {
    location.replace('login.html');
    return false;
  }
  return true;
}

/**
 * 获取当前登录用户信息（对象），未登录返回 null。
 */
function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('hms_user') || 'null');
  } catch (_) {
    return null;
  }
}

/**
 * 在顶栏显示当前用户信息 + 注销按钮（若已登录）。
 * 调用时机：页面 DOMContentLoaded 之后。
 */
function renderUserBar() {
  const user = currentUser();
  if (!user) return;
  const nav = document.querySelector('.nav');
  if (!nav) return;
  // 移除旧的登录链接，换成用户信息 + 退出
  const loginLink = nav.querySelector('a[href="login.html"]');
  if (loginLink) loginLink.remove();
  const tag = document.createElement('span');
  tag.className = 'nav-user-tag';
  tag.innerHTML =
    '<span class="nav-user-name">👤 ' + escapeHtml(user.account) +
    '（' + escapeHtml(user.perm_type) + '）</span>' +
    '<a href="#" id="btn-logout" class="nav-logout">退出</a>';
  nav.appendChild(tag);
  document.getElementById('btn-logout').onclick = function (e) {
    e.preventDefault();
    localStorage.removeItem('hms_user');
    localStorage.removeItem('hms_token');
    location.href = 'login.html';
  };
}
