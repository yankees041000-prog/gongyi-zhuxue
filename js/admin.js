/**
 * 管理后台
 */
let allChildrenData = [];
let editingChildId = null;

// ==================== 登录 ====================
function login() {
  const pwd = document.getElementById('pwdInput').value;
  if (pwd === ADMIN_PASSWORD) {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('adminMain').style.display = 'block';
    initTabs();
    loadAdminChildren();
  } else {
    showToast('密码错误', 'error');
  }
}

// ==================== 标签切换 ====================
function initTabs() {
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');

      if (tab.dataset.tab === 'children') loadAdminChildren();
      if (tab.dataset.tab === 'adoptions') loadAdoptions();
    });
  });
}

// ==================== 孩子管理列表 ====================
async function loadAdminChildren() {
  const box = document.getElementById('adminChildList');
  box.innerHTML = '<div class="loading">加载中...</div>';
  try {
    const res = await listRecords(FEISHU_CONFIG.TABLE_CHILDREN, { page_size: 150 });
    allChildrenData = res.items;

    if (!allChildrenData.length) {
      box.innerHTML = '<div class="empty-state"><p>暂无孩子，去「添加孩子」标签添加第一个吧</p></div>';
      return;
    }

    box.innerHTML = allChildrenData.map((c) => {
      const photo = getPhotoUrl(c['照片']);
      return `
      <div class="child-admin-item">
        <img src="${photo || PHOTO_PLACEHOLDER}" alt="" onerror="this.src=PHOTO_PLACEHOLDER">
        <div class="info">
          <div class="name">${c['姓名'] || ''} <span style="font-size:11px;color:${c['状态'] === '已认领' ? '#999' : '#52c41a'}">${c['状态'] || ''}</span></div>
          <div class="meta">${c['年龄'] || ''}岁 | ${c['年级'] || ''} | ${c['地区'] || ''}</div>
          ${c['状态'] === '已认领' ? '<div class="meta">认领人：' + (c['认领人姓名'] || '') + '</div>' : ''}
        </div>
        <div class="actions">
          <button class="btn-sm btn-outline" onclick="editChild(\'' + c.id + '\')">编辑</button>
          <button class="btn-sm btn-danger" onclick="deleteChild(\'' + c.id + '\', \'' + (c['姓名'] || '') + '\')">删除</button>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    box.innerHTML = '<div class="empty-state"><p>加载失败：' + err.message + '</p></div>';
  }
}

// ==================== 添加/编辑孩子 ====================
function editChild(id) {
  const child = allChildrenData.find((c) => c.id === id);
  if (!child) return;

  // 切换到添加标签
  document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
  document.querySelector('.admin-tab[data-tab="add"]').classList.add('active');
  document.getElementById('panel-add').classList.add('active');

  editingChildId = id;
  document.getElementById('formTitle').textContent = '✏️ 编辑孩子';
  document.getElementById('editChildId').value = id;
  document.getElementById('fName').value = child['姓名'] || '';
  document.getElementById('fAge').value = child['年龄'] || '';
  document.getElementById('fGrade').value = child['年级'] || '';
  document.getElementById('fSchool').value = child['学校'] || '';
  document.getElementById('fRegion').value = child['地区'] || '';
  document.getElementById('fDesc').value = child['个人情况'] || '';
  document.getElementById('fWish').value = child['小心愿'] || '';
  document.getElementById('fScores').value = child['成绩'] || '';
  document.getElementById('fStatus').value = child['状态'] || '待认领';

  const photoUrl = getPhotoUrl(child['照片']);
  const preview = document.getElementById('fPhotoPreview');
  if (photoUrl) {
    preview.src = photoUrl;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }

  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  document.getElementById('childExtraPanel').style.display = 'block';
  loadChildExtras(child['姓名'] || '');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  editingChildId = null;
  document.getElementById('formTitle').textContent = '➕ 添加孩子';
  document.getElementById('editChildId').value = '';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('childExtraPanel').style.display = 'none';
  ['fName','fAge','fGrade','fSchool','fRegion','fDesc','fWish','fScores'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.getElementById('fStatus').value = '待认领';
  document.getElementById('fPhoto').value = '';
  document.getElementById('fPhotoPreview').style.display = 'none';
}

async function submitChild() {
  const name = document.getElementById('fName').value.trim();
  if (!name) return showToast('请输入姓名', 'error');

  const btn = document.getElementById('submitChildBtn');
  btn.disabled = true;
  btn.textContent = '保存中...';

  try {
    const fields = {
      '姓名': name,
      '年龄': parseInt(document.getElementById('fAge').value) || 0,
      '年级': document.getElementById('fGrade').value.trim(),
      '学校': document.getElementById('fSchool').value.trim(),
      '地区': document.getElementById('fRegion').value.trim(),
      '个人情况': document.getElementById('fDesc').value.trim(),
      '小心愿': document.getElementById('fWish').value.trim(),
      '成绩': document.getElementById('fScores').value.trim(),
      '状态': document.getElementById('fStatus').value,
    };

    // 处理照片上传
    const photoFile = document.getElementById('fPhoto').files[0];
    if (photoFile) {
      const uploadResult = await uploadImage(photoFile);
      fields['照片'] = [{ file_token: uploadResult.fileToken, url: uploadResult.url, name: uploadResult.name }];
    }

    if (editingChildId) {
      await updateRecord(FEISHU_CONFIG.TABLE_CHILDREN, editingChildId, fields);
      showToast('修改成功', 'success');
    } else {
      await createRecord(FEISHU_CONFIG.TABLE_CHILDREN, fields);
      showToast('添加成功', 'success');
    }

    cancelEdit();
    loadAdminChildren();
  } catch (err) {
    showToast('保存失败：' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '保 存';
  }
}

async function deleteChild(id, name) {
  if (!confirm('确定删除「' + name + '」吗？此操作不可恢复！')) return;
  try {
    await deleteRecord(FEISHU_CONFIG.TABLE_CHILDREN, id);
    showToast('已删除', 'success');
    loadAdminChildren();
  } catch (err) {
    showToast('删除失败：' + err.message, 'error');
  }
}

// ==================== 近况照片 ====================
async function loadChildExtras(childName) {
  if (!childName) return;
  const box = document.getElementById('updateList');
  try {
    const res = await listRecords(FEISHU_CONFIG.TABLE_UPDATES, {
      page_size: 20,
      filter: `CurrentValue.[孩子姓名]="${childName}"`,
    });
    box.innerHTML = (res.items || []).map((u) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px">
        <img src="${getPhotoUrl(u['照片'])}" class="preview-img" onerror="this.style.display='none'">
        <span style="flex:1">${u['描述'] || ''}</span>
        <button class="btn-sm btn-danger" style="padding:4px 8px;font-size:11px" onclick="deleteUpdate('${u.id}')">删</button>
      </div>`).join('') || '<div style="font-size:13px;color:#999">暂无近况照片</div>';
  } catch (err) {
    box.innerHTML = '<div style="color:red;font-size:13px">加载失败</div>';
  }
}

async function uploadUpdate() {
  const childName = getEditingChildName();
  if (!childName) return showToast('请先保存孩子信息', 'error');

  const file = document.getElementById('updatePhoto').files[0];
  if (!file) return showToast('请选择照片', 'error');

  const desc = document.getElementById('updateDesc').value.trim();
  try {
    const result = await uploadImage(file);
    await createRecord(FEISHU_CONFIG.TABLE_UPDATES, {
      '孩子姓名': childName,
      '照片': [{ file_token: result.fileToken, url: result.url, name: result.name }],
      '描述': desc,
      '更新时间': Date.now(),
    });
    showToast('近况照片上传成功', 'success');
    document.getElementById('updatePhoto').value = '';
    document.getElementById('updateDesc').value = '';
    loadChildExtras(childName);
  } catch (err) {
    showToast('上传失败：' + err.message, 'error');
  }
}

async function deleteUpdate(id) {
  if (!confirm('删除这张照片？')) return;
  try {
    await deleteRecord(FEISHU_CONFIG.TABLE_UPDATES, id);
    showToast('已删除');
    loadChildExtras(getEditingChildName());
  } catch (err) {
    showToast('删除失败', 'error');
  }
}

// ==================== 感谢信 ====================
async function addThanks() {
  const childName = getEditingChildName();
  if (!childName) return showToast('请先保存孩子信息', 'error');

  const content = document.getElementById('thanksContent').value.trim();
  const type = document.getElementById('thanksType').value;
  if (!content && type === '文字') return showToast('请输入感谢信内容', 'error');

  try {
    const fields = {
      '孩子姓名': childName,
      '内容': content,
      '类型': type,
      '创建时间': Date.now(),
    };

    // 如果是图片类型，先上传图片
    if (type === '图片') {
      const photoFile = document.getElementById('thanksPhoto').files[0];
      if (photoFile) {
        const result = await uploadImage(photoFile);
        fields['图片'] = [{ file_token: result.fileToken, url: result.url, name: result.name }];
      }
    }

    await createRecord(FEISHU_CONFIG.TABLE_THANKS, fields);
    showToast('感谢信添加成功', 'success');
    document.getElementById('thanksContent').value = '';
    document.getElementById('thanksPhoto').value = '';
  } catch (err) {
    showToast('添加失败：' + err.message, 'error');
  }
}

function getEditingChildName() {
  return document.getElementById('fName').value.trim();
}

// ==================== 认领记录 ====================
async function loadAdoptions() {
  const box = document.getElementById('adminAdoptions');
  box.innerHTML = '<div class="loading">加载中...</div>';
  try {
    const res = await listRecords(FEISHU_CONFIG.TABLE_ADOPTIONS, { page_size: 200 });
    const items = res.items || [];

    if (!items.length) {
      box.innerHTML = '<div class="empty-state"><p>暂无认领记录</p></div>';
      return;
    }

    box.innerHTML = `
      <div style="overflow-x:auto">
        <table class="adopt-table">
          <thead><tr><th>孩子</th><th>认领人</th><th>手机</th><th>时间</th></tr></thead>
          <tbody>
            ${items.map((a) => `
              <tr>
                <td>${a['孩子姓名'] || ''}</td>
                <td>${a['认领人姓名'] || ''}</td>
                <td>${a['认领人手机'] || ''}</td>
                <td>${formatTime(a['认领时间'])}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    box.innerHTML = '<div class="empty-state"><p>加载失败：' + err.message + '</p></div>';
  }
}
