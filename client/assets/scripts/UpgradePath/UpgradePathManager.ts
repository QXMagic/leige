import { UpgradePath, UpgradeStage, GrowthStage, DEFAULT_UPGRADE_PATH } from '../Pet/PetData';

export class UpgradePathManager {
    private paths: UpgradePath[] = [DEFAULT_UPGRADE_PATH];
    private activePathId: string = 'default';

    getPaths(): UpgradePath[] {
        return this.paths;
    }

    getActivePath(): UpgradePath {
        return this.getPathById(this.activePathId) || DEFAULT_UPGRADE_PATH;
    }

    setActivePath(pathId: string): boolean {
        if (this.getPathById(pathId)) {
            this.activePathId = pathId;
            return true;
        }
        return false;
    }

    getPathById(pathId: string): UpgradePath | null {
        return this.paths.find(p => p.pathId === pathId) || null;
    }

    addPath(path: UpgradePath): void {
        if (!this.getPathById(path.pathId)) {
            this.paths.push(path);
        }
    }

    removePath(pathId: string): boolean {
        if (pathId === 'default') {
            return false;
        }
        const index = this.paths.findIndex(p => p.pathId === pathId);
        if (index === -1) {
            return false;
        }
        this.paths.splice(index, 1);
        if (this.activePathId === pathId) {
            this.activePathId = 'default';
        }
        return true;
    }

    updatePath(pathId: string, updates: Partial<UpgradePath>): boolean {
        const path = this.getPathById(pathId);
        if (!path) {
            return false;
        }
        Object.assign(path, updates);
        return true;
    }

    getStageName(stage: GrowthStage): string {
        const stageData = this.getActivePath().stages.find(s => s.stage === stage);
        return stageData ? stageData.name : '';
    }

    getStageExpRequired(stage: GrowthStage): number {
        const stageData = this.getActivePath().stages.find(s => s.stage === stage);
        return stageData ? stageData.expRequired : 0;
    }

    getStageScale(stage: GrowthStage): number {
        const stageData = this.getActivePath().stages.find(s => s.stage === stage);
        return stageData ? stageData.scale : 1;
    }

    getStageSkills(stage: GrowthStage): string[] {
        const stageData = this.getActivePath().stages.find(s => s.stage === stage);
        return stageData ? stageData.unlockedSkills : [];
    }

    serialize(): object {
        return {
            paths: this.paths,
            activePathId: this.activePathId,
        };
    }

    deserialize(data: any): void {
        if (data.paths && Array.isArray(data.paths)) {
            this.paths = data.paths;
        }
        if (typeof data.activePathId === 'string') {
            this.activePathId = data.activePathId;
        }
    }
}
