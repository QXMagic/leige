import { Node, Graphics, UITransform, Color } from 'cc';
import { GrowthStage } from '../Growth/GrowthSystem';

export enum PenguinState {
    IDLE,
    HAPPY,
    HUNGRY,
    PLAYING,
    SLEEPING,
    TEASED,
    EATING
}

export class PenguinRenderer {
    private node: Node;
    private graphics: Graphics;
    private currentState: PenguinState = PenguinState.IDLE;
    private currentStage: GrowthStage = GrowthStage.EGG;

    constructor(parent: Node) {
        this.node = new Node('Penguin');
        parent.addChild(this.node);
        const transform = this.node.addComponent(UITransform);
        transform.setContentSize(250, 250);
        this.graphics = this.node.addComponent(Graphics);
        this.draw();
    }

    getNode(): Node {
        return this.node;
    }

    setState(state: PenguinState): void {
        if (this.currentState === state) return;
        this.currentState = state;
        this.draw();
    }

    setStage(stage: GrowthStage): void {
        this.currentStage = stage;
        this.draw();
    }

    private draw(): void {
        this.graphics.clear();
        switch (this.currentStage) {
            case GrowthStage.EGG:
                this.drawEgg();
                break;
            case GrowthStage.BABY:
                this.drawPenguin(0.6);
                break;
            case GrowthStage.CHILD:
                this.drawPenguin(0.8);
                break;
            case GrowthStage.ADULT:
                this.drawPenguin(1.0);
                break;
            case GrowthStage.LEGEND:
                this.drawLegendPenguin();
                break;
        }
    }

    private drawEgg(): void {
        const g = this.graphics;
        g.fillColor = new Color(255, 250, 235, 255);
        g.ellipse(0, 0, 38, 52);
        g.fill();
        g.strokeColor = new Color(210, 195, 170, 255);
        g.lineWidth = 2.5;
        g.ellipse(0, 0, 38, 52);
        g.stroke();
        g.fillColor = new Color(235, 220, 200, 200);
        g.circle(-12, 18, 7);
        g.fill();
        g.circle(14, 8, 6);
        g.fill();
        g.circle(-6, -18, 5);
        g.fill();
        g.circle(18, 25, 4);
        g.fill();
        g.circle(-20, -5, 3.5);
        g.fill();
        if (this.currentState === PenguinState.SLEEPING) {
            g.fillColor = new Color(180, 180, 220, 200);
            g.circle(30, 40, 5);
            g.fill();
            g.circle(38, 50, 4);
            g.fill();
            g.circle(44, 58, 3);
            g.fill();
        }
    }

    private drawPenguin(s: number): void {
        const g = this.graphics;
        g.fillColor = new Color(0, 0, 0, 25);
        g.ellipse(0, -72 * s, 48 * s, 10 * s);
        g.fill();
        g.fillColor = new Color(255, 160, 40, 255);
        g.ellipse(-20 * s, -68 * s, 17 * s, 8 * s);
        g.fill();
        g.ellipse(20 * s, -68 * s, 17 * s, 8 * s);
        g.fill();
        g.fillColor = new Color(35, 35, 50, 255);
        g.ellipse(0, 0, 58 * s, 72 * s);
        g.fill();
        g.fillColor = new Color(248, 248, 252, 255);
        g.ellipse(0, -6 * s, 40 * s, 52 * s);
        g.fill();
        g.fillColor = new Color(45, 45, 60, 255);
        g.ellipse(-55 * s, -4 * s, 14 * s, 34 * s);
        g.fill();
        g.ellipse(55 * s, -4 * s, 14 * s, 34 * s);
        g.fill();
        this.drawFace(s);
        if (this.currentStage >= GrowthStage.CHILD) {
            this.drawBowTie(s);
        }
        if (this.currentStage >= GrowthStage.ADULT) {
            this.drawScarf(s);
        }
    }

    private drawFace(s: number): void {
        const g = this.graphics;
        switch (this.currentState) {
            case PenguinState.HAPPY:
            case PenguinState.EATING:
                this.drawHappyEyes(s);
                break;
            case PenguinState.HUNGRY:
                this.drawSadEyes(s);
                break;
            case PenguinState.SLEEPING:
                this.drawSleepingEyes(s);
                break;
            case PenguinState.TEASED:
                this.drawSurprisedEyes(s);
                break;
            case PenguinState.PLAYING:
                this.drawPlayfulEyes(s);
                break;
            default:
                this.drawNormalEyes(s);
                break;
        }
        this.drawBeak(s);
    }

    private drawNormalEyes(s: number): void {
        const g = this.graphics;
        g.fillColor = new Color(255, 255, 255, 255);
        g.ellipse(-20 * s, 26 * s, 13 * s, 15 * s);
        g.fill();
        g.ellipse(20 * s, 26 * s, 13 * s, 15 * s);
        g.fill();
        g.fillColor = new Color(20, 20, 35, 255);
        g.circle(-17 * s, 28 * s, 7 * s);
        g.fill();
        g.circle(23 * s, 28 * s, 7 * s);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle(-14 * s, 31 * s, 3 * s);
        g.fill();
        g.circle(26 * s, 31 * s, 3 * s);
        g.fill();
    }

    private drawHappyEyes(s: number): void {
        const g = this.graphics;
        g.strokeColor = new Color(20, 20, 35, 255);
        g.lineWidth = 3 * s;
        g.arc(-20 * s, 28 * s, 9 * s, Math.PI * 0.15, Math.PI * 0.85, false);
        g.stroke();
        g.arc(20 * s, 28 * s, 9 * s, Math.PI * 0.15, Math.PI * 0.85, false);
        g.stroke();
        g.fillColor = new Color(255, 150, 150, 130);
        g.ellipse(-34 * s, 20 * s, 9 * s, 5 * s);
        g.fill();
        g.ellipse(34 * s, 20 * s, 9 * s, 5 * s);
        g.fill();
    }

    private drawSadEyes(s: number): void {
        const g = this.graphics;
        g.fillColor = new Color(255, 255, 255, 255);
        g.ellipse(-20 * s, 24 * s, 13 * s, 15 * s);
        g.fill();
        g.ellipse(20 * s, 24 * s, 13 * s, 15 * s);
        g.fill();
        g.fillColor = new Color(20, 20, 35, 255);
        g.circle(-17 * s, 22 * s, 7 * s);
        g.fill();
        g.circle(23 * s, 22 * s, 7 * s);
        g.fill();
        g.strokeColor = new Color(20, 20, 35, 255);
        g.lineWidth = 2.5 * s;
        g.moveTo(-30 * s, 40 * s);
        g.lineTo(-12 * s, 36 * s);
        g.stroke();
        g.moveTo(30 * s, 40 * s);
        g.lineTo(12 * s, 36 * s);
        g.stroke();
        g.fillColor = new Color(100, 180, 255, 180);
        g.ellipse(-34 * s, 18 * s, 4 * s, 7 * s);
        g.fill();
    }

    private drawSleepingEyes(s: number): void {
        const g = this.graphics;
        g.strokeColor = new Color(20, 20, 35, 255);
        g.lineWidth = 3 * s;
        g.moveTo(-28 * s, 26 * s);
        g.lineTo(-12 * s, 26 * s);
        g.stroke();
        g.moveTo(12 * s, 26 * s);
        g.lineTo(28 * s, 26 * s);
        g.stroke();
        g.fillColor = new Color(255, 150, 150, 110);
        g.ellipse(-34 * s, 20 * s, 8 * s, 5 * s);
        g.fill();
        g.ellipse(34 * s, 20 * s, 8 * s, 5 * s);
        g.fill();
        g.fillColor = new Color(180, 180, 220, 200);
        g.circle(35 * s, 45 * s, 5 * s);
        g.fill();
        g.circle(42 * s, 55 * s, 4 * s);
        g.fill();
        g.circle(47 * s, 63 * s, 3 * s);
        g.fill();
    }

    private drawSurprisedEyes(s: number): void {
        const g = this.graphics;
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle(-20 * s, 26 * s, 15 * s);
        g.fill();
        g.circle(20 * s, 26 * s, 15 * s);
        g.fill();
        g.fillColor = new Color(20, 20, 35, 255);
        g.circle(-20 * s, 26 * s, 5 * s);
        g.fill();
        g.circle(20 * s, 26 * s, 5 * s);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle(-17 * s, 29 * s, 2.5 * s);
        g.fill();
        g.circle(23 * s, 29 * s, 2.5 * s);
        g.fill();
    }

    private drawPlayfulEyes(s: number): void {
        const g = this.graphics;
        g.strokeColor = new Color(20, 20, 35, 255);
        g.lineWidth = 3 * s;
        g.moveTo(-28 * s, 26 * s);
        g.lineTo(-12 * s, 26 * s);
        g.stroke();
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle(20 * s, 26 * s, 14 * s);
        g.fill();
        g.fillColor = new Color(20, 20, 35, 255);
        g.circle(22 * s, 27 * s, 7 * s);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle(25 * s, 30 * s, 2.5 * s);
        g.fill();
        g.fillColor = new Color(255, 120, 120, 255);
        g.ellipse(5 * s, 3 * s, 5 * s, 8 * s);
        g.fill();
    }

    private drawBeak(s: number): void {
        const g = this.graphics;
        if (this.currentState === PenguinState.EATING || this.currentState === PenguinState.TEASED) {
            g.fillColor = new Color(255, 170, 40, 255);
            g.ellipse(0, 15 * s, 10 * s, 5 * s);
            g.fill();
            g.fillColor = new Color(235, 135, 10, 255);
            g.ellipse(0, 6 * s, 9 * s, 6 * s);
            g.fill();
        } else if (this.currentState === PenguinState.HUNGRY) {
            g.fillColor = new Color(255, 170, 40, 255);
            g.moveTo(-8 * s, 14 * s);
            g.lineTo(8 * s, 14 * s);
            g.lineTo(0, 6 * s);
            g.close();
            g.fill();
        } else {
            g.fillColor = new Color(255, 170, 40, 255);
            g.ellipse(0, 13 * s, 10 * s, 5 * s);
            g.fill();
        }
    }

    private drawBowTie(s: number): void {
        const g = this.graphics;
        const y = -28 * s;
        g.fillColor = new Color(255, 75, 75, 255);
        g.moveTo(0, y);
        g.lineTo(-16 * s, y - 7 * s);
        g.lineTo(-16 * s, y + 7 * s);
        g.close();
        g.fill();
        g.moveTo(0, y);
        g.lineTo(16 * s, y - 7 * s);
        g.lineTo(16 * s, y + 7 * s);
        g.close();
        g.fill();
        g.fillColor = new Color(210, 45, 45, 255);
        g.circle(0, y, 3.5 * s);
        g.fill();
    }

    private drawScarf(s: number): void {
        const g = this.graphics;
        const y = -22 * s;
        g.fillColor = new Color(100, 185, 255, 255);
        g.roundRect(-42 * s, y - 6 * s, 84 * s, 14 * s, 5 * s);
        g.fill();
        g.fillColor = new Color(80, 165, 240, 255);
        g.roundRect(12 * s, y + 6 * s, 14 * s, 28 * s, 4 * s);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 80);
        g.roundRect(-37 * s, y - 3 * s, 74 * s, 4 * s, 2 * s);
        g.fill();
    }

    private drawLegendPenguin(): void {
        const g = this.graphics;
        const s = 1.15;
        g.fillColor = new Color(255, 220, 50, 35);
        g.circle(0, 0, 95 * s);
        g.fill();
        g.fillColor = new Color(255, 220, 50, 20);
        g.circle(0, 0, 115 * s);
        g.fill();
        this.drawPenguin(s);
        this.drawCrown(s);
    }

    private drawCrown(s: number): void {
        const g = this.graphics;
        const y = 58 * s;
        g.fillColor = new Color(255, 215, 0, 255);
        g.roundRect(-20 * s, y, 40 * s, 22 * s, 3 * s);
        g.fill();
        g.moveTo(-20 * s, y + 22 * s);
        g.lineTo(-16 * s, y + 34 * s);
        g.lineTo(-8 * s, y + 22 * s);
        g.lineTo(0, y + 36 * s);
        g.lineTo(8 * s, y + 22 * s);
        g.lineTo(16 * s, y + 34 * s);
        g.lineTo(20 * s, y + 22 * s);
        g.close();
        g.fill();
        g.fillColor = new Color(255, 50, 50, 255);
        g.circle(0, y + 11 * s, 3.5 * s);
        g.fill();
        g.fillColor = new Color(50, 100, 255, 255);
        g.circle(-11 * s, y + 11 * s, 2.5 * s);
        g.fill();
        g.circle(11 * s, y + 11 * s, 2.5 * s);
        g.fill();
    }
}
