import { _decorator, Component, Node, Vec3, Canvas, UITransform, view, Camera, Widget } from 'cc';
import { PetManager } from './Pet/PetManager';
import { PetType, GAME_SAVE_KEY, PET_DEFINITIONS, StudentData, PetData, GrowthStage } from './Pet/PetData';
import { UIManager, UICallbacks } from './UI/UIManager';
import { MockApiService } from './Api/MockApiService';
import { EffectManager } from './Effect/EffectManager';
import { StoryManager } from './Story/StoryManager';
import { UpgradePathManager } from './UpgradePath/UpgradePathManager';
import { GrowthData } from './Growth/GrowthSystem';

const { ccclass } = _decorator;

@ccclass('Main')
export class Main extends Component {
    private api: MockApiService = new MockApiService();
    private petManager: PetManager | null = null;
    private uiManager: UIManager | null = null;
    private effectManager: EffectManager | null = null;
    private storyManager: StoryManager | null = null;
    private upgradePathManager: UpgradePathManager = new UpgradePathManager();
    private growthData: GrowthData = new GrowthData();
    private uiUpdateTimer: number = 0;
    private canvasNode: Node | null = null;
    private currentStudentId: string | null = null;
    private currentPetData: PetData | null = null;
    private students: StudentData[] = [];
    private isLoggedIn: boolean = false;

    start() {
        this.canvasNode = this.findCanvasNode();
        if (this.canvasNode) {
            this.canvasNode.setPosition(0, 0, 0);
            const ut = this.canvasNode.getComponent(UITransform);
            if (ut) {
                ut.setContentSize(960, 640);
            }
            const children = this.canvasNode.children;
            for (let i = 0; i < children.length; i++) {
                const cam = children[i].getComponent(Camera);
                if (cam) {
                    cam.orthoHeight = 320;
                    break;
                }
            }
        }

        this.effectManager = new EffectManager(this.canvasNode || this.node);
        this.storyManager = new StoryManager(this.canvasNode || this.node);

        this.api.getUpgradePaths().then(res => {
            if (res.code === 0 && res.data) {
                for (const path of res.data) {
                    this.upgradePathManager.addPath(path);
                }
            }
        });

        const callbacks: UICallbacks = {
            onSelectStudent: this.onSelectStudent.bind(this),
            onTease: this.onTease.bind(this),
            onPlay: this.onPlay.bind(this),
            onSleep: this.onSleep.bind(this),
            onFeed: this.onFeed.bind(this),
            onShopPurchase: this.onShopPurchase.bind(this),
            onHeal: this.onHeal.bind(this),
            onRevive: this.onRevive.bind(this),
            onAddStudent: this.onAddStudent.bind(this),
            onDeleteStudent: this.onDeleteStudent.bind(this),
            onRenamePet: this.onRenamePet.bind(this),
            onUploadPetImage: this.onUploadPetImage.bind(this),
            onSetUpgradePath: this.onSetUpgradePath.bind(this),
            onTeacherAddDiamond: this.onTeacherAddDiamond.bind(this),
            onTeacherReduceDiamond: this.onTeacherReduceDiamond.bind(this),
            onTeacherAddMedal: this.onTeacherAddMedal.bind(this),
            onTeacherTransferDiamond: this.onTeacherTransferDiamond.bind(this),
            onBatchDiamond: this.onBatchDiamond.bind(this),
            onBatchMedal: this.onBatchMedal.bind(this),
            onCreatePet: this.onCreatePet.bind(this),
        };

        const rootNode = this.canvasNode || this.node;
        this.uiManager = new UIManager(rootNode, callbacks);
        this.uiManager.setEffectManager(this.effectManager);
        this.uiManager.createUI();

        const penguinArea = this.uiManager.getPenguinArea();
        this.petManager = new PetManager(penguinArea);
        this.petManager.setBasePosition(new Vec3(0, -30, 0));

        this.loadStudentList();

        this.api.getStudents().then(res => {
            if (res.code === 0 && res.data && res.data.length === 0) {
                this.api.generateMockStudents(5).then(() => {
                    this.loadStudentList();
                });
            }
        });

        this.isLoggedIn = true;
        if (this.isLoggedIn) {
            this.uiManager.showTeacherPanel();
        }
    }

    update(dt: number) {
        if (this.petManager) {
            this.petManager.update(dt);
        }
        this.uiUpdateTimer += dt;
        if (this.uiUpdateTimer >= 0.5) {
            this.uiUpdateTimer = 0;
            this.updateUI();
            this.api.syncAllData();
        }
    }

    private async onSelectStudent(studentId: string): Promise<void> {
        this.currentStudentId = studentId;
        const res = await this.api.getPet(studentId);
        if (res.code === 0 && res.data) {
            this.currentPetData = res.data;
            this.syncPetToManager(res.data);
            this.updateUI();
        } else {
            this.currentPetData = null;
            if (this.uiManager) {
                this.uiManager.showCreatePetPanel(studentId);
            }
        }
    }

    private async onTease(): Promise<void> {
        if (!this.currentStudentId) return;
        const res = await this.api.petAction(this.currentStudentId, 'tease');
        if (res.code === 0 && res.data) {
            this.petManager?.tease();
            this.currentPetData = res.data.pet;
            this.updateUI();
        }
    }

    private async onPlay(): Promise<void> {
        if (!this.currentStudentId) return;
        const res = await this.api.petAction(this.currentStudentId, 'play');
        if (res.code === 0 && res.data) {
            this.petManager?.play();
            this.currentPetData = res.data.pet;
            this.updateUI();
        }
    }

    private async onSleep(): Promise<void> {
        if (!this.currentStudentId) return;
        const res = await this.api.petAction(this.currentStudentId, 'sleep');
        if (res.code === 0 && res.data) {
            this.petManager?.sleep();
            this.currentPetData = res.data.pet;
            this.updateUI();
        }
    }

    private async onFeed(): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.feedPet(this.currentStudentId);
        if (res.code === 0 && res.data) {
            this.petManager?.feed();
            const { expGained, medalBonus, pet } = res.data;
            this.currentPetData = pet;
            if (this.effectManager) {
                this.effectManager.playExpGain(0, 80, expGained);
            }
            const prevStage = this.growthData.stage;
            this.growthData.addExp(expGained);
            if (this.growthData.stage > prevStage && this.petManager) {
                this.petManager.evolve(this.growthData);
                this.uiManager.showToast(`恭喜！宠物进化为【${this.growthData.stageName}】！`);
                if (this.effectManager) {
                    this.effectManager.playEvolution(0, -30);
                }
            } else {
                this.uiManager.showToast(`喂食成功！获得 ${expGained} 经验值`);
            }
        } else {
            this.uiManager.showToast(res.message || '喂食失败');
        }
        this.updateUI();
    }

    private async onShopPurchase(itemId: string): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.purchaseItem(this.currentStudentId, itemId);
        if (res.code === 0 && res.data) {
            const { item, remainingDiamond, pet } = res.data;
            this.uiManager.showToast(`购买成功！获得 ${item.name}`);
            if (this.effectManager) {
                this.effectManager.playDiamondDrop(0, 200, 3);
            }
            if (pet) {
                this.currentPetData = pet;
                this.syncPetToManager(pet);
            }
        } else {
            this.uiManager.showToast(res.message || '购买失败');
        }
        this.updateUI();
    }

    private async onHeal(amount: number): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.petAction(this.currentStudentId, 'heal', { healAmount: amount });
        if (res.code === 0 && res.data) {
            this.petManager?.heal(amount);
            this.currentPetData = res.data.pet;
            this.uiManager.showToast(`治疗成功！恢复${amount}健康值，消耗${res.data.diamondCost}钻石`);
            if (this.effectManager) {
                this.effectManager.playHealEffect(0, -30);
            }
        } else {
            this.uiManager.showToast(res.message || '治疗失败');
        }
        this.updateUI();
    }

    private async onRevive(): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.petAction(this.currentStudentId, 'revive');
        if (res.code === 0 && res.data) {
            this.petManager?.revive();
            this.currentPetData = res.data.pet;
            this.uiManager.showToast('宠物复活成功！');
            if (this.effectManager) {
                this.effectManager.playHealEffect(0, -30);
            }
        } else {
            this.uiManager.showToast(res.message || '复活失败');
        }
        this.updateUI();
    }

    private async onAddStudent(name: string): Promise<void> {
        const res = await this.api.addStudent(name);
        if (res.code === 0) {
            this.loadStudentList();
        } else {
            this.uiManager?.showToast(res.message || '添加学生失败');
        }
    }

    private async onDeleteStudent(studentId: string): Promise<void> {
        const res = await this.api.deleteStudent(studentId);
        if (res.code === 0) {
            if (this.currentStudentId === studentId) {
                this.currentStudentId = null;
                this.currentPetData = null;
            }
            this.loadStudentList();
        } else {
            this.uiManager?.showToast(res.message || '删除学生失败');
        }
    }

    private async onRenamePet(name: string): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.updatePet(this.currentStudentId, { customName: name });
        if (res.code === 0 && res.data) {
            this.currentPetData = res.data;
            this.uiManager.showToast('宠物改名成功！');
        } else {
            this.uiManager.showToast(res.message || '改名失败');
        }
        this.updateUI();
    }

    private async onUploadPetImage(imageDataUrl: string): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.uploadPetImage(this.currentStudentId, imageDataUrl);
        if (res.code === 0) {
            if (this.currentPetData) {
                this.currentPetData.customImageUrl = imageDataUrl;
            }
            this.uiManager.showToast('宠物形象更新成功！');
        } else {
            this.uiManager.showToast(res.message || '上传失败');
        }
        this.updateUI();
    }

    private async onSetUpgradePath(pathId: string): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.updatePet(this.currentStudentId, { upgradePathId: pathId });
        if (res.code === 0 && res.data) {
            this.currentPetData = res.data;
            this.upgradePathManager.setActivePath(pathId);
            this.uiManager.showToast('进化路线已更新！');
        } else {
            this.uiManager.showToast(res.message || '设置失败');
        }
        this.updateUI();
    }

    private async onTeacherAddDiamond(amount: number): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.addDiamond(this.currentStudentId, amount);
        if (res.code === 0) {
            this.uiManager.showToast(`发放${amount}钻石成功！`);
            if (this.effectManager) {
                this.effectManager.playDiamondDrop(0, 200, Math.min(amount, 10));
            }
        } else {
            this.uiManager.showToast(res.message || '发放失败');
        }
        this.updateUI();
    }

    private async onTeacherReduceDiamond(amount: number): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.reduceDiamond(this.currentStudentId, amount);
        if (res.code === 0) {
            this.uiManager.showToast(`扣减${amount}钻石成功！`);
        } else {
            this.uiManager.showToast(res.message || '扣减失败');
        }
        this.updateUI();
    }

    private async onTeacherAddMedal(medalId: string): Promise<void> {
        if (!this.currentStudentId || !this.uiManager) return;
        const res = await this.api.addMedal(this.currentStudentId, medalId);
        if (res.code === 0) {
            this.uiManager.showToast('勋章发放成功！');
            if (this.effectManager) {
                this.effectManager.playMedalEarn(0, 100);
            }
        } else {
            this.uiManager.showToast(res.message || '发放失败');
        }
        this.updateUI();
    }

    private async onTeacherTransferDiamond(fromId: string, toId: string, amount: number): Promise<void> {
        if (!this.uiManager) return;
        const res = await this.api.transferDiamond(fromId, toId, amount);
        if (res.code === 0) {
            this.uiManager.showToast(`转送${amount}钻石成功！`);
        } else {
            this.uiManager.showToast(res.message || '转送失败');
        }
        this.updateUI();
    }

    private async onBatchDiamond(studentIds: string[], amount: number, action: string): Promise<void> {
        if (!this.uiManager) return;
        const res = await this.api.batchDiamond(studentIds, amount, action);
        if (res.code === 0) {
            this.uiManager.showToast(`批量${action === 'add' ? '发放' : '扣减'}钻石成功！`);
        } else {
            this.uiManager.showToast(res.message || '批量操作失败');
        }
        this.updateUI();
    }

    private async onBatchMedal(studentIds: string[], medalId: string): Promise<void> {
        if (!this.uiManager) return;
        const res = await this.api.batchMedal(studentIds, medalId);
        if (res.code === 0) {
            this.uiManager.showToast('批量发放勋章成功！');
        } else {
            this.uiManager.showToast(res.message || '批量操作失败');
        }
        this.updateUI();
    }

    private async onCreatePet(studentId: string, customName: string, petType: PetType): Promise<void> {
        if (!this.uiManager) return;
        const res = await this.api.createPet(studentId, customName, petType);
        if (res.code === 0 && res.data) {
            if (studentId === this.currentStudentId) {
                this.currentPetData = res.data;
                this.syncPetToManager(res.data);
            }
            this.uiManager.showToast(`创建宠物【${customName}】成功！`);
        } else {
            this.uiManager.showToast(res.message || '创建宠物失败');
        }
        this.updateUI();
    }

    private onPetSelected(petType: PetType): void {
        if (this.currentStudentId) {
            this.onCreatePet(this.currentStudentId, '我的宠物', petType);
        }
    }

    private onUseMedicalItem(itemId: string): void {
        this.onShopPurchase(itemId);
    }

    private findCanvasNode(): Node | null {
        if (this.node.getComponent(Canvas)) return this.node;
        if (this.node.parent && this.node.parent.getComponent(Canvas)) return this.node.parent;
        let p = this.node.parent;
        while (p) {
            if (p.getComponent(Canvas)) return p;
            p = p.parent;
        }
        return null;
    }

    private async loadStudentList(): Promise<void> {
        const res = await this.api.getStudents();
        if (res.code === 0 && res.data) {
            this.students = res.data;
            if (this.uiManager) this.uiManager.setStudents(this.students);
        }
    }

    private async loadCurrentPet(): Promise<void> {
        if (!this.currentStudentId) return;
        const res = await this.api.getPet(this.currentStudentId);
        if (res.code === 0 && res.data) {
            this.currentPetData = res.data;
            this.syncPetToManager(res.data);
        } else {
            this.currentPetData = null;
        }
    }

    private async updateUI(): Promise<void> {
        if (!this.uiManager || !this.currentStudentId) return;
        let foodCount = 0;
        let diamond = 0;
        let medalCount = 0;
        const invRes = await this.api.getInventory(this.currentStudentId);
        if (invRes.code === 0 && invRes.data) {
            foodCount = invRes.data.items.length;
        }
        const diaRes = await this.api.getDiamond(this.currentStudentId);
        if (diaRes.code === 0 && diaRes.data) {
            diamond = diaRes.data.diamond;
        }
        const medalRes = await this.api.getStudentMedals(this.currentStudentId);
        if (medalRes.code === 0 && medalRes.data) {
            medalCount = medalRes.data.length;
        }
        const hunger = this.petManager?.getHunger() ?? this.currentPetData?.hunger ?? 0;
        const happiness = this.petManager?.getHappiness() ?? this.currentPetData?.happiness ?? 0;
        const health = this.currentPetData?.health ?? 100;
        this.uiManager.updateStatusBar(
            this.growthData.stageName,
            this.growthData.expProgress,
            foodCount,
            hunger,
            happiness,
            health,
            diamond,
            medalCount
        );
    }

    private syncPetToManager(pet: PetData): void {
        if (!this.petManager) return;
        this.petManager.setPetType(pet.petType);
        this.growthData.stage = pet.stage;
        this.growthData.exp = pet.totalExp;
        this.growthData.levelExp = pet.levelExp;
        this.petManager.getRenderer().setStage(pet.stage);
    }

    private refreshAll(): void {
        this.loadStudentList();
        this.loadCurrentPet();
        this.updateUI();
    }
}
