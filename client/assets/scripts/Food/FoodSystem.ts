import { FoodItemData, createFood } from '../Pet/PetData';

export class FoodSystem {
    private inventory: FoodItemData[] = [];
    private maxSlots: number = 20;

    getInventory(): FoodItemData[] {
        return this.inventory;
    }

    getCount(): number {
        return this.inventory.length;
    }

    canFeed(): boolean {
        return this.inventory.length > 0;
    }

    addFood(qrData: string): FoodItemData | null {
        if (this.inventory.length >= this.maxSlots) return null;
        const food = createFood(qrData);
        this.inventory.push(food);
        return food;
    }

    feed(): { food: FoodItemData; totalExp: number } | null {
        if (!this.canFeed()) return null;
        const food = this.inventory.shift();
        if (!food) return null;
        return { food, totalExp: food.expValue };
    }

    serialize(): object {
        return { inventory: this.inventory, maxSlots: this.maxSlots };
    }

    deserialize(data: any): void {
        if (data) {
            this.inventory = data.inventory || [];
            this.maxSlots = data.maxSlots || 20;
        }
    }
}
