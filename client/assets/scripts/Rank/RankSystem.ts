import { PetType, GrowthStage } from '../Pet/PetData';

export interface RankEntry {
    name: string;
    petType: PetType;
    stage: GrowthStage;
    totalExp: number;
    medalCount: number;
    ownerName: string;
}

export class RankSystem {
    private entries: RankEntry[] = [];
    private currentEntry: RankEntry | null = null;

    setCurrentEntry(entry: RankEntry): void {
        this.currentEntry = entry;
    }

    addEntry(entry: RankEntry): void {
        this.entries.push(entry);
    }

    getSortedEntries(): RankEntry[] {
        return [...this.entries].sort((a, b) => b.totalExp - a.totalExp);
    }

    getCurrentRank(): number {
        if (!this.currentEntry) return 0;
        const sorted = this.getSortedEntries();
        const index = sorted.findIndex(e => e === this.currentEntry);
        return index >= 0 ? index + 1 : 0;
    }

    getTopEntries(count: number): RankEntry[] {
        return this.getSortedEntries().slice(0, count);
    }

    generateMockEntries(): void {
        this.entries = [
            { name: '小强的龙', petType: PetType.DRAGON, stage: GrowthStage.LEGEND, totalExp: 9800, medalCount: 12, ownerName: '小强' },
            { name: '小明的企鹅', petType: PetType.PENGUIN, stage: GrowthStage.ADULT, totalExp: 7500, medalCount: 8, ownerName: '小明' },
            { name: '小红的猫咪', petType: PetType.CAT, stage: GrowthStage.ADULT, totalExp: 6200, medalCount: 7, ownerName: '小红' },
            { name: '小刚的小狗', petType: PetType.DOG, stage: GrowthStage.CHILD, totalExp: 4800, medalCount: 5, ownerName: '小刚' },
            { name: '小丽的兔子', petType: PetType.RABBIT, stage: GrowthStage.CHILD, totalExp: 3600, medalCount: 4, ownerName: '小丽' },
            { name: '小华的企鹅', petType: PetType.PENGUIN, stage: GrowthStage.BABY, totalExp: 2200, medalCount: 3, ownerName: '小华' },
            { name: '小芳的猫咪', petType: PetType.CAT, stage: GrowthStage.BABY, totalExp: 1500, medalCount: 2, ownerName: '小芳' },
            { name: '小军的小狗', petType: PetType.DOG, stage: GrowthStage.EGG, totalExp: 500, medalCount: 1, ownerName: '小军' },
        ];
    }

    serialize(): object {
        return {
            entries: this.entries,
            currentEntry: this.currentEntry,
        };
    }

    deserialize(data: any): void {
        if (data) {
            this.entries = data.entries ?? [];
            this.currentEntry = data.currentEntry ?? null;
        }
    }
}
