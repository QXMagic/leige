import { sys } from 'cc';
import { PetCatalog, CatalogPet, mapServerCatalog, mapServerPet } from '../Pet/PetCatalogData';

/**
 * 宠物图鉴真实接口服务(对接服务端 ThinkPHP /api)。
 *
 * 与游戏内既有 MockApiService 保持一致的返回约定:code===0 表示成功。
 * 服务端 likeadmin 约定为 code===1 成功,本服务在内部做归一化。
 *
 * 鉴权:首次使用游客登录(device_id 绑定)换取 token,后续请求在 header 携带 token。
 */

export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T | null;
}

const BASE_URL_KEY = 'pet_server_base_url';
const TOKEN_KEY = 'pet_server_token';
const DEVICE_KEY = 'pet_server_device_id';

/** 默认服务端地址;可在运行期通过 PetApiService.setBaseUrl() 覆盖(写入本地存储)。
 *  与 docker-compose 端口映射一致(nginx 8005:80)。 */
const DEFAULT_BASE_URL = 'http://localhost:8005';

export class PetApiService {
    private baseUrl: string;
    private token: string;

    constructor() {
        this.baseUrl = sys.localStorage.getItem(BASE_URL_KEY) || DEFAULT_BASE_URL;
        this.token = sys.localStorage.getItem(TOKEN_KEY) || '';
    }

    /** 配置服务端地址(去掉末尾斜杠) */
    setBaseUrl(url: string): void {
        this.baseUrl = url.replace(/\/+$/, '');
        sys.localStorage.setItem(BASE_URL_KEY, this.baseUrl);
    }

    getToken(): string {
        return this.token;
    }

    private setToken(token: string): void {
        this.token = token || '';
        sys.localStorage.setItem(TOKEN_KEY, this.token);
    }

    /** 获取/生成稳定的设备ID(>=8 位,满足服务端校验) */
    private getDeviceId(): string {
        let id = sys.localStorage.getItem(DEVICE_KEY) || '';
        if (id.length < 8) {
            id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
            sys.localStorage.setItem(DEVICE_KEY, id);
        }
        return id;
    }

    private success<T>(data: T): ApiResponse<T> {
        return { code: 0, message: 'success', data };
    }

    private error(code: number, message: string): ApiResponse<null> {
        return { code, message, data: null };
    }

    /**
     * 底层请求。method: GET/POST;自动注入 token;归一化 likeadmin 响应。
     */
    private request<T>(method: 'GET' | 'POST', path: string, body?: any): Promise<ApiResponse<T>> {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            const url = this.baseUrl + '/api' + path;
            xhr.open(method, url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (this.token) {
                xhr.setRequestHeader('token', this.token);
            }
            xhr.timeout = 15000;
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;
                if (xhr.status < 200 || xhr.status >= 300) {
                    resolve(this.error(xhr.status || -1, `网络错误(${xhr.status})`) as ApiResponse<T>);
                    return;
                }
                let json: any;
                try {
                    json = JSON.parse(xhr.responseText);
                } catch (e) {
                    resolve(this.error(-2, '响应解析失败') as ApiResponse<T>);
                    return;
                }
                // likeadmin: code===1 成功, code===0 失败
                if (json.code === 1) {
                    resolve(this.success<T>(json.data as T));
                } else {
                    resolve(this.error(json.code ?? -3, json.msg || '请求失败') as ApiResponse<T>);
                }
            };
            xhr.ontimeout = () => resolve(this.error(-4, '请求超时') as ApiResponse<T>);
            xhr.onerror = () => resolve(this.error(-5, '网络异常') as ApiResponse<T>);
            xhr.send(body ? JSON.stringify(body) : null);
        });
    }

    /** 游客登录,换取并保存 token。已登录则直接复用。 */
    async ensureLogin(): Promise<ApiResponse<{ token: string }>> {
        if (this.token) {
            return this.success({ token: this.token });
        }
        const res = await this.request<any>('POST', '/login/guestLogin', {
            device_id: this.getDeviceId(),
            platform: 'cocos',
        });
        if (res.code === 0 && res.data && res.data.token) {
            this.setToken(res.data.token);
            return this.success({ token: this.token });
        }
        return this.error(res.code, res.message) as ApiResponse<{ token: string }>;
    }

    /** 宠物图鉴:全部宠物 + 解锁状态 + 我的积分。自动确保已登录。 */
    async getCatalog(): Promise<ApiResponse<PetCatalog>> {
        const login = await this.ensureLogin();
        if (login.code !== 0) {
            return this.error(login.code, login.message) as ApiResponse<PetCatalog>;
        }
        const res = await this.request<any>('GET', '/pet/catalog');
        if (res.code !== 0) {
            return this.error(res.code, res.message) as ApiResponse<PetCatalog>;
        }
        return this.success(mapServerCatalog(res.data));
    }

    /** 我已解锁的宠物 */
    async getMyPets(): Promise<ApiResponse<PetCatalog>> {
        const login = await this.ensureLogin();
        if (login.code !== 0) {
            return this.error(login.code, login.message) as ApiResponse<PetCatalog>;
        }
        const res = await this.request<any>('GET', '/pet/my');
        if (res.code !== 0) {
            return this.error(res.code, res.message) as ApiResponse<PetCatalog>;
        }
        return this.success(mapServerCatalog(res.data));
    }

    /** 解锁宠物(积分达标即解锁,不扣减积分) */
    async unlockPet(petId: number): Promise<ApiResponse<CatalogPet>> {
        const login = await this.ensureLogin();
        if (login.code !== 0) {
            return this.error(login.code, login.message) as ApiResponse<CatalogPet>;
        }
        const res = await this.request<any>('POST', '/pet/unlock', { pet_id: petId });
        if (res.code !== 0) {
            return this.error(res.code, res.message) as ApiResponse<CatalogPet>;
        }
        return this.success(mapServerPet(res.data));
    }
}
