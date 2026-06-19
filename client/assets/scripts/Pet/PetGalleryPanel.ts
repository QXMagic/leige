import {
    Node, UITransform, Graphics, Label, Color, Button,
    Sprite, SpriteFrame, ImageAsset, Texture2D, assetManager, UIOpacity,
} from 'cc';
import { PetApiService } from '../Api/PetApiService';
import { CatalogPet, PetCatalog, QUALITY_COLORS, PetQuality } from './PetCatalogData';

/**
 * 宠物图鉴面板(纯代码构建,风格与 UIManager/PetRenderer 一致)。
 * - 顶部显示我的积分(能量)
 * - 网格展示后台配置的宠物:图片/名称/品质/固定属性/解锁所需积分/解锁状态
 * - 积分达标的未解锁宠物显示「解锁」按钮;不足显示差额
 *
 * 用法:
 *   const gallery = new PetGalleryPanel(canvasNode, apiService);
 *   gallery.open();
 */
export class PetGalleryPanel {
    private root: Node;
    private contentRoot: Node | null = null;
    private api: PetApiService;
    private energyLabel: Label | null = null;
    private toastLabel: Label | null = null;
    private catalog: PetCatalog = { energy: 0, list: [] };
    private loading = false;

    // 布局参数
    private readonly PANEL_W = 720;
    private readonly PANEL_H = 540;
    private readonly CARD_W = 210;
    private readonly CARD_H = 150;
    private readonly COLS = 3;
    private readonly GAP_X = 16;
    private readonly GAP_Y = 14;

    constructor(parent: Node, api: PetApiService) {
        this.api = api;
        this.root = new Node('PetGalleryPanel');
        parent.addChild(this.root);
        this.root.addComponent(UITransform).setContentSize(960, 640);
        this.root.active = false;
    }

    /** 打开并刷新图鉴 */
    open(): void {
        this.root.active = true;
        this.build();
        this.refresh();
    }

    close(): void {
        this.root.active = false;
    }

    isOpen(): boolean {
        return this.root.active;
    }

    /** 从服务端拉取图鉴并重绘 */
    async refresh(): Promise<void> {
        if (this.loading) return;
        this.loading = true;
        this.showToast('加载中...');
        const res = await this.api.getCatalog();
        this.loading = false;
        if (res.code !== 0 || !res.data) {
            this.showToast(res.message || '加载失败');
            return;
        }
        this.catalog = res.data;
        this.hideToast();
        this.renderContent();
    }

    // ---------- 静态骨架(遮罩 + 面板 + 标题 + 关闭 + 积分) ----------
    private build(): void {
        this.root.removeAllChildren();

        // 半透明遮罩
        const overlay = new Node('Overlay');
        this.root.addChild(overlay);
        overlay.addComponent(UITransform).setContentSize(960, 640);
        const og = overlay.addComponent(Graphics);
        og.fillColor = new Color(0, 0, 0, 140);
        og.rect(-480, -320, 960, 640);
        og.fill();
        overlay.addComponent(Button);
        overlay.on(Node.EventType.TOUCH_END, (ev: any) => { ev.propagationStopped = true; }, this);

        // 面板底板
        const panel = new Node('Panel');
        this.root.addChild(panel);
        panel.addComponent(UITransform).setContentSize(this.PANEL_W, this.PANEL_H);
        const pg = panel.addComponent(Graphics);
        pg.fillColor = new Color(248, 249, 252, 255);
        pg.roundRect(-this.PANEL_W / 2, -this.PANEL_H / 2, this.PANEL_W, this.PANEL_H, 18);
        pg.fill();
        pg.strokeColor = new Color(210, 214, 222, 255);
        pg.lineWidth = 2;
        pg.roundRect(-this.PANEL_W / 2, -this.PANEL_H / 2, this.PANEL_W, this.PANEL_H, 18);
        pg.stroke();

        // 标题
        this.addLabel(panel, '宠物图鉴', 0, this.PANEL_H / 2 - 28, 240, 30, 22,
            new Color(50, 54, 66, 255), Label.HorizontalAlign.CENTER);

        // 我的积分
        this.energyLabel = this.addLabel(panel, '积分: -', this.PANEL_W / 2 - 120, this.PANEL_H / 2 - 28,
            200, 26, 17, new Color(245, 166, 35, 255), Label.HorizontalAlign.RIGHT);

        // 关闭按钮
        this.makeButton(panel, '关闭', new Color(150, 158, 170, 255), 64, 30,
            -this.PANEL_W / 2 + 50, this.PANEL_H / 2 - 28, () => this.close());

        // 内容容器(卡片网格)
        this.contentRoot = new Node('Content');
        panel.addChild(this.contentRoot);
        this.contentRoot.addComponent(UITransform).setContentSize(this.PANEL_W, this.PANEL_H - 80);
        this.contentRoot.setPosition(0, -30, 0);

        // 提示
        this.toastLabel = this.addLabel(panel, '', 0, 0, this.PANEL_W - 60, 28, 18,
            new Color(120, 124, 136, 255), Label.HorizontalAlign.CENTER);
    }

    // ---------- 动态内容(卡片) ----------
    private renderContent(): void {
        if (!this.contentRoot) return;
        this.contentRoot.removeAllChildren();

        if (this.energyLabel) {
            this.energyLabel.string = `积分: ${this.catalog.energy}`;
        }

        const startX = -((this.COLS - 1) * (this.CARD_W + this.GAP_X)) / 2;
        const startY = (this.PANEL_H - 80) / 2 - this.CARD_H / 2 - 6;

        this.catalog.list.forEach((pet, i) => {
            const col = i % this.COLS;
            const row = Math.floor(i / this.COLS);
            const x = startX + col * (this.CARD_W + this.GAP_X);
            const y = startY - row * (this.CARD_H + this.GAP_Y);
            this.renderCard(pet, x, y);
        });

        if (this.catalog.list.length === 0) {
            this.showToast('暂无宠物');
        }
    }

    private renderCard(pet: CatalogPet, x: number, y: number): void {
        if (!this.contentRoot) return;
        const card = new Node(`Pet_${pet.id}`);
        this.contentRoot.addChild(card);
        card.setPosition(x, y, 0);
        card.addComponent(UITransform).setContentSize(this.CARD_W, this.CARD_H);

        const qc = QUALITY_COLORS[pet.quality] || QUALITY_COLORS[PetQuality.NORMAL];
        const qColor = new Color(qc[0], qc[1], qc[2], 255);

        // 卡片底板 + 品质边框
        const g = card.addComponent(Graphics);
        g.fillColor = new Color(255, 255, 255, 255);
        g.roundRect(-this.CARD_W / 2, -this.CARD_H / 2, this.CARD_W, this.CARD_H, 12);
        g.fill();
        g.strokeColor = qColor;
        g.lineWidth = 2.5;
        g.roundRect(-this.CARD_W / 2, -this.CARD_H / 2, this.CARD_W, this.CARD_H, 12);
        g.stroke();

        // 未解锁则整体压暗
        if (!pet.isUnlocked) {
            const op = card.addComponent(UIOpacity);
            op.opacity = 235;
        }

        // 头像区(左侧)
        const imgNode = new Node('Img');
        card.addChild(imgNode);
        imgNode.setPosition(-this.CARD_W / 2 + 44, this.CARD_H / 2 - 44, 0);
        imgNode.addComponent(UITransform).setContentSize(64, 64);
        const imgBg = imgNode.addComponent(Graphics);
        imgBg.fillColor = new Color(238, 240, 245, 255);
        imgBg.roundRect(-32, -32, 64, 64, 10);
        imgBg.fill();
        this.loadImage(imgNode, pet.image);

        // 名称
        this.addLabel(card, pet.name, this.CARD_W / 2 - 70, this.CARD_H / 2 - 22, 124, 24, 18,
            new Color(50, 54, 66, 255), Label.HorizontalAlign.LEFT);
        // 品质标签
        this.addLabel(card, pet.qualityDesc, this.CARD_W / 2 - 70, this.CARD_H / 2 - 46, 124, 20, 14,
            qColor, Label.HorizontalAlign.LEFT);

        // 属性(攻/防/速/命)
        const attrText = `攻${pet.attributes.attack}  防${pet.attributes.defense}  速${pet.attributes.speed}  命${pet.attributes.hp}`;
        this.addLabel(card, attrText, 0, -8, this.CARD_W - 24, 22, 14,
            new Color(90, 94, 108, 255), Label.HorizontalAlign.CENTER);

        // 底部:解锁状态/按钮
        if (pet.isUnlocked) {
            this.addLabel(card, '✓ 已解锁', 0, -this.CARD_H / 2 + 22, this.CARD_W - 24, 24, 16,
                new Color(82, 196, 26, 255), Label.HorizontalAlign.CENTER);
        } else if (pet.canUnlock) {
            this.makeButton(card, `解锁(${pet.unlockEnergy})`, new Color(64, 158, 255, 255),
                150, 32, 0, -this.CARD_H / 2 + 24, () => this.onUnlock(pet));
        } else {
            const lack = Math.max(0, pet.unlockEnergy - this.catalog.energy);
            this.addLabel(card, `需${pet.unlockEnergy}积分 (差${lack})`, 0, -this.CARD_H / 2 + 22,
                this.CARD_W - 24, 24, 14, new Color(180, 90, 90, 255), Label.HorizontalAlign.CENTER);
        }
    }

    private async onUnlock(pet: CatalogPet): Promise<void> {
        if (this.loading) return;
        this.loading = true;
        this.showToast('解锁中...');
        const res = await this.api.unlockPet(pet.id);
        this.loading = false;
        if (res.code !== 0) {
            this.showToast(res.message || '解锁失败');
            return;
        }
        this.showToast(`已解锁「${pet.name}」`);
        // 重新拉取以刷新积分与状态
        this.refresh();
    }

    // ---------- 远程图片加载 ----------
    private loadImage(parent: Node, url: string): void {
        if (!url) return;
        assetManager.loadRemote<ImageAsset>(url, (err, imageAsset) => {
            if (err || !imageAsset || !parent.isValid) return;
            const texture = new Texture2D();
            texture.image = imageAsset;
            const sf = new SpriteFrame();
            sf.texture = texture;
            const spNode = new Node('Sprite');
            parent.addChild(spNode);
            spNode.addComponent(UITransform).setContentSize(60, 60);
            const sprite = spNode.addComponent(Sprite);
            sprite.spriteFrame = sf;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        });
    }

    // ---------- 小工具 ----------
    private addLabel(
        parent: Node, text: string, x: number, y: number, w: number, h: number,
        fontSize: number, color: Color, align: Label.HorizontalAlign,
    ): Label {
        const node = new Node('Lbl');
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(w, h);
        const lbl = node.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = fontSize;
        lbl.lineHeight = fontSize + 2;
        lbl.color = color;
        lbl.horizontalAlign = align;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;
        lbl.overflow = Label.Overflow.CLAMP;
        return lbl;
    }

    private makeButton(
        parent: Node, text: string, color: Color, w: number, h: number,
        x: number, y: number, callback: () => void,
    ): Node {
        const btnNode = new Node('Btn_' + text);
        parent.addChild(btnNode);
        btnNode.setPosition(x, y, 0);
        btnNode.addComponent(UITransform).setContentSize(w, h);
        const g = btnNode.addComponent(Graphics);
        g.fillColor = color;
        g.roundRect(-w / 2, -h / 2, w, h, 10);
        g.fill();

        const lblNode = new Node('Lbl');
        btnNode.addChild(lblNode);
        lblNode.addComponent(UITransform).setContentSize(w, h);
        const lbl = lblNode.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = 16;
        lbl.color = new Color(255, 255, 255, 255);
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;

        const btn = btnNode.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 1.05;
        btn.duration = 0.08;
        btnNode.on(Node.EventType.TOUCH_END, (ev: any) => {
            ev.propagationStopped = true;
            callback();
        }, this);
        return btnNode;
    }

    private showToast(msg: string): void {
        if (this.toastLabel) this.toastLabel.string = msg;
    }

    private hideToast(): void {
        if (this.toastLabel) this.toastLabel.string = '';
    }
}
