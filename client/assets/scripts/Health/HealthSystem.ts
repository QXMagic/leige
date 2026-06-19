import { HealthStatus } from '../Pet/PetData';

export class HealthSystem {
    private health: number = 100;
    private sickTimer: number = 0;
    private deathProbability: number = 0.005;

    getHealth(): number {
        return this.health;
    }

    getHealthStatus(): HealthStatus {
        if (this.health > 60) return HealthStatus.HEALTHY;
        if (this.health > 30) return HealthStatus.HUNGRY;
        if (this.health > 10) return HealthStatus.SICK;
        return HealthStatus.CRITICAL;
    }

    update(dt: number, hunger: number): HealthStatus {
        if (hunger < 5) {
            this.health -= 1.0 * dt;
        } else if (hunger < 15) {
            this.health -= 0.5 * dt;
        } else if (hunger > 60 && this.health < 100) {
            this.health += 0.2 * dt;
        }

        if (this.health < 20) {
            this.sickTimer += dt;
        }

        if (this.sickTimer > 300 && this.health < 10) {
            if (Math.random() < this.deathProbability) {
                this.health = 0;
            }
        }

        this.health = Math.max(0, Math.min(100, this.health));

        return this.getHealthStatus();
    }

    heal(amount: number): void {
        this.health = Math.min(100, this.health + amount);
    }

    isDead(): boolean {
        return this.health <= 0;
    }

    revive(): void {
        this.health = 50;
        this.sickTimer = 0;
    }

    resetSickTimer(): void {
        this.sickTimer = 0;
    }

    serialize(): object {
        return { health: this.health, sickTimer: this.sickTimer };
    }

    deserialize(data: any): void {
        if (data) {
            this.health = data.health ?? 100;
            this.sickTimer = data.sickTimer ?? 0;
        }
    }
}
