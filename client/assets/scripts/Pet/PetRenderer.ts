import { Node, Graphics, UITransform, Color } from 'cc';
import { PetType, PetState, GrowthStage } from './PetData';

export class PetRenderer {
    private node: Node;
    private graphics: Graphics;
    private currentState: PetState = PetState.IDLE;
    private currentStage: GrowthStage = GrowthStage.EGG;
    private currentPetType: PetType = PetType.PENGUIN;

    constructor(parent: Node) {
        this.node = new Node('Penguin');
        parent.addChild(this.node);
        const uiTransform = this.node.addComponent(UITransform);
        uiTransform.setContentSize(250, 250);
        this.graphics = this.node.addComponent(Graphics);
    }

    getNode(): Node {
        return this.node;
    }

    setState(state: PetState): void {
        this.currentState = state;
        this.draw();
    }

    setStage(stage: GrowthStage): void {
        this.currentStage = stage;
        this.draw();
    }

    setPetType(petType: PetType): void {
        this.currentPetType = petType;
        this.draw();
    }

    private draw(): void {
        this.graphics.clear();
        if (this.currentStage === GrowthStage.EGG) {
            this.drawEgg();
            return;
        }
        let s: number;
        switch (this.currentStage) {
            case GrowthStage.BABY: s = 0.6; break;
            case GrowthStage.CHILD: s = 0.8; break;
            case GrowthStage.ADULT: s = 1.0; break;
            case GrowthStage.LEGEND: s = 1.15; break;
            default: s = 0.6; break;
        }
        switch (this.currentPetType) {
            case PetType.PENGUIN: this.drawPenguin(s); break;
            case PetType.CAT: this.drawCat(s); break;
            case PetType.DOG: this.drawDog(s); break;
            case PetType.RABBIT: this.drawRabbit(s); break;
            case PetType.DRAGON: this.drawDragon(s); break;
        }
    }

    private drawEgg(): void {
        const g = this.graphics;
        g.fillColor = new Color(255, 245, 225, 255);
        g.ellipse(0, 0, 30, 40);
        g.fill();
        g.strokeColor = new Color(200, 180, 150, 255);
        g.lineWidth = 2;
        g.ellipse(0, 0, 30, 40);
        g.stroke();
        g.fillColor = new Color(230, 210, 180, 255);
        g.circle(-10, 10, 5);
        g.fill();
        g.circle(8, -5, 4);
        g.fill();
        g.circle(5, 15, 3);
        g.fill();
    }

    private drawPenguin(s: number): void {
        const g = this.graphics;
        if (this.currentStage === GrowthStage.LEGEND) {
            g.strokeColor = new Color(255, 215, 0, 80);
            g.lineWidth = 4 * s;
            g.circle(0, 10 * s, 55 * s);
            g.stroke();
            g.strokeColor = new Color(255, 215, 0, 40);
            g.lineWidth = 6 * s;
            g.circle(0, 10 * s, 62 * s);
            g.stroke();
        }
        g.fillColor = new Color(30, 30, 30, 255);
        g.ellipse(0, -5 * s, 35 * s, 45 * s);
        g.fill();
        g.fillColor = new Color(240, 240, 245, 255);
        g.ellipse(0, -12 * s, 25 * s, 30 * s);
        g.fill();
        g.fillColor = new Color(255, 160, 0, 255);
        g.ellipse(-15 * s, -48 * s, 10 * s, 5 * s);
        g.fill();
        g.ellipse(15 * s, -48 * s, 10 * s, 5 * s);
        g.fill();
        g.fillColor = new Color(255, 160, 0, 255);
        g.moveTo(-6 * s, 12 * s);
        g.lineTo(0, 6 * s);
        g.lineTo(6 * s, 12 * s);
        g.close();
        g.fill();
        this.drawFace(s, 22, 12);
        if (this.currentStage === GrowthStage.CHILD) {
            g.fillColor = new Color(255, 50, 50, 255);
            g.moveTo(-6 * s, -30 * s);
            g.lineTo(0, -24 * s);
            g.lineTo(6 * s, -30 * s);
            g.close();
            g.fill();
            g.fillColor = new Color(255, 50, 50, 255);
            g.circle(0, -30 * s, 3 * s);
            g.fill();
        }
        if (this.currentStage === GrowthStage.ADULT) {
            g.fillColor = new Color(255, 80, 80, 255);
            g.roundRect(-30 * s, -28 * s, 60 * s, 8 * s, 3 * s);
            g.fill();
            g.fillColor = new Color(255, 200, 200, 255);
            g.circle(28 * s, -24 * s, 5 * s);
            g.fill();
        }
        if (this.currentStage === GrowthStage.LEGEND) {
            g.fillColor = new Color(255, 215, 0, 255);
            g.moveTo(-15 * s, 40 * s);
            g.lineTo(-10 * s, 55 * s);
            g.lineTo(-5 * s, 40 * s);
            g.lineTo(0, 58 * s);
            g.lineTo(5 * s, 40 * s);
            g.lineTo(10 * s, 55 * s);
            g.lineTo(15 * s, 40 * s);
            g.close();
            g.fill();
            g.fillColor = new Color(255, 50, 50, 255);
            g.circle(0, 48 * s, 4 * s);
            g.fill();
        }
    }

    private drawCat(s: number): void {
        const g = this.graphics;
        if (this.currentStage === GrowthStage.LEGEND) {
            g.fillColor = new Color(255, 255, 100, 60);
            g.circle(0, 10 * s, 55 * s);
            g.fill();
            g.fillColor = new Color(255, 255, 100, 30);
            g.circle(0, 10 * s, 65 * s);
            g.fill();
        }
        g.fillColor = new Color(255, 152, 64, 255);
        g.ellipse(0, -5 * s, 30 * s, 40 * s);
        g.fill();
        g.fillColor = new Color(255, 240, 216, 255);
        g.ellipse(0, -10 * s, 20 * s, 28 * s);
        g.fill();
        g.fillColor = new Color(255, 152, 64, 255);
        g.moveTo(-20 * s, 25 * s);
        g.lineTo(-15 * s, 10 * s);
        g.lineTo(-5 * s, 20 * s);
        g.close();
        g.fill();
        g.moveTo(20 * s, 25 * s);
        g.lineTo(15 * s, 10 * s);
        g.lineTo(5 * s, 20 * s);
        g.close();
        g.fill();
        g.fillColor = new Color(255, 180, 180, 255);
        g.moveTo(-18 * s, 23 * s);
        g.lineTo(-14 * s, 13 * s);
        g.lineTo(-7 * s, 19 * s);
        g.close();
        g.fill();
        g.moveTo(18 * s, 23 * s);
        g.lineTo(14 * s, 13 * s);
        g.lineTo(7 * s, 19 * s);
        g.close();
        g.fill();
        g.strokeColor = new Color(80, 50, 30, 255);
        g.lineWidth = 1.5 * s;
        g.moveTo(-25 * s, 5 * s);
        g.lineTo(-8 * s, 3 * s);
        g.stroke();
        g.moveTo(-25 * s, 8 * s);
        g.lineTo(-8 * s, 8 * s);
        g.stroke();
        g.moveTo(-25 * s, 11 * s);
        g.lineTo(-8 * s, 13 * s);
        g.stroke();
        g.moveTo(25 * s, 5 * s);
        g.lineTo(8 * s, 3 * s);
        g.stroke();
        g.moveTo(25 * s, 8 * s);
        g.lineTo(8 * s, 8 * s);
        g.stroke();
        g.moveTo(25 * s, 11 * s);
        g.lineTo(8 * s, 13 * s);
        g.stroke();
        g.strokeColor = new Color(255, 152, 64, 255);
        g.lineWidth = 4 * s;
        g.moveTo(30 * s, -10 * s);
        g.bezierCurveTo(45 * s, -5 * s, 50 * s, 10 * s, 40 * s, 25 * s);
        g.stroke();
        g.fillColor = new Color(255, 100, 100, 255);
        g.moveTo(0, 5 * s);
        g.lineTo(-3 * s, 2 * s);
        g.lineTo(3 * s, 2 * s);
        g.close();
        g.fill();
        this.drawFace(s, 15, 10);
        if (this.currentStage === GrowthStage.CHILD) {
            g.fillColor = new Color(255, 215, 0, 255);
            g.circle(0, -30 * s, 5 * s);
            g.fill();
            g.strokeColor = new Color(200, 160, 0, 255);
            g.lineWidth = 1.5 * s;
            g.moveTo(0, -25 * s);
            g.lineTo(0, -20 * s);
            g.stroke();
        }
        if (this.currentStage === GrowthStage.ADULT) {
            g.fillColor = new Color(255, 100, 150, 255);
            g.moveTo(-5 * s, -35 * s);
            g.lineTo(0, -28 * s);
            g.lineTo(5 * s, -35 * s);
            g.close();
            g.fill();
            g.circle(0, -35 * s, 3 * s);
            g.fill();
        }
        if (this.currentStage === GrowthStage.LEGEND) {
            g.fillColor = new Color(255, 255, 100, 200);
            this.drawStar(0, 50 * s, 10 * s, 5 * s, 5);
            g.fill();
            g.fillColor = new Color(255, 255, 200, 150);
            this.drawStar(-20 * s, 40 * s, 6 * s, 3 * s, 5);
            g.fill();
            this.drawStar(20 * s, 45 * s, 7 * s, 3.5 * s, 5);
            g.fill();
        }
    }

    private drawDog(s: number): void {
        const g = this.graphics;
        if (this.currentStage === GrowthStage.LEGEND) {
            g.fillColor = new Color(255, 50, 50, 220);
            g.moveTo(-25 * s, 15 * s);
            g.lineTo(-40 * s, -45 * s);
            g.lineTo(-25 * s, -50 * s);
            g.lineTo(-10 * s, -43 * s);
            g.lineTo(0, -50 * s);
            g.lineTo(10 * s, -43 * s);
            g.lineTo(25 * s, -50 * s);
            g.lineTo(40 * s, -45 * s);
            g.lineTo(25 * s, 15 * s);
            g.close();
            g.fill();
        }
        g.fillColor = new Color(176, 120, 64, 255);
        g.ellipse(0, -5 * s, 30 * s, 38 * s);
        g.fill();
        g.fillColor = new Color(240, 216, 184, 255);
        g.ellipse(0, -10 * s, 20 * s, 26 * s);
        g.fill();
        g.fillColor = new Color(140, 90, 50, 255);
        g.ellipse(-25 * s, 5 * s, 12 * s, 20 * s);
        g.fill();
        g.ellipse(25 * s, 5 * s, 12 * s, 20 * s);
        g.fill();
        g.fillColor = new Color(30, 30, 30, 255);
        g.ellipse(0, 5 * s, 6 * s, 4 * s);
        g.fill();
        g.strokeColor = new Color(176, 120, 64, 255);
        g.lineWidth = 5 * s;
        g.moveTo(28 * s, -15 * s);
        g.bezierCurveTo(38 * s, -10 * s, 40 * s, 0, 35 * s, 5 * s);
        g.stroke();
        this.drawFace(s, 15, 10);
        if (this.currentStage === GrowthStage.CHILD) {
            g.fillColor = new Color(255, 50, 50, 255);
            g.roundRect(-30 * s, -20 * s, 60 * s, 6 * s, 2 * s);
            g.fill();
            g.fillColor = new Color(255, 215, 0, 255);
            g.circle(0, -17 * s, 4 * s);
            g.fill();
        }
        if (this.currentStage === GrowthStage.ADULT) {
            g.fillColor = new Color(80, 80, 180, 255);
            g.ellipse(0, 38 * s, 25 * s, 8 * s);
            g.fill();
            g.roundRect(-20 * s, 30 * s, 40 * s, 10 * s, 4 * s);
            g.fill();
        }
    }

    private drawRabbit(s: number): void {
        const g = this.graphics;
        if (this.currentStage === GrowthStage.LEGEND) {
            g.fillColor = new Color(255, 255, 255, 100);
            g.moveTo(-40 * s, -5 * s);
            g.bezierCurveTo(-60 * s, -30 * s, -50 * s, -60 * s, -20 * s, -40 * s);
            g.bezierCurveTo(-10 * s, -35 * s, -15 * s, -10 * s, -10 * s, 0);
            g.close();
            g.fill();
            g.fillColor = new Color(255, 240, 240, 80);
            g.moveTo(-38 * s, -5 * s);
            g.bezierCurveTo(-55 * s, -25 * s, -45 * s, -50 * s, -18 * s, -35 * s);
            g.bezierCurveTo(-10 * s, -30 * s, -13 * s, -8 * s, -10 * s, 0);
            g.close();
            g.fill();
            g.fillColor = new Color(255, 255, 255, 100);
            g.moveTo(40 * s, -5 * s);
            g.bezierCurveTo(60 * s, -30 * s, 50 * s, -60 * s, 20 * s, -40 * s);
            g.bezierCurveTo(10 * s, -35 * s, 15 * s, -10 * s, 10 * s, 0);
            g.close();
            g.fill();
            g.fillColor = new Color(255, 240, 240, 80);
            g.moveTo(38 * s, -5 * s);
            g.bezierCurveTo(55 * s, -25 * s, 45 * s, -50 * s, 18 * s, -35 * s);
            g.bezierCurveTo(10 * s, -30 * s, 13 * s, -8 * s, 10 * s, 0);
            g.close();
            g.fill();
        }
        g.fillColor = new Color(248, 240, 240, 255);
        g.ellipse(0, -5 * s, 28 * s, 35 * s);
        g.fill();
        g.fillColor = new Color(255, 232, 232, 255);
        g.ellipse(0, -10 * s, 18 * s, 24 * s);
        g.fill();
        g.fillColor = new Color(248, 240, 240, 255);
        g.ellipse(-10 * s, 40 * s, 7 * s, 25 * s);
        g.fill();
        g.ellipse(10 * s, 40 * s, 7 * s, 25 * s);
        g.fill();
        g.fillColor = new Color(255, 180, 180, 255);
        g.ellipse(-10 * s, 40 * s, 4 * s, 20 * s);
        g.fill();
        g.ellipse(10 * s, 40 * s, 4 * s, 20 * s);
        g.fill();
        g.fillColor = new Color(255, 150, 150, 255);
        g.moveTo(-3 * s, 5 * s);
        g.lineTo(0, 1 * s);
        g.lineTo(3 * s, 5 * s);
        g.close();
        g.fill();
        g.fillColor = new Color(248, 240, 240, 255);
        g.circle(30 * s, -15 * s, 8 * s);
        g.fill();
        this.drawFace(s, 15, 10);
        if (this.currentStage === GrowthStage.CHILD) {
            g.fillColor = new Color(100, 200, 100, 200);
            g.circle(-12 * s, 30 * s, 4 * s);
            g.fill();
            g.circle(0, 35 * s, 4 * s);
            g.fill();
            g.circle(12 * s, 30 * s, 4 * s);
            g.fill();
            g.fillColor = new Color(255, 100, 100, 200);
            g.circle(-12 * s, 30 * s, 2 * s);
            g.fill();
            g.circle(0, 35 * s, 2 * s);
            g.fill();
            g.circle(12 * s, 30 * s, 2 * s);
            g.fill();
        }
        if (this.currentStage === GrowthStage.ADULT) {
            g.fillColor = new Color(255, 150, 150, 255);
            g.roundRect(-25 * s, -28 * s, 50 * s, 8 * s, 3 * s);
            g.fill();
            g.fillColor = new Color(255, 200, 200, 255);
            g.circle(23 * s, -24 * s, 4 * s);
            g.fill();
        }
    }

    private drawDragon(s: number): void {
        const g = this.graphics;
        if (this.currentStage === GrowthStage.LEGEND) {
            g.fillColor = new Color(255, 100, 0, 60);
            g.circle(0, 10 * s, 60 * s);
            g.fill();
            g.fillColor = new Color(255, 150, 0, 40);
            g.circle(0, 10 * s, 70 * s);
            g.fill();
        }
        if (this.currentStage === GrowthStage.LEGEND) {
            g.fillColor = new Color(80, 160, 70, 200);
            g.moveTo(-30 * s, 0);
            g.bezierCurveTo(-55 * s, -20 * s, -50 * s, -50 * s, -25 * s, -30 * s);
            g.bezierCurveTo(-20 * s, -25 * s, -18 * s, -5 * s, -15 * s, 5 * s);
            g.close();
            g.fill();
            g.moveTo(30 * s, 0);
            g.bezierCurveTo(55 * s, -20 * s, 50 * s, -50 * s, 25 * s, -30 * s);
            g.bezierCurveTo(20 * s, -25 * s, 18 * s, -5 * s, 15 * s, 5 * s);
            g.close();
            g.fill();
        } else {
            g.fillColor = new Color(80, 160, 70, 180);
            g.moveTo(-25 * s, 0);
            g.bezierCurveTo(-40 * s, -10 * s, -38 * s, -25 * s, -20 * s, -15 * s);
            g.bezierCurveTo(-15 * s, -12 * s, -15 * s, -3 * s, -12 * s, 3 * s);
            g.close();
            g.fill();
            g.moveTo(25 * s, 0);
            g.bezierCurveTo(40 * s, -10 * s, 38 * s, -25 * s, 20 * s, -15 * s);
            g.bezierCurveTo(15 * s, -12 * s, 15 * s, -3 * s, 12 * s, 3 * s);
            g.close();
            g.fill();
        }
        g.fillColor = new Color(80, 184, 72, 255);
        g.ellipse(0, -5 * s, 30 * s, 38 * s);
        g.fill();
        g.fillColor = new Color(200, 240, 184, 255);
        g.ellipse(0, -10 * s, 20 * s, 26 * s);
        g.fill();
        g.fillColor = new Color(200, 160, 50, 255);
        g.moveTo(-8 * s, 30 * s);
        g.lineTo(-5 * s, 40 * s);
        g.lineTo(-2 * s, 30 * s);
        g.close();
        g.fill();
        g.moveTo(2 * s, 30 * s);
        g.lineTo(5 * s, 40 * s);
        g.lineTo(8 * s, 30 * s);
        g.close();
        g.fill();
        g.strokeColor = new Color(80, 184, 72, 255);
        g.lineWidth = 5 * s;
        g.moveTo(28 * s, -10 * s);
        g.bezierCurveTo(40 * s, -5 * s, 42 * s, 5 * s, 35 * s, 15 * s);
        g.stroke();
        g.fillColor = new Color(80, 184, 72, 255);
        g.moveTo(35 * s, 15 * s);
        g.lineTo(40 * s, 10 * s);
        g.lineTo(38 * s, 20 * s);
        g.close();
        g.fill();
        this.drawFace(s, 15, 10);
        if (this.currentStage === GrowthStage.CHILD) {
            g.fillColor = new Color(150, 150, 170, 200);
            g.roundRect(-22 * s, -20 * s, 44 * s, 8 * s, 3 * s);
            g.fill();
            g.fillColor = new Color(180, 180, 200, 200);
            g.circle(-15 * s, -16 * s, 3 * s);
            g.fill();
            g.circle(15 * s, -16 * s, 3 * s);
            g.fill();
        }
        if (this.currentStage === GrowthStage.ADULT) {
            g.strokeColor = new Color(255, 100, 0, 200);
            g.lineWidth = 2 * s;
            g.moveTo(-20 * s, -20 * s);
            g.bezierCurveTo(-15 * s, -25 * s, -10 * s, -18 * s, -5 * s, -22 * s);
            g.stroke();
            g.moveTo(5 * s, -22 * s);
            g.bezierCurveTo(10 * s, -18 * s, 15 * s, -25 * s, 20 * s, -20 * s);
            g.stroke();
        }
        if (this.currentStage === GrowthStage.LEGEND) {
            g.fillColor = new Color(255, 150, 0, 180);
            g.moveTo(-15 * s, 50 * s);
            g.bezierCurveTo(-20 * s, 60 * s, -10 * s, 70 * s, 0, 65 * s);
            g.bezierCurveTo(10 * s, 70 * s, 20 * s, 60 * s, 15 * s, 50 * s);
            g.close();
            g.fill();
            g.fillColor = new Color(255, 200, 0, 150);
            g.moveTo(-10 * s, 55 * s);
            g.bezierCurveTo(-12 * s, 62 * s, -5 * s, 68 * s, 0, 63 * s);
            g.bezierCurveTo(5 * s, 68 * s, 12 * s, 62 * s, 10 * s, 55 * s);
            g.close();
            g.fill();
        }
    }

    private drawStar(cx: number, cy: number, outerR: number, innerR: number, points: number): void {
        const g = this.graphics;
        const step = Math.PI / points;
        g.moveTo(cx + outerR * Math.cos(-Math.PI / 2), cy + outerR * Math.sin(-Math.PI / 2));
        for (let i = 1; i < points * 2; i++) {
            const angle = -Math.PI / 2 + i * step;
            const r = i % 2 === 0 ? outerR : innerR;
            g.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        g.close();
    }

    private drawFace(s: number, eyeOffsetY: number, eyeSpacing: number): void {
        switch (this.currentState) {
            case PetState.IDLE:
                this.drawNormalEyes(s, eyeOffsetY, eyeSpacing);
                break;
            case PetState.HAPPY:
            case PetState.EATING:
                this.drawHappyEyes(s, eyeOffsetY, eyeSpacing);
                break;
            case PetState.HUNGRY:
                this.drawSadEyes(s, eyeOffsetY, eyeSpacing);
                break;
            case PetState.PLAYING:
                this.drawPlayfulEyes(s, eyeOffsetY, eyeSpacing);
                break;
            case PetState.SLEEPING:
                this.drawSleepingEyes(s, eyeOffsetY, eyeSpacing);
                break;
            case PetState.TEASED:
                this.drawSurprisedEyes(s, eyeOffsetY, eyeSpacing);
                break;
            case PetState.SICK:
                this.drawSickEyes(s, eyeOffsetY, eyeSpacing);
                break;
        }
    }

    private drawNormalEyes(s: number, eyeOffsetY: number, eyeSpacing: number): void {
        const g = this.graphics;
        g.fillColor = new Color(30, 30, 30, 255);
        g.circle(-eyeSpacing * s, eyeOffsetY * s, 4 * s);
        g.fill();
        g.circle(eyeSpacing * s, eyeOffsetY * s, 4 * s);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle((-eyeSpacing + 1.5) * s, (eyeOffsetY + 1.5) * s, 1.5 * s);
        g.fill();
        g.circle((eyeSpacing + 1.5) * s, (eyeOffsetY + 1.5) * s, 1.5 * s);
        g.fill();
    }

    private drawHappyEyes(s: number, eyeOffsetY: number, eyeSpacing: number): void {
        const g = this.graphics;
        g.strokeColor = new Color(30, 30, 30, 255);
        g.lineWidth = 2.5 * s;
        g.arc(-eyeSpacing * s, eyeOffsetY * s, 4 * s, Math.PI * 0.1, Math.PI * 0.9, false);
        g.stroke();
        g.arc(eyeSpacing * s, eyeOffsetY * s, 4 * s, Math.PI * 0.1, Math.PI * 0.9, false);
        g.stroke();
        g.fillColor = new Color(255, 150, 150, 150);
        g.circle((-eyeSpacing - 6) * s, (eyeOffsetY - 3) * s, 4 * s);
        g.fill();
        g.circle((eyeSpacing + 6) * s, (eyeOffsetY - 3) * s, 4 * s);
        g.fill();
    }

    private drawSadEyes(s: number, eyeOffsetY: number, eyeSpacing: number): void {
        const g = this.graphics;
        g.fillColor = new Color(30, 30, 30, 255);
        g.circle(-eyeSpacing * s, eyeOffsetY * s, 3.5 * s);
        g.fill();
        g.circle(eyeSpacing * s, eyeOffsetY * s, 3.5 * s);
        g.fill();
        g.strokeColor = new Color(30, 30, 30, 255);
        g.lineWidth = 2 * s;
        g.moveTo((-eyeSpacing - 5) * s, (eyeOffsetY + 6) * s);
        g.lineTo((-eyeSpacing + 5) * s, (eyeOffsetY + 4) * s);
        g.stroke();
        g.moveTo((eyeSpacing - 5) * s, (eyeOffsetY + 4) * s);
        g.lineTo((eyeSpacing + 5) * s, (eyeOffsetY + 6) * s);
        g.stroke();
        g.fillColor = new Color(100, 180, 255, 200);
        g.ellipse((-eyeSpacing + 5) * s, (eyeOffsetY - 8) * s, 2 * s, 4 * s);
        g.fill();
        g.ellipse((eyeSpacing + 5) * s, (eyeOffsetY - 8) * s, 2 * s, 4 * s);
        g.fill();
    }

    private drawSleepingEyes(s: number, eyeOffsetY: number, eyeSpacing: number): void {
        const g = this.graphics;
        g.strokeColor = new Color(30, 30, 30, 255);
        g.lineWidth = 2.5 * s;
        g.moveTo((-eyeSpacing - 4) * s, eyeOffsetY * s);
        g.lineTo((-eyeSpacing + 4) * s, eyeOffsetY * s);
        g.stroke();
        g.moveTo((eyeSpacing - 4) * s, eyeOffsetY * s);
        g.lineTo((eyeSpacing + 4) * s, eyeOffsetY * s);
        g.stroke();
        g.fillColor = new Color(255, 150, 150, 150);
        g.circle((-eyeSpacing - 6) * s, (eyeOffsetY - 3) * s, 4 * s);
        g.fill();
        g.circle((eyeSpacing + 6) * s, (eyeOffsetY - 3) * s, 4 * s);
        g.fill();
        g.strokeColor = new Color(100, 100, 200, 255);
        g.lineWidth = 1.5 * s;
        g.circle(20 * s, 35 * s, 5 * s);
        g.stroke();
        g.moveTo(25 * s, 33 * s);
        g.lineTo(30 * s, 30 * s);
        g.stroke();
        g.moveTo(30 * s, 30 * s);
        g.lineTo(28 * s, 35 * s);
        g.stroke();
    }

    private drawSurprisedEyes(s: number, eyeOffsetY: number, eyeSpacing: number): void {
        const g = this.graphics;
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle(-eyeSpacing * s, eyeOffsetY * s, 7 * s);
        g.fill();
        g.circle(eyeSpacing * s, eyeOffsetY * s, 7 * s);
        g.fill();
        g.fillColor = new Color(30, 30, 30, 255);
        g.circle(-eyeSpacing * s, eyeOffsetY * s, 4 * s);
        g.fill();
        g.circle(eyeSpacing * s, eyeOffsetY * s, 4 * s);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle((-eyeSpacing + 2) * s, (eyeOffsetY + 2) * s, 1.5 * s);
        g.fill();
        g.circle((eyeSpacing + 2) * s, (eyeOffsetY + 2) * s, 1.5 * s);
        g.fill();
    }

    private drawPlayfulEyes(s: number, eyeOffsetY: number, eyeSpacing: number): void {
        const g = this.graphics;
        g.strokeColor = new Color(30, 30, 30, 255);
        g.lineWidth = 2.5 * s;
        g.arc(-eyeSpacing * s, eyeOffsetY * s, 4 * s, Math.PI * 0.1, Math.PI * 0.9, false);
        g.stroke();
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle(eyeSpacing * s, eyeOffsetY * s, 5 * s);
        g.fill();
        g.fillColor = new Color(30, 30, 30, 255);
        g.circle((eyeSpacing + 2) * s, eyeOffsetY * s, 3 * s);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle((eyeSpacing + 3) * s, (eyeOffsetY + 1.5) * s, 1.2 * s);
        g.fill();
    }

    private drawSickEyes(s: number, eyeOffsetY: number, eyeSpacing: number): void {
        const g = this.graphics;
        g.fillColor = new Color(150, 220, 150, 80);
        g.ellipse(0, (eyeOffsetY - 5) * s, 25 * s, 20 * s);
        g.fill();
        g.strokeColor = new Color(30, 30, 30, 255);
        g.lineWidth = 1.5 * s;
        g.arc(-eyeSpacing * s, eyeOffsetY * s, 2 * s, 0, Math.PI * 1.5, false);
        g.stroke();
        g.arc(-eyeSpacing * s, eyeOffsetY * s, 4 * s, Math.PI * 0.5, Math.PI * 2, false);
        g.stroke();
        g.arc(eyeSpacing * s, eyeOffsetY * s, 2 * s, 0, Math.PI * 1.5, false);
        g.stroke();
        g.arc(eyeSpacing * s, eyeOffsetY * s, 4 * s, Math.PI * 0.5, Math.PI * 2, false);
        g.stroke();
    }
}
