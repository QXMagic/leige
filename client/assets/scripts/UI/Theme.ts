import { Color, Node, Label, Font, SpriteFrame } from 'cc';

/**
 * 全局 UI 主题（设计系统）。
 *
 * 目标:把配色 / 字号 / 圆角 / 间距 / 皮肤(九宫格贴图) / 字体集中到一处,
 * 让整套 UI 从这里取值,从而"换肤""换字体"只改一处即可全局生效。
 *
 * 用法:
 *  - 代码里:Theme.color('primary') / Theme.radius('md') / Theme.skin().button
 *  - 编辑器里:在场景节点挂 UISkin 组件,拖入 九宫格按钮/面板贴图 + 字体,
 *    UISkin.onLoad 会调用 Theme.setSkin() 注入;之后 UI 自动用上皮肤与字体。
 *  - UI 构建完成后调用一次 Theme.applyFontToTree(root),把字体刷到所有 Label。
 */

export interface UISkinRefs {
    uiFont: Font | null;
    panel: SpriteFrame | null;        // 面板/卡片 九宫格底图
    button: SpriteFrame | null;       // 按钮 九宫格底图
    buttonPressed: SpriteFrame | null;// 按钮按下态
    track: SpriteFrame | null;        // 进度条/血条 轨道
    fill: SpriteFrame | null;         // 进度条/血条 填充
}

type RGBA = [number, number, number, number];

/** 配色板(柔和、明快的儿童游戏风) */
const PALETTE: Record<string, RGBA> = {
    primary: [91, 140, 255, 255],
    primaryDark: [58, 107, 224, 255],
    success: [46, 204, 113, 255],
    warning: [255, 176, 32, 255],
    danger: [255, 107, 107, 255],
    accent: [165, 94, 234, 255],
    bg: [244, 246, 251, 255],
    card: [255, 255, 255, 255],
    textPrimary: [45, 49, 66, 255],
    textSecondary: [107, 114, 128, 255],
    textOnPrimary: [255, 255, 255, 255],
    border: [226, 230, 238, 255],
    track: [234, 237, 243, 255],
    shadow: [40, 44, 80, 40],
};

/** 圆角 */
const RADII: Record<string, number> = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };

/** 字号层级 */
const FONT_SIZE: Record<string, number> = { xs: 12, sm: 14, base: 16, lg: 18, xl: 22, xxl: 28 };

/** 间距 */
const SPACING: Record<string, number> = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

const EMPTY_SKIN: UISkinRefs = {
    uiFont: null, panel: null, button: null, buttonPressed: null, track: null, fill: null,
};

export class Theme {
    private static _skin: UISkinRefs = { ...EMPTY_SKIN };

    /** 由 UISkin 组件在编辑器场景里注入皮肤资源 */
    static setSkin(skin: Partial<UISkinRefs>): void {
        this._skin = { ...this._skin, ...skin };
    }

    static skin(): UISkinRefs {
        return this._skin;
    }

    /** 取配色(每次返回新 Color,避免被外部修改污染) */
    static color(name: keyof typeof PALETTE | string): Color {
        const c = PALETTE[name as string] || PALETTE.textPrimary;
        return new Color(c[0], c[1], c[2], c[3]);
    }

    static radius(name: keyof typeof RADII | string): number {
        return RADII[name as string] ?? 12;
    }

    static fontSize(name: keyof typeof FONT_SIZE | string): number {
        return FONT_SIZE[name as string] ?? 16;
    }

    static spacing(name: keyof typeof SPACING | string): number {
        return SPACING[name as string] ?? 12;
    }

    /** 当前 UI 字体(未注入则为 null,Label 用系统默认字体) */
    static get font(): Font | null {
        return this._skin.uiFont;
    }

    /**
     * 把主题字体一次性刷到节点树下所有 Label。
     * 在 UI 构建完成后调用一次即可,无需逐个 Label 设置。
     */
    static applyFontToTree(root: Node): void {
        if (!root || !this._skin.uiFont) return;
        const labels = root.getComponentsInChildren(Label);
        for (const lbl of labels) {
            lbl.font = this._skin.uiFont;
        }
    }
}
