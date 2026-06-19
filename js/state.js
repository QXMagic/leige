var PetApp = window.PetApp || {};

PetApp.state = {
  students: [],
  selectedIds: [],
  feedHistory: [],
  settings: Object.assign({}, PetApp.CONFIG.DEFAULT_SETTINGS)
};

PetApp.StateManager = {
  init: function() {
    var saved = localStorage.getItem(PetApp.CONFIG.STORAGE_KEY);
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        PetApp.state.students = parsed.students || [];
        PetApp.state.feedHistory = parsed.feedHistory || [];
        PetApp.state.settings = parsed.settings || PetApp.CONFIG.DEFAULT_SETTINGS;
        if (PetApp.state.students.length === PetApp.CONFIG.STUDENT_COUNT) return;
      } catch(e) {}
    }
    PetApp.StateManager.createDefaultData();
  },

  createDefaultData: function() {
    PetApp.state.students = [];
    for (var i = 0; i < PetApp.CONFIG.STUDENT_COUNT; i++) {
      PetApp.state.students.push({
        id: i + 1,
        name: '同学' + (i + 1),
        petType: PetApp.CONFIG.PET_TYPES[i % 6].id,
        feedCount: 0,
        level: 1,
        createdAt: Date.now()
      });
    }
    PetApp.state.feedHistory = [];
    PetApp.StateManager.save();
  },

  save: function() {
    localStorage.setItem(PetApp.CONFIG.STORAGE_KEY, JSON.stringify({
      students: PetApp.state.students,
      feedHistory: PetApp.state.feedHistory.slice(-PetApp.CONFIG.MAX_HISTORY),
      settings: PetApp.state.settings
    }));
  },

  reset: function() {
    localStorage.removeItem(PetApp.CONFIG.STORAGE_KEY);
    PetApp.state.selectedIds = [];
    PetApp.StateManager.createDefaultData();
  },

  findStudent: function(id) {
    return PetApp.state.students.find(function(s){ return s.id === id; });
  },

  exportJSON: function() {
    return JSON.stringify({
      students: PetApp.state.students,
      feedHistory: PetApp.state.feedHistory,
      settings: PetApp.state.settings,
      exportTime: new Date().toISOString()
    }, null, 2);
  },

  importJSON: function(jsonStr, callback) {
    try {
      var data = JSON.parse(jsonStr);
      if (data.students && data.students.length === PetApp.CONFIG.STUDENT_COUNT) {
        PetApp.state.students = data.students;
        PetApp.state.feedHistory = data.feedHistory || [];
        PetApp.state.settings = data.settings || PetApp.CONFIG.DEFAULT_SETTINGS;
        PetApp.StateManager.save();
        if (callback) callback(true);
        return;
      }
    } catch(err) {}
    if (callback) callback(false);
  }
};

window.PetApp = PetApp;
