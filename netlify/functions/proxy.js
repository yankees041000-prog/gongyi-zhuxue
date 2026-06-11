/**
 * Netlify Function — 飞书 API 代理
 */
const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU = 'https://open.feishu.cn/open-apis';

let cache = { token: null, expire: 0 };

async function getToken() {
  if (cache.token && Date.now() < cache.expire) return cache.token;
  const r = await fetch(`${FEISHU}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  const d = await r.json();
  if (d.code !== 0) throw new Error(d.msg);
  cache = { token: d.tenant_access_token, expire: Date.now() + (d.expire - 300) * 1000 };
  return cache.token;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { method, target } = event.queryStringParameters || {};
    if (!target) throw new Error('缺少 target');

    const token = await getToken();
    const url = `${FEISHU}${target}`;

    const opts = {
      method: method || 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    };

    if (event.body && method !== 'GET') {
      opts.body = event.body;
    }

    const result = await fetch(url, opts);
    const text = await result.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { _raw: text }; }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ code: -1, msg: err.message }),
    };
  }
};
