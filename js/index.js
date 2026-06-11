/**
 * 首页 —— 孩子列表
 */
let allChildren = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav('home');
  initFilters();
  loadChildren();
});

function initFilters() {
  const tags = document.querySelectorAll('.filter-tag');
  tags.forEach((btn) => {
    btn.addEventListener('click', () => {
      tags.forEach((b) => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.borderColor = '';
        b.style.color = '';
      });
      btn.classList.add('active');
      btn.style.background = '#fde8e4';
      btn.style.borderColor = '#e87461';
      btn.style.color = '#e87461';
      currentFilter = btn.dataset.filter;
      render();
    });
  });
  // 初始激活样式
  const first = document.querySelector('.filter-tag[data-filter="all"]');
  if (first) {
    first.style.background = '#fde8e4';
    first.style.borderColor = '#e87461';
    first.style.color = '#e87461';
  }
}

async function loadChildren() {
  const box = document.getElementById('childList');
  try {
    const result = await listRecords(FEISHU_CONFIG.TABLE_CHILDREN, { page_size: 150 });
    allChildren = result.items.map((r) => ({
      id: r.id,
      name: r['姓名'] || '',
      age: r['年龄'] || 0,
      grade: r['年级'] || '',
      school: r['学校'] || '',
      region: r['地区'] || '',
      description: r['个人情况'] || '',
      wish: r['小心愿'] || '',
      scores: r['成绩'] || '',
      photo: getPhotoUrl(r['照片']),
      status: r['状态'] || '待认领',
      adopterName: r['认领人姓名'] || '',
      adoptTime: r['认领时间'] || 0,
    }));

    document.getElementById('totalCount').textContent = allChildren.length;
    document.getElementById('adoptedCount').textContent = allChildren.filter((c) => c.status === '已认领').length;
    document.getElementById('availableCount').textContent = allChildren.filter((c) => c.status !== '已认领').length;

    if (!allChildren.length) {
      box.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>暂无孩子信息</p></div>';
      return;
    }
    render();
  } catch (err) {
    console.error(err);
    box.innerHTML = '<div class="empty-state"><div class="icon">😢</div><p>加载失败，请检查飞书配置后刷新</p></div>';
  }
}

function render() {
  const box = document.getElementById('childList');
  let list = allChildren;
  if (currentFilter === 'available') list = allChildren.filter((c) => c.status !== '已认领');
  if (currentFilter === 'adopted') list = allChildren.filter((c) => c.status === '已认领');

  if (!list.length) {
    box.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>暂无匹配的孩子</p></div>';
    return;
  }

  box.innerHTML = list.map((c) => `
    <a href="child.html?id=${c.id}" class="child-card">
      <img class="card-photo" src="${c.photo || PHOTO_PLACEHOLDER}" alt="${c.name}" onerror="this.src=PHOTO_PLACEHOLDER">
      <div class="card-info">
        <div class="card-name">${c.name}</div>
        <div class="card-meta"><span>${c.age}岁</span><span>${c.grade}</span><span>${c.region}</span></div>
        <div class="card-wish">${c.wish || '暂无心愿'}</div>
      </div>
      <span class="status-badge ${c.status === '已认领' ? 'adopted' : 'available'}">${c.status === '已认领' ? '已认领' : '待认领'}</span>
    </a>
  `).join('');
}
