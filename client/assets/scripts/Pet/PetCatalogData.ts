/**
 * 宠物图鉴数据类型(对应服务端 /api/pet/* 接口)
 * 宠物资料由后台 pet_config 配置;「积分」即用户 energy 能量。
 * 解锁规则:积分达标即解锁,不扣减积分。
 */

/** 宠物固定数值属性 */
export interface PetAttributes {
    attack: number;
    defense: number;
    speed: number;
    hp: number;
}

/** 品质枚举(与后台 PetEnum 对齐) */
export enum PetQuality {
    NORMAL = 1,
    RARE = 2,
    EPIC = 3,
    LEGEND = 4,
}

/** 品质颜色(RGBA),供图鉴 UI 渲染品质边框/标签 */
export const QUALITY_COLORS: Record<number, [number, number, number]> = {
    [PetQuality.NORMAL]: [150, 158, 170],
    [PetQuality.RARE]: [64, 158, 255],
    [PetQuality.EPIC]: [165, 94, 234],
    [PetQuality.LEGEND]: [245, 166, 35],
};

/** 单个宠物(图鉴项) */
export interface CatalogPet {
    id: number;
    name: string;
    /** 宠物图片完整URL(后台上传) */
    image: string;
    quality: number;
    qualityDesc: string;
    attributes: PetAttributes;
    /** 解锁所需积分 */
    unlockEnergy: number;
    /** 当前用户是否已解锁 */
    isUnlocked: boolean;
    /** 当前积分是否达标可解锁 */
    canUnlock: boolean;
    /** 解锁时间戳(未解锁为0) */
    unlockedTime: number;
}

/** 图鉴聚合结果 */
export interface PetCatalog {
    /** 我的积分(能量) */
    energy: number;
    list: CatalogPet[];
}

/** 将服务端 snake_case 字段映射为前端 CatalogPet */
export function mapServerPet(raw: any): CatalogPet {
    const attrs = raw.attributes || {};
    return {
        id: Number(raw.id) || 0,
        name: String(raw.name ?? ''),
        image: String(raw.image ?? ''),
        quality: Number(raw.quality) || PetQuality.NORMAL,
        qualityDesc: String(raw.quality_desc ?? ''),
        attributes: {
            attack: Number(attrs.attack) || 0,
            defense: Number(attrs.defense) || 0,
            speed: Number(attrs.speed) || 0,
            hp: Number(attrs.hp) || 0,
        },
        unlockEnergy: Number(raw.unlock_energy) || 0,
        isUnlocked: !!raw.is_unlocked,
        canUnlock: !!raw.can_unlock,
        unlockedTime: Number(raw.unlocked_time) || 0,
    };
}

export function mapServerCatalog(data: any): PetCatalog {
    const list = Array.isArray(data?.list) ? data.list.map(mapServerPet) : [];
    return { energy: Number(data?.energy) || 0, list };
}
