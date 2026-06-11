/**
 * 我的认领页
 */
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav('my');

  const uid = getUserId();
  const name = getUserName();

  if (name) {
    document.getElementById('userBanner').style.display = 'block';
    document.getElementById('greeting').textContent = '你好，' + name;
  }

  if (!uid) {
    document.getElementById('myAdoptions').innerHTML =
      '<div class="empty-state"><div class="icon">💝</div><p>还没有认领记录</p><p style="font-size:12px;margin-top:4px"><a href="index.html" style="color:#e87461">去看看孩子们 →</a></p></div>';
    return;
  }

  loadMyAdoptions(uid);
});

async function loadMyAdoptions(uid) {
  const box = document.getElementById('myAdoptions');
  try {
    // 查询该用户的认领记录
    const adoptionsRes = await listRecords(FEISHU_CONFIG.TABLE_ADOPTIONS, {
      page_size: 50,
      filter: `CurrentValue.[认领人ID]="${uid}"`,
    });

    if (!adoptionsRes.items.length) {
      box.innerHTML =
        '<div class="empty-state"><div class="icon">💝</div><p>还没有认领记录</p><p style="font-size:12px;margin-top:4px"><a href="index.html" style="color:#e87461">去看看孩子们 →</a></p></div>';
      return;
    }

    // 为每条认领获取详细信息
    const cards = await Promise.all(
      adoptionsRes.items.map(async (a) => {
        const childName = a['孩子姓名'] || '';

        // 查孩子最新状态
        const childrenRes = await listRecords(FEISHU_CONFIG.TABLE_CHILDREN, {
          page_size: 1,
          filter: `CurrentValue.[姓名]="${childName}"`,
        }).catch(() => ({ items: [] }));

        const child = childrenRes.items[0] || {};

        // 查近况和感谢信
        const [updatesRes, thanksRes] = await Promise.all([
          listRecords(FEISHU_CONFIG.TABLE_UPDATES, {
            page_size: 10,
            filter: `CurrentValue.[孩子姓名]="${childName}"`,
          }).catch(() => ({ items: [] })),
          listRecords(FEISHU_CONFIG.TABLE_THANKS, {
            page_size: 10,
            filter: `CurrentValue.[孩子姓名]="${childName}"`,
          }).catch(() => ({ items: [] })),
        ]);

        return {
          childName,
          childPhoto: getPhotoUrl(child['照片']),
          childStatus: child['状态'] || '',
          wish: child['小心愿'] || '',
          adoptTime: a['认领时间'] || 0,
          updates: (updatesRes.items || []).map((u) => ({
            description: u['描述'] || '',
            photo: getPhotoUrl(u['照片']),
            time: u['更新时间'] || 0,
          })),
          thanks: (thanksRes.items || []).map((t) => ({
            content: t['内容'] || '',
            type: t['类型'] || '文字',
            photo: getPhotoUrl(t['图片']),
            time: t['创建时间'] || 0,
          })),
        };
      })
    );

    box.innerHTML = cards.map((c) => buildCard(c)).join('');
  } catch (err) {
    console.error(err);
    box.innerHTML = '<div class="empty-state"><div class="icon">😢</div><p>加载失败：' + err.message + '</p></div>';
  }
}

function buildCard(c) {
  return `
    <div class="adoption-card">
      <div class="child-header">
        <img src="${c.childPhoto || PHOTO_PLACEHOLDER}" alt="${c.childName}" onerror="this.src=PHOTO_PLACEHOLDER">
        <div class="info">
          <div class="name">${c.childName}</div>
          <div class="time">认领时间：${formatTime(c.adoptTime)}</div>
        </div>
        <span class="status-badge" style="position:static">${c.childStatus || '已认领'}</span>
      </div>
      ${c.wish ? '<div class="card-wish" style="margin-bottom:8px">' + c.wish + '</div>' : ''}
      ${c.updates.length ? '<div class="section-title">📷 近况照片</div><div class="updates">' + c.updates.map((u) => '<img class="update-photo" src="' + u.photo + '" alt="' + (u.description || '') + '" onerror="this.style.display=\'none\'">').join('') + '</div>' : ''}
      ${c.thanks.length ? '<div class="section-title">💌 感谢信</div>' + c.thanks.map((t) => '<div class="thanks-block">' + (t.type === '图片' && t.photo ? '<img src="' + t.photo + '" style="max-width:100%;border-radius:8px;margin-bottom:8px" onerror="this.style.display=\'none\'">' : '') + t.content + '<div style="font-size:11px;color:#999;margin-top:6px">' + formatTime(t.time) + '</div></div>').join('') : ''}
    </div>`;
}
