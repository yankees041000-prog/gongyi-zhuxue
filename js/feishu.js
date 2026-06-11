/**
 * 飞书 Bitable API 封装
 * 浏览器通过 /api/proxy 代理（解决跨域），上传直接调飞书
 */

const PROXY = '/api/proxy';

async function call(method, path, body) {
  const qs = `?method=${method}&target=${encodeURIComponent(path)}`;
  const opts = { method: method === 'GET' ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' } };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(PROXY + qs, opts);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg || '请求失败');
  return data;
}

// ========== CRUD ==========

async function listRecords(tableId, params = {}) {
  const q = new URLSearchParams();
  if (params.page_size) q.set('page_size', String(params.page_size));
  if (params.page_token) q.set('page_token', params.page_token);
  if (params.filter) q.set('filter', params.filter);
  const qs = q.toString();
  const path = `/bitable/v1/apps/${FEISHU_CONFIG.BITABLE_APP_TOKEN}/tables/${tableId}/records${qs ? '?' + qs : ''}`;
  const data = await call('GET', path);
  return { items: (data.data.items || []).map(formatRecord), has_more: data.data.has_more, page_token: data.data.page_token, total: data.data.total };
}

async function getRecord(tableId, recordId) {
  const path = `/bitable/v1/apps/${FEISHU_CONFIG.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}`;
  return formatRecord((await call('GET', path)).data.record);
}

async function createRecord(tableId, fields) {
  const path = `/bitable/v1/apps/${FEISHU_CONFIG.BITABLE_APP_TOKEN}/tables/${tableId}/records`;
  return formatRecord((await call('POST', path, { fields })).data.record);
}

async function updateRecord(tableId, recordId, fields) {
  const path = `/bitable/v1/apps/${FEISHU_CONFIG.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}`;
  return formatRecord((await call('PUT', path, { fields })).data.record);
}

async function deleteRecord(tableId, recordId) {
  await call('DELETE', `/bitable/v1/apps/${FEISHU_CONFIG.BITABLE_APP_TOKEN}/tables/${tableId}/records/${recordId}`);
}

// ========== 图片上传（直连飞书） ==========

async function uploadImage(file) {
  // 通过代理获取 token
  const tres = await fetch(`${PROXY}?method=POST&target=${encodeURIComponent('/auth/v3/tenant_access_token/internal')}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  });
  const td = await tres.json();
  const token = td.tenant_access_token;

  // 直连飞书上传
  const fd = new FormData();
  fd.append('file', file);
  fd.append('file_type', 'image');
  const res = await fetch('https://open.feishu.cn/open-apis/drive/v1/medias/upload_all', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`上传失败: ${data.msg}`);
  return { fileToken: data.data.file_token, url: data.data.url, name: data.data.file_name };
}

// ========== 工具 ==========

function formatRecord(rec) { return { id: rec.record_id, ...rec.fields }; }
function getPhotoUrl(field) {
  if (!field || !Array.isArray(field) || field.length === 0) return '';
  return field[0].url || field[0].file_token || '';
}
