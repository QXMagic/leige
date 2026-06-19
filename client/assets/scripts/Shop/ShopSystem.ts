import { ShopItemData, SHOP_ITEMS, FoodItemData, createFood } from '../Pet/PetData';
import { DiamondSystem } from '../Diamond/DiamondSystem';

export class ShopSystem {
    private diamondSystem: DiamondSystem;
    private purchaseRecords: Map<string, number> = new Map();

    constructor(diamondSystem: DiamondSystem) {
        this.diamondSystem = diamondSystem;
    }

    getShopItems(): ShopItemData[] {
        return SHOP_ITEMS;
    }

    getItemsByCategory(category: string): ShopItemData[] {
        return SHOP_ITEMS.filter(item => item.category === category);
    }

    purchase(itemId: string): { success: boolean; message: string; item?: ShopItemData } {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) {
            return { success: false, message: '商品不存在' };
        }
        if (!this.diamondSystem.canAfford(item.diamondCost)) {
            return { success: false, message: '钻石不足' };
        }
        const deducted = this.diamondSystem.reduceDiamond(item.diamondCost);
        if (!deducted) {
            return { success: false, message: '扣减钻石失败' };
        }
        const count = this.purchaseRecords.get(itemId) || 0;
        this.purchaseRecords.set(itemId, count + 1);
        return { success: true, message: '购买成功', item };
    }

    purchaseFood(itemId: string): { success: boolean; message: string; food?: FoodItemData } {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) {
            return { success: false, message: '商品不存在' };
        }
        if (item.category !== 'food') {
            return { success: false, message: '该商品不是食物类' };
        }
        if (!this.diamondSystem.canAfford(item.diamondCost)) {
            return { success: false, message: '钻石不足' };
        }
        const deducted = this.diamondSystem.reduceDiamond(item.diamondCost);
        if (!deducted) {
            return { success: false, message: '扣减钻石失败' };
        }
        const food = createFood(itemId);
        const count = this.purchaseRecords.get(itemId) || 0;
        this.purchaseRecords.set(itemId, count + 1);
        return { success: true, message: '购买食物成功', food };
    }

    serialize(): object {
        const records: { [key: string]: number } = {};
        this.purchaseRecords.forEach((count, itemId) => {
            records[itemId] = count;
        });
        return { purchaseRecords: records };
    }

    deserialize(data: any): void {
        if (data && data.purchaseRecords) {
            this.purchaseRecords = new Map<string, number>();
            const records = data.purchaseRecords;
            for (const key of Object.keys(records)) {
                this.purchaseRecords.set(key, records[key]);
            }
        }
    }
}
