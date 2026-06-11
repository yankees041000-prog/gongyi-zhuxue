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
  APP_ID: '请填写你的App ID',
  APP_SECRET: '请填写你的App Secret',
  BITABLE_APP_TOKEN: '请填写多维表格App Token',

  // 四个子表 ID
  TABLE_CHILDREN: '请填写孩子信息表ID',
  TABLE_ADOPTIONS: '请填写认领记录表ID',
  TABLE_UPDATES: '请填写近况照片表ID',
  TABLE_THANKS: '请填写感谢信表ID',
};

// 管理后台密码（进入 admin.html 时需要输入）
const ADMIN_PASSWORD = 'admin888';
