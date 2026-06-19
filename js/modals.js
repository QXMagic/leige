var PetApp = window.PetApp || {};

PetApp.Modals = {
  _editStudentId: null,
  _newPetType: null,
  _confirmCallback: null,

  editName: function(id) {
    var s = PetApp.StateManager.findStudent(id);
    if (!s) return;
    PetApp.Modals._editStudentId = id;
    var input = document.getElementById('nameInput');
    input.value = s.name;
    document.getElementById('nameModal').classList.add('show');
    setTimeout(function(){ input.focus(); input.select(); }, 300);
  },

  closeNameModal: function() {
    document.getElementById('nameModal').classList.remove('show');
    PetApp.Modals._editStudentId = null;
  },

  confirmNameChange: function() {
    var newName = document.getElementById('nameInput').value.trim();
    if (!newName) {
      PetApp.Utils.showToast('名称不能为空');
      return;
    }
    var s = PetApp.StateManager.findStudent(PetApp.Modals._editStudentId);
    if (s) {
      s.name = newName;
      PetApp.StateManager.save();
      PetApp.Render.grid();
      PetApp.Render.updateSelection();
      PetApp.Render.detail(s);
      PetApp.Utils.showToast('名称已更新');
    }
    PetApp.Modals.closeNameModal();
  },

  changePetType: function(id) {
    var s = PetApp.StateManager.findStudent(id);
    if (!s) return;
    PetApp.Modals._editStudentId = id;
    PetApp.Modals._newPetType = s.petType;

    var selector = document.getElementById('petTypeSelector');
    var html = '';
    PetApp.CONFIG.PET_TYPES.forEach(function(t) {
      var isSelected = t.id === s.petType;
      html += '<div class="pet-type-option' + (isSelected ? ' selected' : '') + '" data-type="' + t.id + '" onclick="PetApp.Modals.selectPetType(\'' + t.id + '\',this)">';
      html += '<div class="pto-emoji">' + t.emojis[0] + '</div>';
      html += '<div class="pto-name">' + t.name + '</div>';
      html += '<div class="pto-evo">' + t.evoDesc + '</div>';
      html += '</div>';
    });
    selector.innerHTML = html;
    document.getElementById('petTypeModal').classList.add('show');
  },

  selectPetType: function(typeId, el) {
    PetApp.Modals._newPetType = typeId;
    document.querySelectorAll('.pet-type-option').forEach(function(o){ o.classList.remove('selected'); });
    el.classList.add('selected');
  },

  closePetTypeModal: function() {
    document.getElementById('petTypeModal').classList.remove('show');
    PetApp.Modals._editStudentId = null;
    PetApp.Modals._newPetType = null;
  },

  confirmPetTypeChange: function() {
    if (!PetApp.Modals._newPetType) {
      PetApp.Utils.showToast('请选择宠物类型');
      return;
    }
    var s = PetApp.StateManager.findStudent(PetApp.Modals._editStudentId);
    if (s && s.petType !== PetApp.Modals._newPetType) {
      s.petType = PetApp.Modals._newPetType;
      PetApp.StateManager.save();
      PetApp.Render.grid();
      PetApp.Render.updateSelection();
      PetApp.Render.detail(s);
      PetApp.Utils.showToast('已更换为' + PetApp.Logic.getPetTypeName(PetApp.Modals._newPetType));
    }
    PetApp.Modals.closePetTypeModal();
  },

  showConfirm: function(title, msg, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent = msg;
    PetApp.Modals._confirmCallback = callback;
    document.getElementById('confirmBtn').onclick = function() {
      PetApp.Modals.closeConfirmModal();
      if (PetApp.Modals._confirmCallback) PetApp.Modals._confirmCallback();
    };
    document.getElementById('confirmModal').classList.add('show');
  },

  closeConfirmModal: function() {
    document.getElementById('confirmModal').classList.remove('show');
    PetApp.Modals._confirmCallback = null;
  },

  confirmReset: function() {
    PetApp.Modals.showConfirm('⚠️ 重置数据', '确定要重置所有宠物数据吗？此操作不可恢复！', function() {
      PetApp.StateManager.reset();
      PetApp.Render.renderAll();
      document.getElementById('detailPanel').style.display = 'none';
      PetApp.Utils.showToast('数据已重置');
    });
  },

  showSettings: function() {
    document.getElementById('feedExp').value = PetApp.state.settings.feedExp;
    document.getElementById('animDuration').value = PetApp.state.settings.animDuration;
    document.getElementById('settingsModal').classList.add('show');
  },

  saveSettings: function() {
    PetApp.state.settings.feedExp = parseInt(document.getElementById('feedExp').value) || 1;
    PetApp.state.settings.animDuration = parseInt(document.getElementById('animDuration').value) || 2;
    PetApp.StateManager.save();
    document.getElementById('settingsModal').classList.remove('show');
    PetApp.Utils.showToast('设置已保存');
  },

  closeSettings: function() {
    document.getElementById('settingsModal').classList.remove('show');
  },

  exportData: function() {
    var data = PetApp.StateManager.exportJSON();
    var blob = new Blob([data], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '宠物乐园数据_' + new Date().toLocaleDateString().replace(/\//g,'-') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    PetApp.Utils.showToast('数据已导出');
  },

  importData: function() {
    document.getElementById('importFileInput').click();
  },

  handleImport: function(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      PetApp.StateManager.importJSON(e.target.result, function(success) {
        if (success) {
          PetApp.Render.renderAll();
          PetApp.Utils.showToast('数据导入成功');
        } else {
          PetApp.Utils.showToast('数据格式不正确');
        }
      });
    };
    reader.readAsText(file);
    event.target.value = '';
  }
};

window.PetApp = PetApp;
