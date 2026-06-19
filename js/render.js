var PetApp = window.PetApp || {};

PetApp.Render = {
  grid: function() {
    var grid = document.getElementById('petGrid');
    var html = '';
    var stageClasses = PetApp.CONFIG.STAGE_CLASSES;
    var stageNames = PetApp.CONFIG.STAGE_NAMES;

    PetApp.state.students.forEach(function(s, idx) {
      var stage = PetApp.Logic.getStage(s.level);
      var emoji = PetApp.Logic.getEmoji(s);
      var expPct = PetApp.Logic.getExpPercent(s.feedCount);
      var isSelected = PetApp.state.selectedIds.indexOf(s.id) >= 0;
      var stageIdx = PetApp.Logic.getStageIndex(s.level);
      var delay = (idx % 8) * 0.1;

      html += '<div class="pet-card' + (isSelected ? ' selected' : '') + '" data-id="' + s.id + '" data-stage="' + stage + '" onclick="PetApp.Render.toggleSelect(' + s.id + ')">';
      html += '<div class="check-mark">✓</div>';
      html += '<div class="student-name">' + PetApp.Utils.escapeHtml(s.name) + '</div>';
      html += '<div class="pet-emoji idle" id="petEmoji' + s.id + '" style="animation-delay:' + delay + 's">' + emoji + '</div>';
      html += '<div class="level-badge ' + stageClasses[stageIdx] + '">Lv.' + s.level + '</div>';
      html += '<div class="stage-label ' + stageClasses[stageIdx] + '">' + stageNames[stageIdx] + '</div>';
      html += '<div class="exp-bar"><div class="exp-fill ' + stageClasses[stageIdx] + '" style="width:' + expPct + '%"></div></div>';
      html += '<div class="feed-count"><span class="food-icon">🍖</span>' + s.feedCount + '</div>';
      html += '</div>';
    });
    grid.innerHTML = html;
  },

  quickFeed: function() {
    var container = document.getElementById('quickFeedGrid');
    var html = '';
    PetApp.CONFIG.PET_TYPES.forEach(function(t) {
      var count = PetApp.state.students.filter(function(s){ return s.petType===t.id; }).length;
      html += '<div class="quick-feed-item" onclick="PetApp.Render.selectByType(\'' + t.id + '\')">';
      html += '<div class="qf-emoji">' + t.emojis[0] + '</div>';
      html += '<div class="qf-name">' + t.name + '</div>';
      html += '<div class="qf-val">' + count + '只</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  },

  stats: function() {
    var stats = PetApp.Logic.getStats();

    document.getElementById('totalFeedCount').textContent = stats.totalFeeds;
    document.getElementById('todayFeedCount').textContent = stats.todayFeeds;
    document.getElementById('highLevelCount').textContent = stats.highLevel;

    var grid = document.getElementById('statsGrid');
    grid.innerHTML =
      '<div class="stat-item"><div class="si-val" style="color:var(--primary)">' + stats.avgLevel + '</div><div class="si-label">平均等级</div></div>' +
      '<div class="stat-item"><div class="si-val" style="color:var(--secondary)">' + stats.maxLevel + '</div><div class="si-label">最高等级</div></div>' +
      '<div class="stat-item"><div class="si-val" style="color:var(--accent-dark)">' + stats.highLevel + '</div><div class="si-label">高级宠物(≥5)</div></div>' +
      '<div class="stat-item"><div class="si-val" style="color:var(--purple)">' + stats.todayFeeds + '</div><div class="si-label">今日投喂</div></div>';

    PetApp.Charts.drawLevelChart();
    PetApp.Charts.drawTypeChart();
  },

  detail: function(student) {
    var panel = document.getElementById('detailPanel');
    panel.style.display = 'block';

    var type = PetApp.Logic.getPetType(student.petType);
    var stageIdx = PetApp.Logic.getStageIndex(student.level);
    var expPct = PetApp.Logic.getExpPercent(student.feedCount);
    var stageNames = PetApp.CONFIG.STAGE_NAMES;

    var html = '';
    html += '<div class="detail-emoji">' + PetApp.Logic.getEmoji(student) + '</div>';
    html += '<div class="detail-name">' + PetApp.Utils.escapeHtml(student.name) + '</div>';
    html += '<div class="detail-type">' + type.name + ' · ' + stageNames[stageIdx] + '</div>';
    html += '<div class="detail-stats">';
    html += '<div class="detail-stat"><div class="ds-label">等级</div><div class="ds-value primary">Lv.' + student.level + '</div></div>';
    html += '<div class="detail-stat"><div class="ds-label">投喂次数</div><div class="ds-value secondary">' + student.feedCount + '</div></div>';
    html += '<div class="detail-stat"><div class="ds-label">经验进度</div><div class="ds-value accent">' + expPct + '%</div></div>';
    html += '<div class="detail-stat"><div class="ds-label">进化阶段</div><div class="ds-value purple">' + stageNames[stageIdx] + '</div></div>';
    html += '</div>';

    html += '<div class="evolution-path">';
    html += '<div class="evo-title">进化路线</div>';
    html += '<div class="evo-steps">';
    for (var i = 0; i < 4; i++) {
      if (i > 0) html += '<div class="evo-arrow">→</div>';
      html += '<div class="evo-step' + (i === stageIdx ? ' current' : '') + '">';
      html += '<div class="evo-emoji">' + type.emojis[i] + '</div>';
      html += '<div class="evo-lv">' + stageNames[i] + '</div>';
      html += '</div>';
    }
    html += '</div></div>';

    html += '<div style="margin-top:10px;display:flex;gap:6px">';
    html += '<button class="btn btn-sm btn-ghost" onclick="PetApp.Modals.editName(' + student.id + ')" style="flex:1">✏️ 改名</button>';
    html += '<button class="btn btn-sm btn-ghost" onclick="PetApp.Modals.changePetType(' + student.id + ')" style="flex:1">🔄 换宠</button>';
    html += '</div>';

    document.getElementById('petDetail').innerHTML = html;
  },

  toggleSelect: function(id) {
    var idx = PetApp.state.selectedIds.indexOf(id);
    if (idx >= 0) {
      PetApp.state.selectedIds.splice(idx, 1);
    } else {
      PetApp.state.selectedIds.push(id);
    }
    PetApp.Render.updateSelection();
  },

  updateSelection: function() {
    var cards = document.querySelectorAll('.pet-card');
    cards.forEach(function(card) {
      var id = parseInt(card.dataset.id);
      if (PetApp.state.selectedIds.indexOf(id) >= 0) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    var info = document.getElementById('selectedInfo');
    if (PetApp.state.selectedIds.length === 0) {
      info.textContent = '点击宠物卡片选择投喂对象';
    } else if (PetApp.state.selectedIds.length === 1) {
      var s = PetApp.StateManager.findStudent(PetApp.state.selectedIds[0]);
      info.textContent = '已选择: ' + s.name + ' 的' + PetApp.Logic.getPetTypeName(s.petType);
      PetApp.Render.detail(s);
    } else {
      info.textContent = '已选择 ' + PetApp.state.selectedIds.length + ' 只宠物';
      document.getElementById('detailPanel').style.display = 'none';
    }
  },

  selectAll: function() {
    PetApp.state.selectedIds = PetApp.state.students.map(function(s){ return s.id; });
    PetApp.Render.updateSelection();
  },

  clearSelection: function() {
    PetApp.state.selectedIds = [];
    PetApp.Render.updateSelection();
    document.getElementById('detailPanel').style.display = 'none';
  },

  selectByType: function(typeId) {
    PetApp.state.selectedIds = PetApp.state.students.filter(function(s){ return s.petType === typeId; }).map(function(s){ return s.id; });
    PetApp.Render.updateSelection();
    PetApp.Utils.showToast('已选择所有' + PetApp.Logic.getPetTypeName(typeId));
  },

  feedSelected: function(amount) {
    if (PetApp.state.selectedIds.length === 0) {
      PetApp.Utils.showToast('请先选择要投喂的宠物');
      return;
    }

    var evolvedStudents = PetApp.Logic.feed(PetApp.state.selectedIds, amount);

    PetApp.state.selectedIds.forEach(function(id) {
      PetApp.Animations.showFeedAnimation(id);
    });

    PetApp.Render.grid();
    PetApp.Render.stats();
    PetApp.Render.updateSelection();

    if (evolvedStudents.length > 0) {
      setTimeout(function() {
        PetApp.Animations.showLevelUpAnimation(evolvedStudents);
      }, 400);
    }

    PetApp.Utils.showToast('已投喂 ' + PetApp.state.selectedIds.length + ' 只宠物 ×' + amount);
  },

  switchStatsTab: function(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(c){ c.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'level') setTimeout(PetApp.Charts.drawLevelChart, 50);
    if (tab === 'type') setTimeout(PetApp.Charts.drawTypeChart, 50);
  },

  renderAll: function() {
    PetApp.Render.grid();
    PetApp.Render.quickFeed();
    PetApp.Render.stats();
  }
};

window.PetApp = PetApp;
