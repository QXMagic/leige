import {
    Node, UITransform, Graphics, Label, Color, Button,
    Sprite, SpriteFrame, ImageAsset, Texture2D, assetManager,
} from 'cc';
import { EvolutionOption } from './PetData';

/**
 * 进化分支选择面板(纯代码构建,风格与 PetGalleryPanel 一致)。
 * 当宠物经验达标且存在多个进化方向时弹出,玩家选择其一。
 *
 * 用法:
 *   panel.open(options, (key) => { ... });
 */
export class EvolutionChoicePanel {
    private root: Node;
    private onChoose: ((key: string) => void) | null = null;

    private readonly PANEL_W = 640;
    private readonly PANEL_H = 380;
    private readonly CARD_W = 180;
    private readonly CARD_H = 230;

    constructor(parent: Node) {
        this.root = new Node('EvolutionChoicePanel');
        parent.addChild(this.root);
        this.root.addComponent(UITransform).setContentSize(960, 640);
        this.root.active = false;
    }

    isOpen(): boolean {
        return this.root.active;
    }

    close(): void {
        this.root.active = false;
    }

    open(options: EvolutionOption[], onChoose: (key: string) => void): void {
        this.onChoose = onChoose;
        this.root.active = true;
        this.build(options);
    }

    private build(options: EvolutionOption[]): void {
        this.root.removeAllChildren();

        // 遮罩(拦截点击,但不允许点击空白关闭——必须选择)
        const overlay = new Node('Overlay');
        this.root.addChild(overlay);
        overlay.addComponent(UITransform).setContentSize(960, 640);
        const og = overlay.addComponent(Graphics);
        og.fillColor = new Color(0, 0, 0, 150);
        og.rect(-480, -320, 960, 640);
        og.fill();
        overlay.addComponent(Button);
        overlay.on(Node.EventType.TOUCH_END, (ev: any) => { ev.propagationStopped = true; }, this);

        // 面板
        const panel = new Node('Panel');
        this.root.addChild(panel);
        panel.addComponent(UITransform).setContentSize(this.PANEL_W, this.PANEL_H);
        const pg = panel.addComponent(Graphics);
        pg.fillColor = new Color(248, 249, 252, 255);
        pg.roundRect(-this.PANEL_W / 2, -this.PANEL_H / 2, this.PANEL_W, this.PANEL_H, 18);
        pg.fill();
        pg.strokeColor = new Color(165, 94, 234, 255);
        pg.lineWidth = 2.5;
        pg.roundRect(-this.PANEL_W / 2, -this.PANEL_H / 2, this.PANEL_W, this.PANEL_H, 18);
        pg.stroke();

        this.addLabel(panel, '✨ 选择进化方向 ✨', 0, this.PANEL_H / 2 - 30, 400, 30, 22,
            new Color(120, 60, 200, 255), Label.HorizontalAlign.CENTER);

        // 稍后再说
        this.makeButton(panel, '稍后', new Color(150, 158, 170, 255), 64, 30,
            this.PANEL_W / 2 - 50, this.PANEL_H / 2 - 30, () => this.close());

        // 候选卡片(横向排布,最多 3-4 个)
        const n = options.length;
        const gap = 20;
        const totalW = n * this.CARD_W + (n - 1) * gap;
        const startX = -totalW / 2 + this.CARD_W / 2;
        options.forEach((opt, i) => {
            this.renderCard(panel, opt, startX + i * (this.CARD_W + gap), -10);
        });
    }

    private renderCard(parent: Node, opt: EvolutionOption, x: number, y: number): void {
        const card = new Node(`Opt_${opt.key}`);
        parent.addChild(card);
        card.setPosition(x, y, 0);
        card.addComponent(UITransform).setContentSize(this.CARD_W, this.CARD_H);
        const g = card.addComponent(Graphics);
        g.fillColor = new Color(255, 255, 255, 255);
        g.roundRect(-this.CARD_W / 2, -this.CARD_H / 2, this.CARD_W, this.CARD_H, 12);
        g.fill();
        g.strokeColor = new Color(210, 214, 222, 255);
        g.lineWidth = 2;
        g.roundRect(-this.CARD_W / 2, -this.CARD_H / 2, this.CARD_W, this.CARD_H, 12);
        g.stroke();

        // 形象图
        const imgNode = new Node('Img');
        card.addChild(imgNode);
        imgNode.setPosition(0, this.CARD_H / 2 - 56, 0);
        imgNode.addComponent(UITransform).setContentSize(84, 84);
        const imgBg = imgNode.addComponent(Graphics);
        imgBg.fillColor = new Color(238, 240, 245, 255);
        imgBg.roundRect(-42, -42, 84, 84, 10);
        imgBg.fill();
        this.loadImage(imgNode, opt.image);

        this.addLabel(card, opt.name, 0, this.CARD_H / 2 - 112, this.CARD_W - 16, 24, 18,
            new Color(50, 54, 66, 255), Label.HorizontalAlign.CENTER);

        const attrs = `攻${opt.attack} 防${opt.defense}\n速${opt.speed} 命${opt.hp}`;
        const lbl = this.addLabel(card, attrs, 0, -8, this.CARD_W - 20, 44, 14,
            new Color(90, 94, 108, 255), Label.HorizontalAlign.CENTER);
        lbl.overflow = Label.Overflow.NONE;

        this.makeButton(card, '选择', new Color(165, 94, 234, 255), 120, 34, 0, -this.CARD_H / 2 + 26, () => {
            const cb = this.onChoose;
            this.close();
            if (cb) cb(opt.key);
        });
    }

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
            spNode.addComponent(UITransform).setContentSize(80, 80);
            const sprite = spNode.addComponent(Sprite);
            sprite.spriteFrame = sf;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        });
    }

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
        lbl.lineHeight = fontSize + 4;
        lbl.color = color;
        lbl.horizontalAlign = align;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;
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
}
