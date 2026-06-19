export enum PetType {
    PENGUIN = 'penguin',
    CAT = 'cat',
    DOG = 'dog',
    RABBIT = 'rabbit',
    DRAGON = 'dragon',
    CUSTOM = 'custom',
}

export enum PetState {
    IDLE,
    HAPPY,
    HUNGRY,
    PLAYING,
    SLEEPING,
    TEASED,
    EATING,
    SICK,
}

export enum GrowthStage {
    EGG = 0,
    BABY = 1,
    CHILD = 2,
    ADULT = 3,
    LEGEND = 4,
}

export enum HealthStatus {
    HEALTHY,
    HUNGRY,
    SICK,
    CRITICAL,
}

export const DEFAULT_STAGE_NAMES = ['蛋蛋', '幼年', '少年', '成年', '传说'];
export const DEFAULT_STAGE_EXP_REQ = [30, 100, 200, 400, 999999];
export const DEFAULT_STAGE_SCALES = [0.5, 0.65, 0.8, 1.0, 1.15];

export interface UpgradeStage {
    stage: GrowthStage;
    name: string;
    expRequired: number;
    scale: number;
    unlockedSkills: string[];
}

export interface UpgradePath {
    pathId: string;
    name: string;
    description: string;
    stages: UpgradeStage[];
}

export const DEFAULT_UPGRADE_PATH: UpgradePath = {
    pathId: 'default',
    name: '默认路线',
    description: '标准成长路线',
    stages: [
        { stage: GrowthStage.EGG, name: '蛋蛋', expRequired: 30, scale: 0.5, unlockedSkills: [] },
        { stage: GrowthStage.BABY, name: '幼年', expRequired: 100, scale: 0.65, unlockedSkills: [] },
        { stage: GrowthStage.CHILD, name: '少年', expRequired: 200, scale: 0.8, unlockedSkills: ['领结'] },
        { stage: GrowthStage.ADULT, name: '成年', expRequired: 400, scale: 1.0, unlockedSkills: ['围巾'] },
        { stage: GrowthStage.LEGEND, name: '传说', expRequired: 999999, scale: 1.15, unlockedSkills: ['皇冠'] },
    ],
};

export const PET_DEFINITIONS = [
    { type: PetType.PENGUIN, name: '企鹅', description: '来自X星球冰晶海岸,擅长游泳', origin: 'X星球冰晶海岸' },
    { type: PetType.CAT, name: '猫咪', description: '来自X星球月光森林，敏捷灵活', origin: 'X星球月光森林' },
    { type: PetType.DOG, name: '小狗', description: '来自X星球阳光草原，忠诚勇敢', origin: 'X星球阳光草原' },
    { type: PetType.RABBIT, name: '兔子', description: '来自X星球花语山谷，温柔可爱', origin: 'X星球花语山谷' },
    { type: PetType.DRAGON, name: '小龙', description: '来自X星球烈焰山脉，潜力无限', origin: 'X星球烈焰山脉' },
];

export interface StudentData {
    studentId: string;
    name: string;
    avatar: string | null;
    createdAt: string;
}

export interface PetData {
    petId: string;
    studentId: string;
    customName: string;
    petType: PetType;
    customImageUrl: string | null;
    stage: GrowthStage;
    exp: number;
    levelExp: number;
    totalExp: number;
    hunger: number;
    happiness: number;
    health: number;
    diamond: number;
    upgradePathId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FoodItemData {
    id: string;
    name: string;
    qrData: string;
    expValue: number;
}

export interface ShopItemData {
    id: string;
    name: string;
    description: string;
    diamondCost: number;
    category: 'food' | 'medical' | 'evolution';
    effectValue: number;
    effectType: 'exp' | 'hunger' | 'happiness' | 'health';
}

export interface MedalData {
    id: string;
    name: string;
    description: string;
    bonusExp: number;
    bonusAttribute?: number;
}

export interface PlayerMedalData {
    medalId: string;
    earnedAt: string;
}

export const GAME_SAVE_KEY = 'pet_game_save_v2';

export const MEDAL_DEFINITIONS: MedalData[] = [
    { id: 'medal_class_star', name: '课堂之星', description: '课堂表现优异', bonusExp: 20 },
    { id: 'medal_homework_master', name: '作业达人', description: '作业完成出色', bonusExp: 15 },
    { id: 'medal_sports_hero', name: '运动健将', description: '体育活动突出', bonusExp: 10, bonusAttribute: 5 },
    { id: 'medal_art_genius', name: '艺术天才', description: '艺术才能出众', bonusExp: 10, bonusAttribute: 5 },
    { id: 'medal_helper', name: '助人为乐', description: '乐于帮助同学', bonusExp: 15, bonusAttribute: 3 },
    { id: 'medal_progress_star', name: '进步之星', description: '进步显著', bonusExp: 25 },
];

export const SHOP_ITEMS: ShopItemData[] = [
    { id: 'shop_healing_potion', name: '治疗药水', description: '恢复40点健康', diamondCost: 8, category: 'medical', effectValue: 40, effectType: 'health' },
    { id: 'shop_vitamin', name: '维生素', description: '恢复20点健康', diamondCost: 5, category: 'medical', effectValue: 20, effectType: 'health' },
    { id: 'shop_exp_boost', name: '经验加速卡', description: '获得80点经验', diamondCost: 15, category: 'evolution', effectValue: 80, effectType: 'exp' },
    { id: 'shop_evolution_stone', name: '进化石', description: '获得200点经验', diamondCost: 30, category: 'evolution', effectValue: 200, effectType: 'exp' },
    { id: 'shop_vitality_candy', name: '活力糖果', description: '恢复30点饱食度', diamondCost: 3, category: 'evolution', effectValue: 30, effectType: 'hunger' },
];

const FOOD_NAMES = ['月光果', '寒霜鱼', '幽蓝虾', '冰晶虫', '暗影藻', '星辰露', '碧波贝', '霜降莲',
    '烈焰虫', '骄阳鱼', '赤炎虾', '金光果', '炽热藻', '朝阳露', '琥珀贝', '炎阳莲'];

let _foodIdCounter = 0;

export function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

export function createFood(qrData: string): FoodItemData {
    _foodIdCounter++;
    const hash = simpleHash(qrData);
    const nameIndex = hash % FOOD_NAMES.length;
    return {
        id: `food_${_foodIdCounter}_${Date.now()}`,
        name: FOOD_NAMES[nameIndex],
        qrData,
        expValue: 15 + (hash % 25),
    };
}

export function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
