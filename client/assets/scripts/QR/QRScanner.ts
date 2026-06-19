export interface IQRScanner {
    scan(): Promise<{ data: string; attribute?: any }>;
}

export class MockQRScanner implements IQRScanner {
    async scan(): Promise<{ data: string; attribute?: any }> {
        const data = this.generateRandomQRData();
        return { data };
    }

    private generateRandomQRData(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

export class QRScanner {
    private impl: IQRScanner;

    constructor() {
        this.impl = new MockQRScanner();
    }

    setImpl(impl: IQRScanner): void {
        this.impl = impl;
    }

    async scan(): Promise<{ data: string; attribute?: any }> {
        return this.impl.scan();
    }
}
