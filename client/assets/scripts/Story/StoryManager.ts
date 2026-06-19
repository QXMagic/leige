import {
    Node, UITransform, Graphics, Label, Color,
    tween, Tween, UIOpacity
} from 'cc';

interface StoryPage {
    title: string;
    text: string;
}

export class StoryManager {
    private rootNode: Node;
    private storyPanel: Node | null = null;
    private currentPage: number = 0;
    private onComplete: (() => void) | null = null;
    private pages: StoryPage[] = [
        { title: 'X星球的危机', text: '在遥远的宇宙中，有一颗美丽的X星球...' },
        { title: '安逸的生活', text: 'X星球上生活着一群可爱的萌宠，它们无忧无虑...' },
        { title: '侵略者来袭', text: '某天，Y星球的侵略者入侵了X星球...' },
        { title: '勇敢的逃离', text: '若干只宠物趁乱逃离，穿越星际来到了地球...' },
        { title: '新的希望', text: '学校班级的孩子们发现了它们，决定帮助它们成长...' }
    ];

    private readonly W = 720;
    private readonly H = 1280;

    constructor(rootNode: Node) {
        this.rootNode = rootNode;
    }

    show(onComplete: () => void): void {
        this.onComplete = onComplete;
        this.currentPage = 0;
        this.createStoryPanel();
        this.showPage(0);
    }

    private createStoryPanel(): void {
        this.storyPanel = new Node('StoryPanel');
        this.rootNode.addChild(this.storyPanel);
        this.storyPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.storyPanel.addComponent(UIOpacity);

        const overlay = new Node('Overlay');
        this.storyPanel.addChild(overlay);
        overlay.addComponent(UITransform).setContentSize(this.W, this.H);
        const og = overlay.addComponent(Graphics);
        og.fillColor = new Color(0, 0, 0, 200);
        og.rect(-this.W / 2, -this.H / 2, this.W, this.H);
        og.fill();
        overlay.on(Node.EventType.TOUCH_START, (ev: any) => { ev.propagationStopped = true; }, this);
        overlay.on(Node.EventType.TOUCH_END, (ev: any) => { ev.propagationStopped = true; }, this);

        const card = new Node('Card');
        this.storyPanel.addChild(card);
        card.setPosition(0, 20, 0);
        card.addComponent(UITransform).setContentSize(600, 500);
        const cg = card.addComponent(Graphics);
        cg.fillColor = new Color(255, 255, 255, 248);
        cg.roundRect(-300, -250, 600, 500, 20);
        cg.fill();
        cg.strokeColor = new Color(200, 200, 210, 255);
        cg.lineWidth = 2;
        cg.roundRect(-300, -250, 600, 500, 20);
        cg.stroke();

        const titleNode = new Node('Title');
        card.addChild(titleNode);
        titleNode.setPosition(0, 190, 0);
        titleNode.addComponent(UITransform).setContentSize(540, 40);
        const titleLbl = titleNode.addComponent(Label);
        titleLbl.fontSize = 28;
        titleLbl.color = new Color(50, 50, 70, 255);
        titleLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLbl.overflow = Label.Overflow.CLAMP;
        titleLbl.node = titleNode;

        const textNode = new Node('Text');
        card.addChild(textNode);
        textNode.setPosition(0, 40, 0);
        textNode.addComponent(UITransform).setContentSize(520, 200);
        const textLbl = textNode.addComponent(Label);
        textLbl.fontSize = 20;
        textLbl.color = new Color(120, 120, 130, 255);
        textLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        textLbl.verticalAlign = Label.VerticalAlign.CENTER;
        textLbl.overflow = Label.Overflow.CLAMP;
        textLbl.lineHeight = 32;
        textLbl.node = textNode;

        const pageIndicator = new Node('PageIndicator');
        card.addChild(pageIndicator);
        pageIndicator.setPosition(0, -80, 0);
        pageIndicator.addComponent(UITransform).setContentSize(100, 24);
        const pageLbl = pageIndicator.addComponent(Label);
        pageLbl.fontSize = 18;
        pageLbl.color = new Color(160, 160, 170, 255);
        pageLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        pageLbl.node = pageIndicator;

        this.makeButton(card, '上一页', new Color(180, 180, 190, 255), 130, 44, -150, -200, () => {
            this.prevPage();
        });

        this.makeButton(card, '下一页', new Color(100, 170, 230, 255), 130, 44, 150, -200, () => {
            this.nextPage();
        });
    }

    private showPage(index: number): void {
        if (!this.storyPanel) return;
        const card = this.storyPanel.getChildByName('Card');
        if (!card) return;

        const titleNode = card.getChildByName('Title');
        const textNode = card.getChildByName('Text');
        const pageIndicator = card.getChildByName('PageIndicator');

        if (titleNode) {
            const lbl = titleNode.getComponent(Label);
            if (lbl) lbl.string = this.pages[index].title;
        }
        if (textNode) {
            const lbl = textNode.getComponent(Label);
            if (lbl) lbl.string = this.pages[index].text;
        }
        if (pageIndicator) {
            const lbl = pageIndicator.getComponent(Label);
            if (lbl) lbl.string = `${index + 1}/${this.pages.length}`;
        }

        const prevBtn = card.children.find(c => c.name === '上一页');
        if (prevBtn) prevBtn.active = index > 0;

        const nextBtn = card.children.find(c => c.name === '下一页');
        if (nextBtn) {
            const lbl = nextBtn.getChildByName('Lbl');
            if (lbl) {
                const l = lbl.getComponent(Label);
                if (l) l.string = index === this.pages.length - 1 ? '完成' : '下一页';
            }
        }

        const op = this.storyPanel.getComponent(UIOpacity) || this.storyPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op)
            .to(0.4, { opacity: 255 })
            .start();
    }

    private nextPage(): void {
        if (this.currentPage >= this.pages.length - 1) {
            if (this.onComplete) {
                this.onComplete();
            }
            this.destroyPanel();
            return;
        }
        this.currentPage++;
        this.showPage(this.currentPage);
    }

    private prevPage(): void {
        if (this.currentPage <= 0) return;
        this.currentPage--;
        this.showPage(this.currentPage);
    }

    private destroyPanel(): void {
        if (this.storyPanel) {
            this.storyPanel.destroy();
            this.storyPanel = null;
        }
    }

    private makeButton(
        parent: Node, text: string, color: Color,
        w: number, h: number, x: number, y: number,
        callback: () => void
    ): Node {
        const btnNode = new Node(text);
        parent.addChild(btnNode);
        btnNode.setPosition(x, y, 0);
        const t = btnNode.addComponent(UITransform);
        t.setContentSize(w, h);
        const g = btnNode.addComponent(Graphics);
        g.fillColor = color;
        g.roundRect(-w / 2, -h / 2, w, h, h / 3);
        g.fill();
        g.strokeColor = new Color(
            Math.max(color.r - 40, 0),
            Math.max(color.g - 40, 0),
            Math.max(color.b - 40, 0), 80
        );
        g.lineWidth = 2;
        g.roundRect(-w / 2, -h / 2, w, h, h / 3);
        g.stroke();

        const lblNode = new Node('Lbl');
        btnNode.addChild(lblNode);
        lblNode.addComponent(UITransform).setContentSize(w, h);
        const lbl = lblNode.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = 20;
        lbl.color = new Color(255, 255, 255, 255);
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;
        lbl.overflow = Label.Overflow.CLAMP;

        btnNode.on(Node.EventType.TOUCH_END, (ev: any) => {
            ev.propagationStopped = true;
            callback();
        }, this);
        return btnNode;
    }
}
