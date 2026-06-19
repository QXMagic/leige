var PetApp = window.PetApp || {};

PetApp.init = function() {
  PetApp.StateManager.init();
  PetApp.Render.renderAll();

  document.getElementById('settingsModal').addEventListener('click', function(e) {
    if (e.target === this) PetApp.Modals.closeSettings();
  });
  document.getElementById('nameModal').addEventListener('click', function(e) {
    if (e.target === this) PetApp.Modals.closeNameModal();
  });
  document.getElementById('petTypeModal').addEventListener('click', function(e) {
    if (e.target === this) PetApp.Modals.closePetTypeModal();
  });
  document.getElementById('confirmModal').addEventListener('click', function(e) {
    if (e.target === this) PetApp.Modals.closeConfirmModal();
  });
  document.getElementById('levelUpOverlay').addEventListener('click', function() {
    this.classList.remove('show');
  });
  document.getElementById('nameInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') PetApp.Modals.confirmNameChange();
  });
  document.getElementById('importFileInput').addEventListener('change', function(event) {
    PetApp.Modals.handleImport(event);
  });
};

PetApp.init();

window.PetApp = PetApp;
