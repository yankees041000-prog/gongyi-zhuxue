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
  BITABLE_APP_TOKEN: 'YjHxwxUCniNK6sk6IW8cgX5snQh',

  // 四个子表 ID（你手动创建）
  TABLE_CHILDREN: 'tblnIrjrv42o38xs',   // 孩子信息表
  TABLE_ADOPTIONS: 'tbl51JuspZb2bY0i',   // 认领记录表
  TABLE_UPDATES: 'tblKpgrsheuBHYg7',     // 近况照片表
  TABLE_THANKS: 'tblnbDW8gYGB6cgd',      // 感谢信表
};

// 管理后台密码（进入 admin.html 时需要输入）
const ADMIN_PASSWORD = 'admin888';
