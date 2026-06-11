/**
 * ============ 飞书配置（部署前请填写） ============
 *
 * 获取方式见 README.md
 * 1. 飞书开放平台 https://open.feishu.cn → 创建应用 → 获取 APP_ID 和 APP_SECRET
 * 2. 多维表格 URL 中的 base ID 就是 BITABLE_APP_TOKEN
 * 3. 每个子表的 ID 在表格右上角 ... → 复制表格 ID
 *
 * 权限要求：bitable:app（仅此一个权限，不会泄露其他数据）
 */

const FEISHU_CONFIG = {
  APP_ID: 'cli_aaa03b6bba79dccc',
  APP_SECRET: 'C4HorDx6nRUFxk7ffjmDagZL4PWBwrDr',
  BITABLE_APP_TOKEN: 'SHE2bMWaOaK3jRsVy26c9yDPnif',

  // 四个子表 ID（API 自动创建，权限已通）
  TABLE_CHILDREN: 'tblkhcsvKbktbuDr',   // 孩子信息表
  TABLE_ADOPTIONS: 'tblADVZlF8EJ0Lo2',   // 认领记录表
  TABLE_UPDATES: 'tbl3bPyHm2RQeZFA',     // 近况照片表
  TABLE_THANKS: 'tblCYDSRhVpaNhTZ',      // 感谢信表
};

// 管理后台密码（进入 admin.html 时需要输入）
const ADMIN_PASSWORD = 'admin888';
