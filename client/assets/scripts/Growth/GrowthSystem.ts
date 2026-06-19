import { GrowthStage, DEFAULT_STAGE_NAMES, DEFAULT_STAGE_EXP_REQ, DEFAULT_STAGE_SCALES } from '../Pet/PetData';

export { GrowthStage };
export const STAGE_NAMES = DEFAULT_STAGE_NAMES;
export const STAGE_EXP_REQ = DEFAULT_STAGE_EXP_REQ;
export const STAGE_SCALES = DEFAULT_STAGE_SCALES;

export class GrowthData {
    stage: GrowthStage = GrowthStage.EGG;
    exp: number = 0;
    levelExp: number = 0;

    get stageName(): string {
        return STAGE_NAMES[this.stage];
    }

    get scale(): number {
        return STAGE_SCALES[this.stage];
    }

    get expProgress(): number {
        if (this.stage >= GrowthStage.LEGEND) return 1.0;
        const req = STAGE_EXP_REQ[this.stage];
        if (req <= 0) return 1.0;
        return Math.min(this.levelExp / req, 1.0);
    }

    get isMaxStage(): boolean {
        return this.stage >= GrowthStage.LEGEND;
    }

    addExp(amount: number): boolean {
        if (this.isMaxStage) return false;
        this.exp += amount;
        this.levelExp += amount;
        if (this.levelExp >= STAGE_EXP_REQ[this.stage]) {
            this.levelExp -= STAGE_EXP_REQ[this.stage];
            this.stage = Math.min(this.stage + 1, GrowthStage.LEGEND) as GrowthStage;
            return true;
        }
        return false;
    }

    serialize(): object {
        return { stage: this.stage, exp: this.exp, levelExp: this.levelExp };
    }

    deserialize(data: any): void {
        if (data) {
            this.stage = data.stage ?? GrowthStage.EGG;
            this.exp = data.exp ?? 0;
            this.levelExp = data.levelExp ?? 0;
        }
    }
}
