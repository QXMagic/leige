var PetApp = window.PetApp || {};

PetApp.Logic = {
  getStage: function(level) {
    if (level <= 1) return 1;
    if (level <= 3) return 2;
    if (level <= 6) return 3;
    return 4;
  },

  getStageIndex: function(level) {
    return PetApp.Logic.getStage(level) - 1;
  },

  getEmoji: function(student) {
    var type = PetApp.CONFIG.PET_TYPES.find(function(t){ return t.id === student.petType; });
    if (!type) return '🐾';
    return type.emojis[PetApp.Logic.getStageIndex(student.level)];
  },

  getLevelFromFeeds: function(feeds) {
    var thresholds = PetApp.CONFIG.LEVEL_THRESHOLDS;
    var lv = 1;
    for (var i = thresholds.length - 1; i >= 0; i--) {
      if (feeds >= thresholds[i]) { lv = i + 1; break; }
    }
    return Math.min(lv, PetApp.CONFIG.MAX_LEVEL);
  },

  getExpPercent: function(feeds) {
    var lv = PetApp.Logic.getLevelFromFeeds(feeds);
    if (lv >= PetApp.CONFIG.MAX_LEVEL) return 100;
    var thresholds = PetApp.CONFIG.LEVEL_THRESHOLDS;
    var current = thresholds[lv - 1];
    var next = thresholds[lv];
    if (next === undefined) return 100;
    return Math.min(100, Math.round(((feeds - current) / (next - current)) * 100));
  },

  getPetTypeName: function(typeId) {
    var t = PetApp.CONFIG.PET_TYPES.find(function(t){ return t.id === typeId; });
    return t ? t.name : '宠物';
  },

  getPetType: function(typeId) {
    return PetApp.CONFIG.PET_TYPES.find(function(t){ return t.id === typeId; });
  },

  feed: function(studentIds, amount) {
    var evolvedStudents = [];

    studentIds.forEach(function(id) {
      var s = PetApp.StateManager.findStudent(id);
      if (!s) return;

      var oldLevel = s.level;
      s.feedCount += amount;
      s.level = PetApp.Logic.getLevelFromFeeds(s.feedCount);

      if (s.level > oldLevel) {
        evolvedStudents.push({ student: s, oldLevel: oldLevel });
      }

      PetApp.state.feedHistory.push({
        studentId: id,
        amount: amount,
        time: Date.now()
      });
    });

    PetApp.StateManager.save();
    return evolvedStudents;
  },

  getStats: function() {
    var students = PetApp.state.students;
    var history = PetApp.state.feedHistory;

    var totalFeeds = students.reduce(function(a,s){ return a+s.feedCount; },0);
    var avgLevel = (students.reduce(function(a,s){ return a+s.level; },0) / students.length).toFixed(1);
    var maxLevel = Math.max.apply(null, students.map(function(s){ return s.level; }));
    var todayFeeds = history.filter(function(h){
      return PetApp.Utils.isToday(h.time);
    }).reduce(function(a,h){ return a+h.amount; },0);
    var highLevel = students.filter(function(s){ return s.level>=5; }).length;

    return {
      totalFeeds: totalFeeds,
      avgLevel: avgLevel,
      maxLevel: maxLevel,
      todayFeeds: todayFeeds,
      highLevel: highLevel
    };
  },

  getLevelDistribution: function() {
    var buckets = [0,0,0,0,0];
    PetApp.state.students.forEach(function(s){
      if(s.level<=2) buckets[0]++;
      else if(s.level<=4) buckets[1]++;
      else if(s.level<=6) buckets[2]++;
      else if(s.level<=8) buckets[3]++;
      else buckets[4]++;
    });
    return buckets;
  },

  getTypeDistribution: function() {
    return PetApp.CONFIG.PET_TYPES.map(function(t){
      return PetApp.state.students.filter(function(s){ return s.petType===t.id; }).length;
    });
  }
};

window.PetApp = PetApp;
