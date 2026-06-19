import { Node, UITransform, Graphics, Label, Color, tween, Tween, Vec3, UIOpacity } from 'cc';

export class EffectManager {
    private rootNode: Node;

    constructor(rootNode: Node) {
        this.rootNode = rootNode;
    }

    playExpGain(x: number, y: number, exp: number): void {
        const labelNode = new Node('ExpGain');
        labelNode.addComponent(UITransform);
        const label = labelNode.addComponent(Label);
        label.string = `+${exp}EXP`;
        label.fontSize = 28;
        label.lineHeight = 28;
        label.color = new Color(255, 215, 0, 255);
        labelNode.setPosition(x, y, 0);
        this.rootNode.addChild(labelNode);

        tween(labelNode)
            .to(0.6, { position: new Vec3(x, y + 60, 0) })
            .to(0.4, { position: new Vec3(x, y + 80, 0) }, {
                onUpdate: (target: Node) => {
                    const opacity = target.getComponent(UIOpacity) || target.addComponent(UIOpacity);
                    opacity.opacity = Math.max(0, opacity.opacity - 6.375);
                }
            })
            .call(() => labelNode.destroy())
            .start();
    }

    playLevelUp(x: number, y: number): void {
        const count = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            const starNode = new Node('LevelUpStar');
            starNode.addComponent(UITransform).setContentSize(20, 20);
            const g = starNode.addComponent(Graphics);
            g.fillColor = new Color(255, 255, 0, 255);
            this.drawStar(g, 0, 0, 5, 10, 5);
            g.fill();
            starNode.setPosition(x, y, 0);
            this.rootNode.addChild(starNode);

            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const dist = 60 + Math.random() * 40;
            const tx = x + Math.cos(angle) * dist;
            const ty = y + Math.sin(angle) * dist;

            const opacity = starNode.addComponent(UIOpacity);
            tween(starNode)
                .to(0.8, { position: new Vec3(tx, ty, 0) })
                .start();
            tween(opacity)
                .to(0.8, { opacity: 0 })
                .call(() => starNode.destroy())
                .start();
        }
    }

    playEvolution(x: number, y: number): void {
        const haloNode = new Node('EvolutionHalo');
        haloNode.addComponent(UITransform).setContentSize(200, 200);
        const haloG = haloNode.addComponent(Graphics);
        haloG.fillColor = new Color(255, 255, 255, 180);
        haloG.circle(0, 0, 10);
        haloG.fill();
        haloNode.setPosition(x, y, 0);
        this.rootNode.addChild(haloNode);

        const haloOpacity = haloNode.addComponent(UIOpacity);
        tween(haloNode)
            .to(0.5, { scale: new Vec3(6, 6, 1) }, {
                onUpdate: () => {
                    haloG.clear();
                    haloG.fillColor = new Color(255, 255, 255, 180);
                    haloG.circle(0, 0, 10);
                    haloG.fill();
                }
            })
            .to(0.5, { scale: new Vec3(8, 8, 1) })
            .start();
        tween(haloOpacity)
            .delay(0.5)
            .to(1.0, { opacity: 0 })
            .call(() => haloNode.destroy())
            .start();

        const dotCount = 8;
        for (let i = 0; i < dotCount; i++) {
            const dotNode = new Node('EvolutionDot');
            dotNode.addComponent(UITransform).setContentSize(10, 10);
            const dotG = dotNode.addComponent(Graphics);
            dotG.fillColor = new Color(255, 255, 200, 255);
            dotG.circle(0, 0, 5);
            dotG.fill();
            dotNode.setPosition(x, y, 0);
            this.rootNode.addChild(dotNode);

            const angle = (Math.PI * 2 / dotCount) * i;
            const dist = 80 + Math.random() * 40;
            const tx = x + Math.cos(angle) * dist;
            const ty = y + Math.sin(angle) * dist;

            const dotOpacity = dotNode.addComponent(UIOpacity);
            tween(dotNode)
                .to(1.0, { position: new Vec3(tx, ty, 0) })
                .start();
            tween(dotOpacity)
                .delay(0.5)
                .to(1.0, { opacity: 0 })
                .call(() => dotNode.destroy())
                .start();
        }
    }

    playDiamondDrop(x: number, y: number, count: number): void {
        for (let i = 0; i < count; i++) {
            const delay = 0.1 + Math.random() * 0.2;
            const offsetX = (Math.random() - 0.5) * 40;

            const diamondNode = new Node('Diamond');
            diamondNode.addComponent(UITransform).setContentSize(16, 16);
            const g = diamondNode.addComponent(Graphics);
            g.fillColor = new Color(80, 160, 255, 255);
            this.drawDiamond(g, 0, 0, 8);
            g.fill();
            diamondNode.setPosition(x + offsetX, y + 200, 0);
            this.rootNode.addChild(diamondNode);

            const opacity = diamondNode.addComponent(UIOpacity);

            tween(diamondNode)
                .delay(delay)
                .to(0.4, { position: new Vec3(x + offsetX, y, 0) }, { easing: 'sineIn' })
                .to(0.15, { position: new Vec3(x + offsetX, y + 15, 0) }, { easing: 'sineOut' })
                .to(0.15, { position: new Vec3(x + offsetX, y, 0) }, { easing: 'sineIn' })
                .start();

            tween(opacity)
                .delay(delay + 0.7)
                .to(0.3, { opacity: 0 })
                .call(() => diamondNode.destroy())
                .start();
        }
    }

    playMedalEarn(x: number, y: number): void {
        const medalNode = new Node('Medal');
        medalNode.addComponent(UITransform).setContentSize(60, 60);
        const g = medalNode.addComponent(Graphics);
        g.fillColor = new Color(255, 200, 0, 255);
        g.circle(0, 0, 25);
        g.fill();
        medalNode.setPosition(x, y, 0);
        medalNode.setScale(0, 0, 1);
        this.rootNode.addChild(medalNode);

        const opacity = medalNode.addComponent(UIOpacity);

        tween(medalNode)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
            .to(0.15, { scale: new Vec3(1.0, 1.0, 1) })
            .to(0.5, { angle: 360 })
            .start();

        tween(opacity)
            .delay(0.95)
            .to(0.5, { opacity: 0 })
            .call(() => medalNode.destroy())
            .start();
    }

    playHealEffect(x: number, y: number): void {
        const healNode = new Node('Heal');
        healNode.addComponent(UITransform).setContentSize(30, 30);
        const g = healNode.addComponent(Graphics);
        g.fillColor = new Color(0, 255, 80, 255);
        g.rect(-4, -12, 8, 24);
        g.fill();
        g.rect(-12, -4, 24, 8);
        g.fill();
        healNode.setPosition(x, y, 0);
        this.rootNode.addChild(healNode);

        const opacity = healNode.addComponent(UIOpacity);
        tween(healNode)
            .to(1.0, { position: new Vec3(x, y + 50, 0) })
            .start();
        tween(opacity)
            .to(1.0, { opacity: 0 })
            .call(() => healNode.destroy())
            .start();
    }

    private drawStar(g: Graphics, cx: number, cy: number, points: number, outerR: number, innerR: number): void {
        const step = Math.PI / points;
        g.moveTo(cx, cy + outerR);
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = -Math.PI / 2 + step * (i + 1);
            g.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        }
        g.close();
    }

    private drawDiamond(g: Graphics, cx: number, cy: number, size: number): void {
        g.moveTo(cx, cy + size);
        g.lineTo(cx + size * 0.6, cy);
        g.lineTo(cx, cy - size);
        g.lineTo(cx - size * 0.6, cy);
        g.close();
    }
}
