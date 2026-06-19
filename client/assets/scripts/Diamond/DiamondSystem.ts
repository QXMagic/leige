export class DiamondSystem {
    private diamond: number = 0;

    getDiamond(): number {
        return this.diamond;
    }

    addDiamond(amount: number): void {
        if (amount <= 0) {
            return;
        }
        this.diamond += amount;
    }

    reduceDiamond(amount: number): boolean {
        if (amount <= 0) {
            return false;
        }
        if (this.diamond < amount) {
            return false;
        }
        this.diamond -= amount;
        return true;
    }

    canAfford(cost: number): boolean {
        return this.diamond >= cost;
    }

    transferTo(target: DiamondSystem, amount: number): boolean {
        if (!this.reduceDiamond(amount)) {
            return false;
        }
        target.addDiamond(amount);
        return true;
    }

    serialize(): object {
        return { diamond: this.diamond };
    }

    deserialize(data: any): void {
        this.diamond = data.diamond;
    }
}
