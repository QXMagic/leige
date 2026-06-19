var PetApp = window.PetApp || {};

PetApp.CONFIG = {
  PET_TYPES: [
    { id:'cat', name:'小猫', emojis:['🐱','🐈','🐅','🦁'], color:'#FF6B6B', evoDesc:'猫→灵猫→虎→狮王' },
    { id:'dog', name:'小狗', emojis:['🐶','🐕','🐺','🦊'], color:'#4ECDC4', evoDesc:'狗→猎犬→狼→灵狐' },
    { id:'rabbit', name:'小兔', emojis:['🐰','🐇','🦌','🦄'], color:'#E91E8F', evoDesc:'兔→大白兔→鹿→独角兽' },
    { id:'fish', name:'小鱼', emojis:['🐟','🐠','🐡','🐋'], color:'#3498DB', evoDesc:'鱼→热带鱼→河豚→鲸鱼' },
    { id:'bird', name:'小鸟', emojis:['🐦','🐧','🦅','🦚'], color:'#FF8C42', evoDesc:'鸟→企鹅→鹰→孔雀' },
    { id:'dragon', name:'小龙', emojis:['🐲','🐉','🦖','🔮'], color:'#9B59B6', evoDesc:'龙→飞龙→恐龙→神龙' }
  ],

  STAGE_NAMES: ['蛋宝宝','小萌宠','少年体','终极体'],
  STAGE_CLASSES: ['s1','s2','s3','s4'],

  LEVEL_THRESHOLDS: [0,3,8,15,25,38,55,75,100,130],
  MAX_LEVEL: 10,
  STUDENT_COUNT: 48,

  STORAGE_KEY: 'petAdoptionData',
  MAX_HISTORY: 5000,

  DEFAULT_SETTINGS: {
    feedExp: 1,
    animDuration: 2
  }
};

window.PetApp = PetApp;
