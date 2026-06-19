import { MedalData, PlayerMedalData, MEDAL_DEFINITIONS } from '../Pet/PetData';

export class MedalSystem {
    private medals: PlayerMedalData[] = [];

    getMedals(): PlayerMedalData[] {
        return this.medals;
    }

    hasMedal(medalId: string): boolean {
        return this.medals.some(m => m.medalId === medalId);
    }

    addMedal(medalId: string): void {
        if (this.hasMedal(medalId)) {
            return;
        }
        this.medals.push({
            medalId,
            earnedAt: new Date().toISOString(),
        });
    }

    getTotalBonusExp(): number {
        let total = 0;
        for (const m of this.medals) {
            const def = MEDAL_DEFINITIONS.find(d => d.id === m.medalId);
            if (def && def.bonusExp) {
                total += def.bonusExp;
            }
        }
        return total;
    }

    getTotalBonusAttribute(): number {
        let total = 0;
        for (const m of this.medals) {
            const def = MEDAL_DEFINITIONS.find(d => d.id === m.medalId);
            if (def && def.bonusAttribute) {
                total += def.bonusAttribute;
            }
        }
        return total;
    }

    getMedalCount(): number {
        return this.medals.length;
    }

    serialize(): object {
        return { medals: this.medals };
    }

    deserialize(data: any): void {
        if (data && data.medals) {
            this.medals = data.medals;
        }
    }
}
