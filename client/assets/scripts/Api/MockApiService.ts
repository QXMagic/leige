import { sys } from 'cc';
import {
    StudentData, PetData, FoodItemData,
    MedalData, PlayerMedalData, ShopItemData, MEDAL_DEFINITIONS,
    SHOP_ITEMS, PetType, GrowthStage, UpgradePath, UpgradeStage,
    DEFAULT_UPGRADE_PATH, createFood, generateId, simpleHash
} from '../Pet/PetData';

export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T | null;
}

const STORAGE_KEY = 'pet_game_server_v2';

interface ServerData {
    students: StudentData[];
    pets: Record<string, PetData>;
    inventories: Record<string, FoodItemData[]>;
    medals: Record<string, PlayerMedalData[]>;
    diamonds: Record<string, number>;
    upgradePaths: UpgradePath[];
    teacherPassword: string;
}

export class MockApiService {
    private data: ServerData;
    private saveTimeout: number | null = null;

    constructor() {
        this.data = this.createDefaultData();
        this.loadData();
    }

    private createDefaultData(): ServerData {
        return {
            students: [],
            pets: {},
            inventories: {},
            medals: {},
            diamonds: {},
            upgradePaths: [{ ...DEFAULT_UPGRADE_PATH }],
            teacherPassword: '123456',
        };
    }

    private loadData(): void {
        try {
            const raw = sys.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as ServerData;
                this.data = {
                    students: parsed.students || [],
                    pets: parsed.pets || {},
                    inventories: parsed.inventories || {},
                    medals: parsed.medals || {},
                    diamonds: parsed.diamonds || {},
                    upgradePaths: parsed.upgradePaths || [{ ...DEFAULT_UPGRADE_PATH }],
                    teacherPassword: parsed.teacherPassword || '123456',
                };
            }
        } catch (e) {
            this.data = this.createDefaultData();
        }
    }

    private saveData(): void {
        if (this.saveTimeout !== null) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.immediateSave();
            this.saveTimeout = null;
        }, 300) as unknown as number;
    }

    private immediateSave(): void {
        try {
            sys.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
        }
    }

    private success<T>(data: T): ApiResponse<T> {
        return { code: 0, message: 'success', data };
    }

    private error(code: number, message: string): ApiResponse<null> {
        return { code, message, data: null };
    }

    private getPetInternal(studentId: string): PetData | null {
        return this.data.pets[studentId] || null;
    }

    private getInventoryInternal(studentId: string): FoodItemData[] {
        return this.data.inventories[studentId] || [];
    }

    private getMedalsInternal(studentId: string): PlayerMedalData[] {
        return this.data.medals[studentId] || [];
    }

    private getDiamondInternal(studentId: string): number {
        return this.data.diamonds[studentId] || 0;
    }

    private ensureStudent(studentId: string): StudentData | null {
        return this.data.students.find(s => s.studentId === studentId) || null;
    }

    private checkEvolution(pet: PetData): void {
        const path = this.data.upgradePaths.find(p => p.pathId === pet.upgradePathId) || DEFAULT_UPGRADE_PATH;
        const currentStageConfig = path.stages.find(s => s.stage === pet.stage);
        if (currentStageConfig && pet.levelExp >= currentStageConfig.expRequired && pet.stage < GrowthStage.LEGEND) {
            pet.stage = pet.stage + 1;
            pet.levelExp = 0;
        }
    }

    async teacherLogin(password: string): Promise<ApiResponse<{ token: string; teacherId: string }>> {
        if (password !== this.data.teacherPassword) {
            return this.error(401, '密码错误');
        }
        const token = `teacher_token_${Date.now()}_${simpleHash(password)}`;
        return this.success({ token, teacherId: 'teacher_001' });
    }

    async getStudents(): Promise<ApiResponse<StudentData[]>> {
        return this.success([...this.data.students]);
    }

    async addStudent(name: string, avatar?: string): Promise<ApiResponse<StudentData>> {
        const student: StudentData = {
            studentId: generateId('stu'),
            name,
            avatar: avatar || null,
            createdAt: new Date().toISOString(),
        };
        this.data.students.push(student);
        this.data.inventories[student.studentId] = [];
        this.data.medals[student.studentId] = [];
        this.data.diamonds[student.studentId] = 0;
        this.saveData();
        return this.success(student);
    }

    async updateStudent(studentId: string, name: string, avatar?: string): Promise<ApiResponse<StudentData>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        student.name = name;
        if (avatar !== undefined) {
            student.avatar = avatar;
        }
        this.saveData();
        return this.success(student);
    }

    async deleteStudent(studentId: string): Promise<ApiResponse<null>> {
        const index = this.data.students.findIndex(s => s.studentId === studentId);
        if (index === -1) {
            return this.error(404, '学生不存在');
        }
        this.data.students.splice(index, 1);
        delete this.data.pets[studentId];
        delete this.data.inventories[studentId];
        delete this.data.medals[studentId];
        delete this.data.diamonds[studentId];
        this.saveData();
        return this.success(null);
    }

    async getPet(studentId: string): Promise<ApiResponse<PetData | null>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        return this.success(this.getPetInternal(studentId));
    }

    async createPet(studentId: string, customName: string, petType: PetType, customImageUrl?: string, upgradePathId?: string): Promise<ApiResponse<PetData>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        if (this.getPetInternal(studentId)) {
            return this.error(400, '该学生已有宠物');
        }
        const now = new Date().toISOString();
        const pet: PetData = {
            petId: generateId('pet'),
            studentId,
            customName,
            petType,
            customImageUrl: customImageUrl || null,
            stage: GrowthStage.EGG,
            exp: 0,
            levelExp: 0,
            totalExp: 0,
            hunger: 80,
            happiness: 70,
            health: 100,
            diamond: 0,
            upgradePathId: upgradePathId || DEFAULT_UPGRADE_PATH.pathId,
            createdAt: now,
            updatedAt: now,
        };
        this.data.pets[studentId] = pet;
        this.saveData();
        return this.success(pet);
    }

    async updatePet(studentId: string, updates: Partial<PetData>): Promise<ApiResponse<PetData>> {
        const pet = this.getPetInternal(studentId);
        if (!pet) {
            return this.error(404, '宠物不存在');
        }
        const forbidden = ['petId', 'studentId', 'createdAt'];
        for (const key of Object.keys(updates)) {
            if (!forbidden.includes(key)) {
                (pet as any)[key] = (updates as any)[key];
            }
        }
        pet.updatedAt = new Date().toISOString();
        this.saveData();
        return this.success({ ...pet });
    }

    async petAction(studentId: string, action: string, params?: any): Promise<ApiResponse<any>> {
        const pet = this.getPetInternal(studentId);
        if (!pet) {
            return this.error(404, '宠物不存在');
        }
        switch (action) {
            case 'feed': {
                const inventory = this.getInventoryInternal(studentId);
                if (inventory.length === 0) {
                    return this.error(400, '背包中没有食物');
                }
                const foodItem = inventory.shift();
                this.data.inventories[studentId] = inventory;
                if (!foodItem) {
                    return this.error(400, '获取食物失败');
                }
                const baseExp = foodItem.expValue;
                const medals = this.getMedalsInternal(studentId);
                let medalBonus = 0;
                for (const pm of medals) {
                    const def = MEDAL_DEFINITIONS.find(m => m.id === pm.medalId);
                    if (def) {
                        medalBonus += def.bonusExp;
                    }
                }
                const totalExpGain = baseExp + medalBonus;
                pet.levelExp += totalExpGain;
                pet.totalExp += totalExpGain;
                pet.hunger = Math.min(100, pet.hunger + 35);
                pet.happiness = Math.min(100, pet.happiness + 10);
                pet.health = Math.min(100, pet.health + 5);
                pet.updatedAt = new Date().toISOString();
                this.checkEvolution(pet);
                this.saveData();
                return this.success({ expGained: totalExpGain, medalBonus, pet });
            }
            case 'play': {
                pet.happiness = Math.min(100, pet.happiness + 10);
                pet.hunger = Math.max(0, pet.hunger - 5);
                pet.updatedAt = new Date().toISOString();
                this.saveData();
                return this.success({ pet });
            }
            case 'sleep': {
                pet.hunger = Math.min(100, pet.hunger + 10);
                pet.updatedAt = new Date().toISOString();
                this.saveData();
                return this.success({ pet });
            }
            case 'tease': {
                pet.happiness = Math.min(100, pet.happiness + 5);
                pet.updatedAt = new Date().toISOString();
                this.saveData();
                return this.success({ pet });
            }
            case 'heal': {
                const healAmount = params?.healAmount || 0;
                if (healAmount <= 0) {
                    return this.error(400, '治疗量必须大于0');
                }
                const diamondCost = Math.ceil(healAmount / 3);
                const currentDiamond = this.getDiamondInternal(studentId);
                if (currentDiamond < diamondCost) {
                    return this.error(400, '钻石不足');
                }
                this.data.diamonds[studentId] = currentDiamond - diamondCost;
                pet.health = Math.min(100, pet.health + healAmount);
                pet.updatedAt = new Date().toISOString();
                this.saveData();
                return this.success({ healthGained: healAmount, diamondCost, pet });
            }
            case 'revive': {
                const currentDiamond = this.getDiamondInternal(studentId);
                if (currentDiamond < 20) {
                    return this.error(400, '钻石不足，复活需要20钻石');
                }
                this.data.diamonds[studentId] = currentDiamond - 20;
                pet.health = 50;
                pet.hunger = 50;
                pet.happiness = 50;
                pet.updatedAt = new Date().toISOString();
                this.saveData();
                return this.success({ pet });
            }
            default:
                return this.error(400, `未知操作: ${action}`);
        }
    }

    async getInventory(studentId: string): Promise<ApiResponse<{ items: FoodItemData[]; maxSlots: number }>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        return this.success({ items: this.getInventoryInternal(studentId), maxSlots: 20 });
    }

    async addFoodToInventory(studentId: string, qrData: string): Promise<ApiResponse<FoodItemData>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        const inventory = this.getInventoryInternal(studentId);
        if (inventory.length >= 20) {
            return this.error(400, '背包已满');
        }
        const food = createFood(qrData);
        inventory.push(food);
        this.data.inventories[studentId] = inventory;
        this.saveData();
        return this.success(food);
    }

    async feedPet(studentId: string): Promise<ApiResponse<any>> {
        return this.petAction(studentId, 'feed');
    }

    async getDiamond(studentId: string): Promise<ApiResponse<{ diamond: number }>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        return this.success({ diamond: this.getDiamondInternal(studentId) });
    }

    async addDiamond(studentId: string, amount: number, reason?: string): Promise<ApiResponse<{ diamond: number }>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        if (amount <= 0) {
            return this.error(400, '钻石数量必须大于0');
        }
        const current = this.getDiamondInternal(studentId);
        this.data.diamonds[studentId] = current + amount;
        this.saveData();
        return this.success({ diamond: this.data.diamonds[studentId] });
    }

    async reduceDiamond(studentId: string, amount: number, reason?: string): Promise<ApiResponse<{ diamond: number }>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        if (amount <= 0) {
            return this.error(400, '钻石数量必须大于0');
        }
        const current = this.getDiamondInternal(studentId);
        if (current < amount) {
            return this.error(400, '钻石不足');
        }
        this.data.diamonds[studentId] = current - amount;
        this.saveData();
        return this.success({ diamond: this.data.diamonds[studentId] });
    }

    async transferDiamond(fromStudentId: string, toStudentId: string, amount: number): Promise<ApiResponse<{ fromDiamond: number; toDiamond: number }>> {
        const fromStudent = this.ensureStudent(fromStudentId);
        if (!fromStudent) {
            return this.error(404, '转出学生不存在');
        }
        const toStudent = this.ensureStudent(toStudentId);
        if (!toStudent) {
            return this.error(404, '接收学生不存在');
        }
        if (amount <= 0) {
            return this.error(400, '转账数量必须大于0');
        }
        const fromDiamond = this.getDiamondInternal(fromStudentId);
        if (fromDiamond < amount) {
            return this.error(400, '钻石不足');
        }
        const toDiamond = this.getDiamondInternal(toStudentId);
        this.data.diamonds[fromStudentId] = fromDiamond - amount;
        this.data.diamonds[toStudentId] = toDiamond + amount;
        this.saveData();
        return this.success({ fromDiamond: this.data.diamonds[fromStudentId], toDiamond: this.data.diamonds[toStudentId] });
    }

    async getStudentMedals(studentId: string): Promise<ApiResponse<any[]>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        const playerMedals = this.getMedalsInternal(studentId);
        const result = playerMedals.map(pm => {
            const def = MEDAL_DEFINITIONS.find(m => m.id === pm.medalId);
            return {
                ...def,
                medalId: pm.medalId,
                earnedAt: pm.earnedAt,
            };
        });
        return this.success(result);
    }

    async addMedal(studentId: string, medalDefinitionId: string): Promise<ApiResponse<any>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        const def = MEDAL_DEFINITIONS.find(m => m.id === medalDefinitionId);
        if (!def) {
            return this.error(404, '勋章定义不存在');
        }
        const medals = this.getMedalsInternal(studentId);
        if (medals.find(m => m.medalId === medalDefinitionId)) {
            return this.error(400, '已拥有该勋章');
        }
        const playerMedal: PlayerMedalData = {
            medalId: medalDefinitionId,
            earnedAt: new Date().toISOString(),
        };
        medals.push(playerMedal);
        this.data.medals[studentId] = medals;
        this.saveData();
        return this.success({ ...def, earnedAt: playerMedal.earnedAt });
    }

    async getMedalDefinitions(): Promise<ApiResponse<MedalData[]>> {
        return this.success([...MEDAL_DEFINITIONS]);
    }

    async getShopItems(category?: string): Promise<ApiResponse<ShopItemData[]>> {
        if (category) {
            return this.success(SHOP_ITEMS.filter(item => item.category === category));
        }
        return this.success([...SHOP_ITEMS]);
    }

    async purchaseItem(studentId: string, itemId: string): Promise<ApiResponse<any>> {
        const student = this.ensureStudent(studentId);
        if (!student) {
            return this.error(404, '学生不存在');
        }
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) {
            return this.error(404, '商品不存在');
        }
        const currentDiamond = this.getDiamondInternal(studentId);
        if (currentDiamond < item.diamondCost) {
            return this.error(400, '钻石不足');
        }
        this.data.diamonds[studentId] = currentDiamond - item.diamondCost;
        const pet = this.getPetInternal(studentId);
        if (pet) {
            switch (item.effectType) {
                case 'exp':
                    pet.levelExp += item.effectValue;
                    pet.totalExp += item.effectValue;
                    this.checkEvolution(pet);
                    break;
                case 'hunger':
                    pet.hunger = Math.min(100, pet.hunger + item.effectValue);
                    break;
                case 'happiness':
                    pet.happiness = Math.min(100, pet.happiness + item.effectValue);
                    break;
                case 'health':
                    pet.health = Math.min(100, pet.health + item.effectValue);
                    break;
            }
            pet.updatedAt = new Date().toISOString();
        }
        this.saveData();
        return this.success({ item, remainingDiamond: this.data.diamonds[studentId], pet });
    }

    async getUpgradePaths(): Promise<ApiResponse<UpgradePath[]>> {
        return this.success([...this.data.upgradePaths]);
    }

    async createUpgradePath(name: string, description: string, stages: UpgradeStage[]): Promise<ApiResponse<UpgradePath>> {
        const path: UpgradePath = {
            pathId: generateId('path'),
            name,
            description,
            stages,
        };
        this.data.upgradePaths.push(path);
        this.saveData();
        return this.success(path);
    }

    async updateUpgradePath(pathId: string, updates: Partial<UpgradePath>): Promise<ApiResponse<UpgradePath>> {
        const path = this.data.upgradePaths.find(p => p.pathId === pathId);
        if (!path) {
            return this.error(404, '进化路线不存在');
        }
        if (updates.name !== undefined) path.name = updates.name;
        if (updates.description !== undefined) path.description = updates.description;
        if (updates.stages !== undefined) path.stages = updates.stages;
        this.saveData();
        return this.success({ ...path });
    }

    async deleteUpgradePath(pathId: string): Promise<ApiResponse<null>> {
        if (pathId === DEFAULT_UPGRADE_PATH.pathId) {
            return this.error(400, '不能删除默认进化路线');
        }
        const index = this.data.upgradePaths.findIndex(p => p.pathId === pathId);
        if (index === -1) {
            return this.error(404, '进化路线不存在');
        }
        this.data.upgradePaths.splice(index, 1);
        this.saveData();
        return this.success(null);
    }

    async getRankings(sortBy?: string, limit?: number): Promise<ApiResponse<any[]>> {
        const rankings = this.data.students.map(student => {
            const pet = this.getPetInternal(student.studentId);
            const medals = this.getMedalsInternal(student.studentId);
            return {
                studentId: student.studentId,
                name: student.name,
                avatar: student.avatar,
                totalExp: pet?.totalExp || 0,
                stage: pet?.stage || GrowthStage.EGG,
                medalCount: medals.length,
                petName: pet?.customName || null,
            };
        });
        const sortField = sortBy || 'totalExp';
        rankings.sort((a, b) => {
            switch (sortField) {
                case 'stage':
                    return b.stage - a.stage;
                case 'medalCount':
                    return b.medalCount - a.medalCount;
                case 'totalExp':
                default:
                    return b.totalExp - a.totalExp;
            }
        });
        const result = limit ? rankings.slice(0, limit) : rankings;
        return this.success(result);
    }

    async uploadPetImage(studentId: string, imageDataUrl: string): Promise<ApiResponse<{ url: string }>> {
        const pet = this.getPetInternal(studentId);
        if (!pet) {
            return this.error(404, '宠物不存在');
        }
        pet.customImageUrl = imageDataUrl;
        pet.updatedAt = new Date().toISOString();
        this.saveData();
        return this.success({ url: imageDataUrl });
    }

    async batchDiamond(studentIds: string[], amount: number, action: string): Promise<ApiResponse<any>> {
        const results: any[] = [];
        for (const studentId of studentIds) {
            const student = this.ensureStudent(studentId);
            if (!student) continue;
            const current = this.getDiamondInternal(studentId);
            if (action === 'add') {
                this.data.diamonds[studentId] = current + amount;
            } else if (action === 'reduce') {
                this.data.diamonds[studentId] = Math.max(0, current - amount);
            }
            results.push({ studentId, diamond: this.data.diamonds[studentId] });
        }
        this.saveData();
        return this.success(results);
    }

    async batchMedal(studentIds: string[], medalDefinitionId: string): Promise<ApiResponse<any>> {
        const def = MEDAL_DEFINITIONS.find(m => m.id === medalDefinitionId);
        if (!def) {
            return this.error(404, '勋章定义不存在');
        }
        const results: any[] = [];
        for (const studentId of studentIds) {
            const student = this.ensureStudent(studentId);
            if (!student) continue;
            const medals = this.getMedalsInternal(studentId);
            if (medals.find(m => m.medalId === medalDefinitionId)) continue;
            const playerMedal: PlayerMedalData = {
                medalId: medalDefinitionId,
                earnedAt: new Date().toISOString(),
            };
            medals.push(playerMedal);
            this.data.medals[studentId] = medals;
            results.push({ studentId, medal: { ...def, earnedAt: playerMedal.earnedAt } });
        }
        this.saveData();
        return this.success(results);
    }

    async syncAllData(): Promise<ApiResponse<null>> {
        this.immediateSave();
        return this.success(null);
    }

    async resetAllData(): Promise<ApiResponse<null>> {
        this.data = this.createDefaultData();
        try {
            sys.localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
        }
        return this.success(null);
    }

    async generateMockStudents(count: number): Promise<ApiResponse<StudentData[]>> {
        const names = ['小明', '小红', '小华', '小丽', '小刚', '小芳', '小强', '小美', '小龙', '小凤',
            '小杰', '小雪', '小磊', '小琳', '小鹏', '小云', '小涛', '小颖', '小宇', '小婷',
            '小辉', '小娟', '小峰', '小霞', '小博', '小瑶', '小勇', '小莉', '小军', '小萍'];
        const petTypes = [PetType.PENGUIN, PetType.CAT, PetType.DOG, PetType.RABBIT, PetType.DRAGON];
        const created: StudentData[] = [];
        for (let i = 0; i < count; i++) {
            const nameIndex = i % names.length;
            const student: StudentData = {
                studentId: generateId('stu'),
                name: names[nameIndex],
                avatar: null,
                createdAt: new Date().toISOString(),
            };
            this.data.students.push(student);
            this.data.inventories[student.studentId] = [];
            this.data.medals[student.studentId] = [];
            this.data.diamonds[student.studentId] = Math.floor(Math.random() * 50);
            const petType = petTypes[Math.floor(Math.random() * petTypes.length)];
            const now = new Date().toISOString();
            const pet: PetData = {
                petId: generateId('pet'),
                studentId: student.studentId,
                customName: names[nameIndex] + '的宠物',
                petType,
                customImageUrl: null,
                stage: Math.floor(Math.random() * 4) as GrowthStage,
                exp: Math.floor(Math.random() * 200),
                levelExp: Math.floor(Math.random() * 100),
                totalExp: Math.floor(Math.random() * 500),
                hunger: 50 + Math.floor(Math.random() * 50),
                happiness: 50 + Math.floor(Math.random() * 50),
                health: 50 + Math.floor(Math.random() * 50),
                diamond: 0,
                upgradePathId: DEFAULT_UPGRADE_PATH.pathId,
                createdAt: now,
                updatedAt: now,
            };
            this.data.pets[student.studentId] = pet;
            created.push(student);
        }
        this.saveData();
        return this.success(created);
    }
}
