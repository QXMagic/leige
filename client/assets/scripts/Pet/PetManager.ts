import { Node, tween, Tween, Vec3 } from 'cc';
import { PetRenderer } from './PetRenderer';
import { PetType, GrowthStage, HealthStatus, PetState } from './PetData';
import { GrowthData } from '../Growth/GrowthSystem';
import { HealthSystem } from '../Health/HealthSystem';

export class PetManager {
    private renderer: PetRenderer;
    private healthSystem: HealthSystem;
    private state: PetState = PetState.IDLE;
    private stateTimer: number = 0;
    private idleTween: Tween<Node> | null = null;
    private stateTween: Tween<Node> | null = null;
    private hunger: number = 80;
    private happiness: number = 70;
    private basePos: Vec3 = new Vec3(0, 0, 0);
    private petType: PetType = PetType.PENGUIN;

    constructor(parent: Node) {
        this.renderer = new PetRenderer(parent);
        this.healthSystem = new HealthSystem();
    }

    getRenderer(): PetRenderer {
        return this.renderer;
    }

    getNode(): Node {
        return this.renderer.getNode();
    }

    getState(): PetState {
        return this.state;
    }

    getHunger(): number {
        return this.hunger;
    }

    getHappiness(): number {
        return this.happiness;
    }

    getHealthSystem(): HealthSystem {
        return this.healthSystem;
    }

    getPetType(): PetType {
        return this.petType;
    }

    setPetType(type: PetType): void {
        this.petType = type;
        this.renderer.setPetType(type);
    }

    setBasePosition(pos: Vec3): void {
        this.basePos = pos.clone();
        this.getNode().setPosition(pos);
        this.startIdleAnimation();
    }

    update(dt: number): void {
        if (this.state !== PetState.IDLE && this.state !== PetState.SLEEPING && this.state !== PetState.HUNGRY && this.state !== PetState.SICK) {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.returnToIdle();
            }
        }

        if (this.state !== PetState.SLEEPING) {
            this.hunger -= dt * 0.8;
            this.happiness -= dt * 0.3;
        } else {
            this.hunger += dt * 0.3;
            this.happiness -= dt * 0.1;
        }

        this.hunger = Math.max(0, Math.min(100, this.hunger));
        this.happiness = Math.max(0, Math.min(100, this.happiness));

        const healthStatus = this.healthSystem.update(dt, this.hunger);

        if (this.healthSystem.isDead()) {
            this.stopAllTweens();
            return;
        }

        if ((healthStatus === HealthStatus.SICK || healthStatus === HealthStatus.CRITICAL) && this.state === PetState.IDLE) {
            this.enterSickState();
        }

        if (this.hunger < 15 && this.state === PetState.IDLE) {
            this.enterHungryState();
        }
    }

    tease(): void {
        if (this.state === PetState.SLEEPING) {
            this.returnToIdle();
            return;
        }
        this.setState(PetState.TEASED, 2);
        this.happiness = Math.min(100, this.happiness + 5);
        this.playTeaseAnimation();
    }

    play(): void {
        if (this.state === PetState.SLEEPING) {
            this.returnToIdle();
            return;
        }
        this.setState(PetState.PLAYING, 3);
        this.happiness = Math.min(100, this.happiness + 10);
        this.hunger = Math.max(0, this.hunger - 5);
        this.playPlayAnimation();
    }

    sleep(): void {
        if (this.state === PetState.SLEEPING) {
            this.returnToIdle();
            return;
        }
        this.setState(PetState.SLEEPING, 0);
        this.playSleepAnimation();
    }

    feed(): void {
        if (this.state === PetState.SLEEPING) {
            this.stopAllTweens();
        }
        this.setState(PetState.EATING, 2.5);
        this.hunger = Math.min(100, this.hunger + 35);
        this.happiness = Math.min(100, this.happiness + 10);
        this.healthSystem.heal(5);
        this.playEatAnimation();
    }

    heal(amount: number): void {
        this.healthSystem.heal(amount);
        this.happiness = Math.min(100, this.happiness + 5);
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

    revive(): void {
        this.healthSystem.revive();
        this.hunger = 50;
        this.happiness = 50;
        this.returnToIdle();
    }

    private enterHungryState(): void {
        this.setState(PetState.HUNGRY, 0);
        this.playHungryAnimation();
    }

    private enterSickState(): void {
        this.setState(PetState.SICK, 0);
        this.playSickAnimation();
    }

    private setState(state: PetState, duration: number): void {
        this.stopAllTweens();
        this.state = state;
        this.stateTimer = duration;
        this.renderer.setState(state);
    }

    private returnToIdle(): void {
        this.stopAllTweens();
        this.state = PetState.IDLE;
        this.stateTimer = 0;
        this.renderer.setState(PetState.IDLE);
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

    private playSickAnimation(): void {
        const node = this.getNode();
        this.stateTween = tween(node)
            .to(0.5, { angle: -2 })
            .to(0.5, { angle: 2 })
            .to(0.5, { angle: -2 })
            .to(0.5, { angle: 2 })
            .to(0.4, { angle: 0 })
            .union()
            .repeatForever()
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
                this.renderer.setState(PetState.HAPPY);
            })
            .start();
    }
}
