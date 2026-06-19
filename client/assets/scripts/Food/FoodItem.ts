export interface FoodItemData {
    id: string;
    name: string;
    qrData: string;
    expValue: number;
}

let _foodIdCounter = 0;

const FOOD_NAMES = ['月光果', '寒霜鱼', '幽蓝虾', '冰晶虫', '暗影藻', '星辰露', '碧波贝', '霜降莲',
    '烈焰虫', '骄阳鱼', '赤炎虾', '金光果', '炽热藻', '朝阳露', '琥珀贝', '炎阳莲'];

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
