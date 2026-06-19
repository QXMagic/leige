var PetApp = window.PetApp || {};

PetApp.Animations = {
  showFeedAnimation: function(studentId) {
    var card = document.querySelector('.pet-card[data-id="' + studentId + '"]');
    if (!card) return;

    var rect = card.getBoundingClientRect();
    var foods = ['🍖','🥩','🍎','🧀','🍰','🥕','🌽','🐟'];
    for (var i = 0; i < 3; i++) {
      var el = document.createElement('div');
      el.className = 'feed-animation';
      el.textContent = foods[Math.floor(Math.random() * foods.length)];
      el.style.left = (rect.left + rect.width/2 - 16 + (Math.random()-0.5)*40) + 'px';
      el.style.top = (rect.top + rect.height/2) + 'px';
      document.body.appendChild(el);
      setTimeout(function(e){ e.remove(); }, 1000, el);
    }
  },

  showLevelUpAnimation: function(evolvedStudents) {
    var overlay = document.getElementById('levelUpOverlay');
    var card = document.getElementById('levelUpCard');
    var first = evolvedStudents[0];
    var s = first.student;
    var type = PetApp.Logic.getPetType(s.petType);
    var stageIdx = PetApp.Logic.getStageIndex(s.level);
    var stageNames = PetApp.CONFIG.STAGE_NAMES;

    var html = '';
    if (evolvedStudents.length === 1) {
      html += '<div class="lu-emoji">' + PetApp.Logic.getEmoji(s) + '</div>';
      html += '<div class="lu-title">🎉 升级啦！</div>';
      html += '<div class="lu-subtitle">' + PetApp.Utils.escapeHtml(s.name) + ' 的' + type.name + '升到了 Lv.' + s.level + '</div>';
      html += '<div class="lu-new-emoji">' + type.emojis[stageIdx] + '</div>';
      html += '<div class="lu-subtitle">进化为 ' + stageNames[stageIdx] + '！</div>';
    } else {
      html += '<div class="lu-emoji">🎉</div>';
      html += '<div class="lu-title">集体升级！</div>';
      html += '<div class="lu-subtitle">' + evolvedStudents.length + ' 只宠物同时升级！</div>';
    }
    card.innerHTML = html;
    overlay.classList.add('show');

    PetApp.Animations.spawnParticles();

    var dur = (PetApp.state.settings.animDuration || 2) * 1000;
    setTimeout(function() {
      overlay.classList.remove('show');
    }, dur);
  },

  spawnParticles: function() {
    var container = document.getElementById('particles');
    container.innerHTML = '';
    var emojis = ['⭐','🌟','✨','💫','🎉','🎊','💖','🌈'];
    for (var i = 0; i < 24; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 40) + '%';
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.fontSize = (14 + Math.random() * 18) + 'px';
      container.appendChild(p);
      setTimeout(function(el){ el.remove(); }, 2000, p);
    }
  }
};

window.PetApp = PetApp;
