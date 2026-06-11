/**
 * 孩子详情页
 */
let currentChild = null;

document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    document.getElementById('detailContainer').innerHTML =
      '<div class="empty-state"><div class="icon">😢</div><p>缺少孩子 ID</p></div>';
    return;
  }
  loadChild(id);
});

async function loadChild(childId) {
  const box = document.getElementById('detailContainer');
  try {
    const rec = await getRecord(FEISHU_CONFIG.TABLE_CHILDREN, childId);

    const childName = rec['姓名'] || '';

    // 并行取近况和感谢信
    const [updatesRes, thanksRes] = await Promise.all([
      listRecords(FEISHU_CONFIG.TABLE_UPDATES, {
        page_size: 20,
        filter: `CurrentValue.[孩子姓名]="${childName}"`,
      }).catch(() => ({ items: [] })),
      listRecords(FEISHU_CONFIG.TABLE_THANKS, {
        page_size: 20,
        filter: `CurrentValue.[孩子姓名]="${childName}"`,
      }).catch(() => ({ items: [] })),
    ]);

    currentChild = {
      id: rec.id,
      name: childName,
      age: rec['年龄'] || 0,
      grade: rec['年级'] || '',
      school: rec['学校'] || '',
      region: rec['地区'] || '',
      description: rec['个人情况'] || '',
      wish: rec['小心愿'] || '',
      scores: rec['成绩'] || '',
      photo: getPhotoUrl(rec['照片']),
      status: rec['状态'] || '待认领',
      adopterName: rec['认领人姓名'] || '',
      adopterId: rec['认领人ID'] || '',
      adoptTime: rec['认领时间'] || 0,
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

    box.innerHTML = buildHTML(currentChild);

    const sec = document.getElementById('adoptSection');
    sec.style.display = 'block';

    if (currentChild.status === '已认领') {
      document.getElementById('adoptBtn').style.display = 'none';
      document.getElementById('adoptedInfo').style.display = 'block';
      document.getElementById('adopterNameDisplay').textContent =
        currentChild.adopterName || '爱心人士';
    } else {
      document.getElementById('adoptBtn').style.display = 'block';
      document.getElementById('adoptedInfo').style.display = 'none';
    }
  } catch (err) {
    console.error(err);
    box.innerHTML =
      '<div class="empty-state"><div class="icon">😢</div><p>加载失败：' + err.message + '</p></div>';
  }
}

function buildHTML(child) {
  const sc = child.status === '已认领' ? 'adopted' : 'available';
  const st = child.status === '已认领' ? '已认领' : '待认领';

  return `
    <img class="detail-photo" src="${child.photo || PHOTO_PLACEHOLDER}" alt="${child.name}" onerror="this.src=PHOTO_PLACEHOLDER">
    <div class="detail-body">
      <div class="detail-name">${child.name}
        <span class="status-badge ${sc}" style="position:static;font-size:13px">${st}</span>
      </div>
      <div class="detail-meta-grid">
        <div class="detail-meta-item"><div class="label">年龄</div><div class="value">${child.age} 岁</div></div>
        <div class="detail-meta-item"><div class="label">年级</div><div class="value">${child.grade || '-'}</div></div>
        <div class="detail-meta-item"><div class="label">学校</div><div class="value">${child.school || '-'}</div></div>
        <div class="detail-meta-item"><div class="label">地区</div><div class="value">${child.region || '-'}</div></div>
      </div>
      <div class="detail-section"><h3>📝 个人情况</h3><div class="content">${child.description || '暂无'}</div></div>
      <div class="detail-section"><h3>🎁 小心愿</h3><div class="content">${child.wish || '暂无'}</div></div>
      <div class="detail-section"><h3>📊 学习成绩</h3><div class="content">${child.scores || '暂无'}</div></div>
      ${child.status === '已认领' ? `<div class="detail-section"><h3>🤝 认领信息</h3><div class="content">认领人：${child.adopterName || '匿名'}<br>认领时间：${formatTime(child.adoptTime)}</div></div>` : ''}
      ${child.updates.length ? `<div class="detail-section"><h3>📷 近况照片</h3><div class="photo-scroll">${child.updates.map((u) => `<div class="photo-item"><img src="${u.photo}" alt="${u.description}" onerror="this.style.display='none'"><div class="photo-desc">${u.description || ''}</div></div>`).join('')}</div></div>` : ''}
      ${child.thanks.length ? `<div class="detail-section"><h3>💌 感谢信</h3>${child.thanks.map((t) => `<div class="content thanks-card">${t.type === '图片' && t.photo ? `<img src="${t.photo}" style="max-width:100%;border-radius:8px;margin-bottom:6px" onerror="this.style.display='none'">` : ''}${t.content}<div class="time-tag">${formatTime(t.time)}</div></div>`).join('')}</div>` : ''}
    </div>`;
}

function openAdoptModal() {
  if (!currentChild || currentChild.status === '已认领') {
    showToast('该孩子已被认领', 'error');
    return;
  }
  document.getElementById('adoptModal').classList.add('show');
  document.getElementById('inputName').value = getUserName();
  document.getElementById('inputPhone').value = getUserPhone();
}

function closeAdoptModal() {
  document.getElementById('adoptModal').classList.remove('show');
}

async function confirmAdopt() {
  const name = document.getElementById('inputName').value.trim();
  const phone = document.getElementById('inputPhone').value.trim();
  if (!name) return showToast('请输入姓名', 'error');
  if (!/^1\d{10}$/.test(phone)) return showToast('请输入正确手机号', 'error');

  const btn = document.getElementById('confirmAdoptBtn');
  btn.disabled = true;
  btn.textContent = '提交中...';

  try {
    // 再次确认孩子未被认领
    const fresh = await getRecord(FEISHU_CONFIG.TABLE_CHILDREN, currentChild.id);
    if (fresh['状态'] === '已认领') {
      closeAdoptModal();
      showToast('该孩子已被别人抢先认领了', 'error');
      loadChild(currentChild.id);
      return;
    }

    const adopterId = 'ADP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const now = Date.now();

    // 更新孩子状态 & 创建认领记录（并行）
    await Promise.all([
      updateRecord(FEISHU_CONFIG.TABLE_CHILDREN, currentChild.id, {
        '状态': '已认领',
        '认领人ID': adopterId,
        '认领人姓名': name,
        '认领时间': now,
      }),
      createRecord(FEISHU_CONFIG.TABLE_ADOPTIONS, {
        '孩子姓名': currentChild.name,
        '认领人姓名': name,
        '认领人手机': phone,
        '认领人ID': adopterId,
        '认领时间': now,
      }),
    ]);

    saveUserInfo(name, phone);
    setUserId(adopterId);
    closeAdoptModal();
    showToast('认领成功！感谢您的爱心 ❤️', 'success');
    setTimeout(() => loadChild(currentChild.id), 1200);
  } catch (err) {
    showToast(err.message || '认领失败', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '确认认领';
  }
}
