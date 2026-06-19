import { Node, tween, Tween, Vec3 } from 'cc';
import { PenguinRenderer, PenguinState } from './PenguinRenderer';
import { GrowthStage, GrowthData } from '../Growth/GrowthSystem';

export class PenguinManager {
    private renderer: PenguinRenderer;
    private state: PenguinState = PenguinState.IDLE;
    private stateTimer: number = 0;
    private idleTween: Tween<Node> | null = null;
    private stateTween: Tween<Node> | null = null;
    private hunger: number = 80;
    private happiness: number = 70;
    private basePos: Vec3 = new Vec3(0, 0, 0);

    constructor(parent: Node) {
        this.renderer = new PenguinRenderer(parent);
    }

    getRenderer(): PenguinRenderer {
        return this.renderer;
    }

    getNode(): Node {
        return this.renderer.getNode();
    }

    getState(): PenguinState {
        return this.state;
    }

    getHunger(): number {
        return this.hunger;
    }

    getHappiness(): number {
        return this.happiness;
    }

    setBasePosition(pos: Vec3): void {
        this.basePos = pos.clone();
        this.getNode().setPosition(pos);
        this.startIdleAnimation();
    }

    update(dt: number): void {
        if (this.state !== PenguinState.IDLE && this.state !== PenguinState.SLEEPING && this.state !== PenguinState.HUNGRY) {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.returnToIdle();
            }
        }
        if (this.state !== PenguinState.SLEEPING) {
            this.hunger = Math.max(0, this.hunger - dt * 0.8);
            this.happiness = Math.max(0, this.happiness - dt * 0.3);
        } else {
            this.hunger = Math.min(100, this.hunger + dt * 0.3);
            this.happiness = Math.max(0, this.happiness - dt * 0.1);
        }
        if (this.hunger < 15 && this.state === PenguinState.IDLE) {
            this.enterHungryState();
        }
    }

    tease(): void {
        if (this.state === PenguinState.SLEEPING) {
            this.returnToIdle();
            return;
        }
        this.setState(PenguinState.TEASED, 2);
        this.happiness = Math.min(100, this.happiness + 5);
        this.playTeaseAnimation();
    }

    play(): void {
        if (this.state === PenguinState.SLEEPING) {
            this.returnToIdle();
            return;
        }
        this.setState(PenguinState.PLAYING, 3);
        this.happiness = Math.min(100, this.happiness + 10);
        this.hunger = Math.max(0, this.hunger - 5);
        this.playPlayAnimation();
    }

    sleep(): void {
        if (this.state === PenguinState.SLEEPING) {
            this.returnToIdle();
            return;
        }
        this.setState(PenguinState.SLEEPING, 0);
        this.playSleepAnimation();
    }

    feed(): void {
        if (this.state === PenguinState.SLEEPING) {
            this.stopAllTweens();
        }
        this.setState(PenguinState.EATING, 2.5);
        this.hunger = Math.min(100, this.hunger + 35);
        this.happiness = Math.min(100, this.happiness + 10);
        this.playEatAnimation();
    }

    evolve(growthData: GrowthData): void {
        this.stopAllTweens();
        const node = this.getNode();
        this.stateTween = tween(node)
            .to(0.3, { scale: new Vec3(1.4, 1.4, 1) }, { easing: 'backOut' })
            .call(() => {
                this.renderer.setStage(growthData.stage);
            })
            .to(0.2, { scale: new Vec3(0.9, 0.9, 1) })
            .to(0.15, { scale: new Vec3(1.05, 1.05, 1) })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                this.returnToIdle();
            })
            .start();
    }

    private enterHungryState(): void {
        this.setState(PenguinState.HUNGRY, 0);
        this.playHungryAnimation();
    }

    private setState(state: PenguinState, duration: number): void {
        this.stopAllTweens();
        this.state = state;
        this.stateTimer = duration;
        this.renderer.setState(state);
    }

    private returnToIdle(): void {
        this.stopAllTweens();
        this.state = PenguinState.IDLE;
        this.stateTimer = 0;
        this.renderer.setState(PenguinState.IDLE);
        const node = this.getNode();
        node.setPosition(this.basePos);
        node.setScale(1, 1, 1);
        node.angle = 0;
        this.startIdleAnimation();
    }

    private startIdleAnimation(): void {
        this.stopIdleTween();
        const node = this.getNode();
        const by = this.basePos.y;
        this.idleTween = tween(node)
            .to(1.5, { position: new Vec3(this.basePos.x, by + 5, 0) }, { easing: 'sineInOut' })
            .to(1.5, { position: new Vec3(this.basePos.x, by - 3, 0) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    private stopIdleTween(): void {
        if (this.idleTween) {
            this.idleTween.stop();
            this.idleTween = null;
        }
    }

    private stopAllTweens(): void {
        if (this.stateTween) {
            this.stateTween.stop();
            this.stateTween = null;
        }
        this.stopIdleTween();
    }

    private playTeaseAnimation(): void {
        const node = this.getNode();
        this.stateTween = tween(node)
            .to(0.08, { angle: 12 })
            .to(0.08, { angle: -12 })
            .to(0.08, { angle: 12 })
            .to(0.08, { angle: -12 })
            .to(0.08, { angle: 8 })
            .to(0.08, { angle: 0 })
            .start();
    }

    private playPlayAnimation(): void {
        const node = this.getNode();
        const by = this.basePos.y;
        this.stateTween = tween(node)
            .to(0.25, { position: new Vec3(this.basePos.x, by + 35, 0) }, { easing: 'backOut' })
            .to(0.25, { position: new Vec3(this.basePos.x, by, 0) }, { easing: 'bounceOut' })
            .to(0.25, { position: new Vec3(this.basePos.x, by + 28, 0) }, { easing: 'backOut' })
            .to(0.25, { position: new Vec3(this.basePos.x, by, 0) }, { easing: 'bounceOut' })
            .start();
    }

    private playSleepAnimation(): void {
        const node = this.getNode();
        this.stateTween = tween(node)
            .to(2.0, { scale: new Vec3(1.03, 0.97, 1) }, { easing: 'sineInOut' })
            .to(2.0, { scale: new Vec3(0.97, 1.03, 1) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    private playHungryAnimation(): void {
        const node = this.getNode();
        this.stateTween = tween(node)
            .to(0.4, { angle: -3 })
            .to(0.4, { angle: 3 })
            .to(0.4, { angle: -3 })
            .to(0.4, { angle: 3 })
            .to(0.3, { angle: 0 })
            .union()
            .repeat(3)
            .start();
    }

    private playEatAnimation(): void {
        const node = this.getNode();
        const by = this.basePos.y;
        this.stateTween = tween(node)
            .to(0.18, { position: new Vec3(this.basePos.x, by - 10, 0) })
            .to(0.18, { position: new Vec3(this.basePos.x, by, 0) })
            .to(0.18, { position: new Vec3(this.basePos.x, by - 10, 0) })
            .to(0.18, { position: new Vec3(this.basePos.x, by, 0) })
            .to(0.18, { position: new Vec3(this.basePos.x, by - 8, 0) })
            .to(0.18, { position: new Vec3(this.basePos.x, by, 0) })
            .delay(0.3)
            .call(() => {
                this.renderer.setState(PenguinState.HAPPY);
            })
            .start();
    }
}
