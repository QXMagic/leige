import {
    StudentData, PetData, FoodItemData, MedalData,
    PlayerMedalData, ShopItemData, UpgradePath, PetType,
} from '../Pet/PetData';
import { HttpClient } from './HttpClient';

/**
 * 真实服务端 ApiService —— 与 MockApiService 接口一致的替代实现。
 *
 * 设计:启动时游客登录 + 一次性 /game/snapshot 水合整盘数据到内存缓存;
 * 读方法走缓存(让每 0.5s 的 UI 刷新零网络),写方法打服务端并把返回合并回缓存。
 * 服务端为权威方,所有业务规则在 GameLogic 计算。
 *
 * 学生名单为只读:增删改请在后台「学生管理」中维护。
 */

export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T | null;
}

interface CacheData {
    students: StudentData[];
    pets: Record<string, PetData>;
    inventories: Record<string, FoodItemData[]>;
    medals: Record<string, PlayerMedalData[]>;
    diamonds: Record<string, number>;
    upgradePaths: UpgradePath[];
    medalDefinitions: MedalData[];
    shopItems: ShopItemData[];
}

export class RealApiService {
    private http = new HttpClient();
    private data: CacheData = {
        students: [], pets: {}, inventories: {}, medals: {},
        diamonds: {}, upgradePaths: [], medalDefinitions: [], shopItems: [],
    };
    private readyPromise: Promise<boolean> | null = null;

    setBaseUrl(url: string): void {
        this.http.setBaseUrl(url);
    }

    // ---------------- 水合 ----------------

    private ready(): Promise<boolean> {
        if (!this.readyPromise) {
            this.readyPromise = this.hydrate();
        }
        return this.readyPromise;
    }

    private async hydrate(): Promise<boolean> {
        const res = await this.http.request<any>('GET', '/game/snapshot');
        if (!res.ok || !res.data) return false;
        const d = res.data;
        this.data = {
            students: d.students || [],
            pets: d.pets || {},
            inventories: d.inventories || {},
            medals: d.medals || {},
            diamonds: d.diamonds || {},
            upgradePaths: d.upgradePaths || [],
            medalDefinitions: d.medalDefinitions || [],
            shopItems: d.shopItems || [],
        };
        return true;
    }

    /** 手动重新拉取整盘数据 */
    async refresh(): Promise<ApiResponse<null>> {
        this.readyPromise = this.hydrate();
        const ok = await this.readyPromise;
        return ok ? this.ok(null) : this.err('刷新失败');
    }

    private ok<T>(data: T): ApiResponse<T> {
        return { code: 0, message: 'success', data };
    }

    private err(message: string, code = 400): ApiResponse<null> {
        return { code, message, data: null };
    }

    private async guard(): Promise<ApiResponse<null> | null> {
        const r = await this.ready();
        return r ? null : this.err('无法连接服务器');
    }

    // ---------------- 学生(只读) ----------------

    async getStudents(): Promise<ApiResponse<StudentData[]>> {
        const g = await this.guard(); if (g) return g as any;
        return this.ok([...this.data.students]);
    }

    async addStudent(_name?: string, _avatar?: string): Promise<ApiResponse<StudentData>> {
        return this.err('学生请在后台「学生管理」中添加') as any;
    }
    async updateStudent(_studentId?: string, _name?: string, _avatar?: string): Promise<ApiResponse<StudentData>> {
        return this.err('学生请在后台「学生管理」中编辑') as any;
    }
    async deleteStudent(_studentId?: string): Promise<ApiResponse<null>> {
        return this.err('学生请在后台「学生管理」中删除');
    }
    async generateMockStudents(_count?: number): Promise<ApiResponse<StudentData[]>> {
        return this.err('学生请在后台「学生管理」中维护') as any;
    }

    // ---------------- 宠物 ----------------

    async getPet(studentId: string): Promise<ApiResponse<PetData | null>> {
        const g = await this.guard(); if (g) return g as any;
        return this.ok(this.data.pets[studentId] || null);
    }

    async createPet(studentId: string, customName: string, petType: PetType, customImageUrl?: string, upgradePathId?: string): Promise<ApiResponse<PetData>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<PetData>('POST', '/game/petCreate', {
            student_id: studentId, customName, petType, customImageUrl: customImageUrl || null,
            upgradePathId: upgradePathId || 'default',
        });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        this.data.pets[studentId] = res.data;
        return this.ok(res.data);
    }

    async updatePet(studentId: string, updates: Partial<PetData>): Promise<ApiResponse<PetData>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<PetData>('POST', '/game/petUpdate', { student_id: studentId, updates });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        this.data.pets[studentId] = res.data;
        this.data.diamonds[studentId] = res.data.diamond;
        return this.ok(res.data);
    }

    async petAction(studentId: string, action: string, params?: any): Promise<ApiResponse<any>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<any>('POST', '/game/petAction', { student_id: studentId, action, params: params || {} });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        const result = res.data;
        if (result.pet) {
            this.data.pets[studentId] = result.pet;
            this.data.diamonds[studentId] = result.pet.diamond;
        }
        if (action === 'feed') {
            const inv = this.data.inventories[studentId] || [];
            inv.shift();
            this.data.inventories[studentId] = inv;
        }
        return this.ok(result);
    }

    async feedPet(studentId: string): Promise<ApiResponse<any>> {
        return this.petAction(studentId, 'feed');
    }

    async uploadPetImage(studentId: string, imageDataUrl: string): Promise<ApiResponse<{ url: string }>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<any>('POST', '/game/petUploadImage', { student_id: studentId, imageUrl: imageDataUrl });
        if (!res.ok) return this.err(res.msg) as any;
        const pet = this.data.pets[studentId];
        if (pet) pet.customImageUrl = imageDataUrl;
        return this.ok({ url: imageDataUrl });
    }

    // ---------------- 背包 ----------------

    async getInventory(studentId: string): Promise<ApiResponse<{ items: FoodItemData[]; maxSlots: number }>> {
        const g = await this.guard(); if (g) return g as any;
        return this.ok({ items: this.data.inventories[studentId] || [], maxSlots: 20 });
    }

    async addFoodToInventory(studentId: string, qrData: string): Promise<ApiResponse<FoodItemData>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<FoodItemData>('POST', '/game/addFood', { student_id: studentId, qrData });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        if (!this.data.inventories[studentId]) this.data.inventories[studentId] = [];
        this.data.inventories[studentId].push(res.data);
        return this.ok(res.data);
    }

    // ---------------- 钻石 ----------------

    async getDiamond(studentId: string): Promise<ApiResponse<{ diamond: number }>> {
        const g = await this.guard(); if (g) return g as any;
        return this.ok({ diamond: this.data.diamonds[studentId] || 0 });
    }

    async addDiamond(studentId: string, amount: number): Promise<ApiResponse<{ diamond: number }>> {
        return this.diamondMut('/game/diamondAdd', { student_id: studentId, amount }, studentId);
    }

    async reduceDiamond(studentId: string, amount: number): Promise<ApiResponse<{ diamond: number }>> {
        return this.diamondMut('/game/diamondReduce', { student_id: studentId, amount }, studentId);
    }

    private async diamondMut(path: string, payload: any, studentId: string): Promise<ApiResponse<{ diamond: number }>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<{ diamond: number }>('POST', path, payload);
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        this.data.diamonds[studentId] = res.data.diamond;
        return this.ok(res.data);
    }

    async transferDiamond(fromStudentId: string, toStudentId: string, amount: number): Promise<ApiResponse<{ fromDiamond: number; toDiamond: number }>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<any>('POST', '/game/diamondTransfer', {
            from_student_id: fromStudentId, to_student_id: toStudentId, amount,
        });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        this.data.diamonds[fromStudentId] = res.data.fromDiamond;
        this.data.diamonds[toStudentId] = res.data.toDiamond;
        return this.ok(res.data);
    }

    async batchDiamond(studentIds: string[], amount: number, action: string): Promise<ApiResponse<any>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<any[]>('POST', '/game/diamondBatch', { student_ids: studentIds, amount, action });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        for (const r of res.data) this.data.diamonds[r.studentId] = r.diamond;
        return this.ok(res.data);
    }

    // ---------------- 勋章 ----------------

    async getStudentMedals(studentId: string): Promise<ApiResponse<any[]>> {
        const g = await this.guard(); if (g) return g as any;
        const player = this.data.medals[studentId] || [];
        const result = player.map((pm) => {
            const def = this.data.medalDefinitions.find((m) => m.id === pm.medalId);
            return { ...def, medalId: pm.medalId, earnedAt: pm.earnedAt };
        });
        return this.ok(result);
    }

    async addMedal(studentId: string, medalDefinitionId: string): Promise<ApiResponse<any>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<any>('POST', '/game/medalAdd', { student_id: studentId, medal_id: medalDefinitionId });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        if (!this.data.medals[studentId]) this.data.medals[studentId] = [];
        this.data.medals[studentId].push({ medalId: medalDefinitionId, earnedAt: res.data.earnedAt });
        return this.ok(res.data);
    }

    async batchMedal(studentIds: string[], medalDefinitionId: string): Promise<ApiResponse<any>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<any[]>('POST', '/game/medalBatch', { student_ids: studentIds, medal_id: medalDefinitionId });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        for (const r of res.data) {
            if (!this.data.medals[r.studentId]) this.data.medals[r.studentId] = [];
            this.data.medals[r.studentId].push({ medalId: medalDefinitionId, earnedAt: r.medal.earnedAt });
        }
        return this.ok(res.data);
    }

    async getMedalDefinitions(): Promise<ApiResponse<MedalData[]>> {
        const g = await this.guard(); if (g) return g as any;
        return this.ok([...this.data.medalDefinitions]);
    }

    // ---------------- 商店 ----------------

    async getShopItems(category?: string): Promise<ApiResponse<ShopItemData[]>> {
        const g = await this.guard(); if (g) return g as any;
        const items = category ? this.data.shopItems.filter((i) => i.category === category) : this.data.shopItems;
        return this.ok([...items]);
    }

    async purchaseItem(studentId: string, itemId: string): Promise<ApiResponse<any>> {
        const g = await this.guard(); if (g) return g as any;
        const res = await this.http.request<any>('POST', '/game/purchase', { student_id: studentId, item_id: itemId });
        if (!res.ok || !res.data) return this.err(res.msg) as any;
        this.data.diamonds[studentId] = res.data.remainingDiamond;
        if (res.data.pet) this.data.pets[studentId] = res.data.pet;
        return this.ok(res.data);
    }

    // ---------------- 进化路线 ----------------

    async getUpgradePaths(): Promise<ApiResponse<UpgradePath[]>> {
        const g = await this.guard(); if (g) return g as any;
        return this.ok([...this.data.upgradePaths]);
    }

    // ---------------- 兼容 MockApiService 的杂项 ----------------

    /** 服务端为权威方,无需主动同步;保留空实现以兼容调用。 */
    async syncAllData(): Promise<ApiResponse<null>> {
        return this.ok(null);
    }
}
