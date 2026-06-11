/**
 * 飞书 Bitable API 封装 —— 纯前端直连
 * 无需任何后端服务器
 */

const FEISHU_API = 'https://open.feishu.cn/open-apis';

// Token 缓存
let _token = null;
let _tokenExpire = 0;

/**
 * 获取 tenant_access_token（自动缓存）
 */
async function getToken() {
  if (_token && Date.now() < _tokenExpire) return _token;

  const res = await fetch(
    `${FEISHU_API}/auth/v3/tenant_access_token/internal`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: FEISHU_CONFIG.APP_ID,
        app_secret: FEISHU_CONFIG.APP_SECRET,
      }),
    }
  );

  const data = await res.json();
  if (data.code !== 0) throw new Error(`飞书认证失败: ${data.msg}`);

  _token = data.tenant_access_token;
  _tokenExpire = Date.now() + (data.expire - 300) * 1000; // 提前5分钟刷新
  return _token;
}

/**
 * 通用 Bitable 请求
 */
async function bitableReq(path, options = {}) {
  const token = await getToken();
  const url = `${FEISHU_API}/bitable/v1/apps/${FEISHU_CONFIG.BITABLE_APP_TOKEN}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(data.msg || '请求失败');
  }
  return data;
}

// ==================== 基础 CRUD ====================

/**
 * 查询记录列表
 */
async function listRecords(tableId, params = {}) {
  const q = new URLSearchParams();
  if (params.page_size) q.set('page_size', String(params.page_size));
  if (params.page_token) q.set('page_token', params.page_token);
  if (params.filter) q.set('filter', params.filter);
  if (params.sort) q.set('sort', params.sort);
  const qs = q.toString();

  const data = await bitableReq(`/tables/${tableId}/records${qs ? '?' + qs : ''}`);

  return {
    items: (data.data.items || []).map(formatRecord),
    has_more: data.data.has_more,
    page_token: data.data.page_token,
    total: data.data.total,
  };
}

/**
 * 获取单条记录
 */
async function getRecord(tableId, recordId) {
  const data = await bitableReq(`/tables/${tableId}/records/${recordId}`);
  return formatRecord(data.data.record);
}

/**
 * 创建记录，返回新记录
 */
async function createRecord(tableId, fields) {
  const data = await bitableReq(`/tables/${tableId}/records`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
  return formatRecord(data.data.record);
}

/**
 * 更新记录
 */
async function updateRecord(tableId, recordId, fields) {
  const data = await bitableReq(`/tables/${tableId}/records/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify({ fields }),
  });
  return formatRecord(data.data.record);
}

/**
 * 删除记录
 */
async function deleteRecord(tableId, recordId) {
  await bitableReq(`/tables/${tableId}/records/${recordId}`, {
    method: 'DELETE',
  });
}

// ==================== 图片上传 ====================

/**
 * 上传图片到飞书，返回 file_token
 */
async function uploadImage(file) {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', 'image');

  const res = await fetch(`${FEISHU_API}/drive/v1/medias/upload_all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (data.code !== 0) throw new Error(`图片上传失败: ${data.msg}`);

  return {
    fileToken: data.data.file_token,
    url: data.data.url,
    name: data.data.file_name,
  };
}

// ==================== 工具函数 ====================

/**
 * 格式化飞书记录为普通对象
 */
function formatRecord(rec) {
  return { id: rec.record_id, ...rec.fields };
}

/**
 * 获取附件第一张图片 URL
 */
function getPhotoUrl(field) {
  if (!field || !Array.isArray(field) || field.length === 0) return '';
  return field[0].url || field[0].file_token || '';
}

/**
 * 获取附件列表的所有 URL
 */
function getPhotoUrls(field) {
  if (!field || !Array.isArray(field)) return [];
  return field.map((f) => f.url || f.file_token || '').filter(Boolean);
}
