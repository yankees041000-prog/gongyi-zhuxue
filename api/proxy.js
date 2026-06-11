/**
 * API 代理 — 解决跨域，转发到飞书 API
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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS);
    return res.end();
  }

  try {
    const { method, target } = req.query;
    if (!target) throw new Error('缺少 target');

    const token = await getToken();
    const url = `${FEISHU}${target}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const opts = { method: method || 'GET', headers };

    if (req.body && method !== 'GET') {
      opts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const result = await fetch(url, opts);
    const text = await result.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { _raw: text }; }

    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, CORS);
    res.end(JSON.stringify({ code: -1, msg: err.message }));
  }
};
