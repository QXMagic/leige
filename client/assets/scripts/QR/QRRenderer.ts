import { Node, Graphics, UITransform, Color } from 'cc';

export class QRRenderer {
    private node: Node;
    private graphics: Graphics;
    private size: number = 140;
    private gridSize: number = 21;
    private cellSize: number;

    constructor(parent: Node) {
        this.node = new Node('QRCode');
        parent.addChild(this.node);
        const transform = this.node.addComponent(UITransform);
        transform.setContentSize(this.size + 20, this.size + 20);
        this.graphics = this.node.addComponent(Graphics);
        this.cellSize = this.size / this.gridSize;
    }

    getNode(): Node {
        return this.node;
    }

    draw(data: string, attribute?: any): void {
        const g = this.graphics;
        g.clear();
        const padding = 10;
        const startX = -this.size / 2;
        const startY = -this.size / 2;
        g.fillColor = new Color(255, 255, 255, 255);
        g.roundRect(startX - padding, startY - padding, this.size + padding * 2, this.size + padding * 2, 6);
        g.fill();
        g.strokeColor = new Color(200, 200, 200, 255);
        g.lineWidth = 1.5;
        g.roundRect(startX - padding, startY - padding, this.size + padding * 2, this.size + padding * 2, 6);
        g.stroke();
        const pattern = this.generatePattern(data);
        const darkColor = new Color(55, 95, 175, 255);
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.isFinderArea(row, col)) continue;
                if (pattern[row][col]) {
                    g.fillColor = darkColor;
                    g.rect(
                        startX + col * this.cellSize,
                        startY + (this.gridSize - 1 - row) * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                    g.fill();
                }
            }
        }
        this.drawFinderPattern(g, startX, startY + (this.gridSize - 7) * this.cellSize, darkColor);
        this.drawFinderPattern(g, startX + (this.gridSize - 7) * this.cellSize, startY + (this.gridSize - 7) * this.cellSize, darkColor);
        this.drawFinderPattern(g, startX, startY, darkColor);
    }

    private isFinderArea(row: number, col: number): boolean {
        return (row < 8 && col < 8) || (row < 8 && col >= this.gridSize - 8) || (row >= this.gridSize - 8 && col < 8);
    }

    private drawFinderPattern(g: Graphics, x: number, y: number, color: Color): void {
        const cs = this.cellSize;
        g.fillColor = color;
        g.rect(x, y, 7 * cs, 7 * cs);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 255);
        g.rect(x + cs, y + cs, 5 * cs, 5 * cs);
        g.fill();
        g.fillColor = color;
        g.rect(x + 2 * cs, y + 2 * cs, 3 * cs, 3 * cs);
        g.fill();
    }

    private generatePattern(data: string): boolean[][] {
        const pattern: boolean[][] = [];
        for (let i = 0; i < this.gridSize; i++) {
            pattern[i] = new Array(this.gridSize).fill(false);
        }
        let seed = 0;
        for (let i = 0; i < data.length; i++) {
            seed = ((seed << 5) - seed) + data.charCodeAt(i);
            seed = seed & seed;
        }
        seed = Math.abs(seed) || 1;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.isFinderArea(row, col)) continue;
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                pattern[row][col] = (seed % 3) !== 0;
            }
        }
        return pattern;
    }
}
