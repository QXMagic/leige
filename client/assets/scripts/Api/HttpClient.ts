import { sys } from 'cc';

/**
 * 轻量 HTTP 客户端(对接服务端 ThinkPHP /api)。
 * 与 PetApiService 共用 localStorage 键,从而共享游客登录 token。
 *
 * 归一化:服务端 likeadmin 约定 code===1 成功;本客户端统一为 ok=true/false。
 */

export interface HttpResult<T> {
    ok: boolean;
    code: number;
    msg: string;
    data: T | null;
}

const BASE_URL_KEY = 'pet_server_base_url';
const TOKEN_KEY = 'pet_server_token';
const DEVICE_KEY = 'pet_server_device_id';

/** 默认服务端地址(与 docker-compose nginx 8005:80 一致),可运行期覆盖。 */
const DEFAULT_BASE_URL = 'http://localhost:8005';

export class HttpClient {
    private baseUrl: string;
    private token: string;
    private loginPromise: Promise<boolean> | null = null;

    constructor() {
        this.baseUrl = sys.localStorage.getItem(BASE_URL_KEY) || DEFAULT_BASE_URL;
        this.token = sys.localStorage.getItem(TOKEN_KEY) || '';
    }

    setBaseUrl(url: string): void {
        this.baseUrl = url.replace(/\/+$/, '');
        sys.localStorage.setItem(BASE_URL_KEY, this.baseUrl);
    }

    getToken(): string {
        return this.token;
    }

    private getDeviceId(): string {
        let id = sys.localStorage.getItem(DEVICE_KEY) || '';
        if (id.length < 8) {
            id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
            sys.localStorage.setItem(DEVICE_KEY, id);
        }
        return id;
    }

    /** 确保已登录(游客登录换取并缓存 token);并发安全。 */
    ensureLogin(): Promise<boolean> {
        if (this.token) return Promise.resolve(true);
        if (this.loginPromise) return this.loginPromise;
        this.loginPromise = this.raw('POST', '/login/guestLogin', {
            device_id: this.getDeviceId(),
            platform: 'cocos',
        }).then((res) => {
            if (res.ok && res.data && (res.data as any).token) {
                this.token = (res.data as any).token;
                sys.localStorage.setItem(TOKEN_KEY, this.token);
                return true;
            }
            return false;
        }).catch(() => false);
        return this.loginPromise;
    }

    /** 业务请求:自动确保登录。 */
    async request<T>(method: 'GET' | 'POST', path: string, payload?: any): Promise<HttpResult<T>> {
        const logged = await this.ensureLogin();
        if (!logged) {
            return { ok: false, code: -10, msg: '登录失败,无法连接服务器', data: null };
        }
        return this.raw<T>(method, path, payload);
    }

    /** 底层 XHR;GET 时 payload 作为 query。 */
    private raw<T>(method: 'GET' | 'POST', path: string, payload?: any): Promise<HttpResult<T>> {
        return new Promise((resolve) => {
            let url = this.baseUrl + '/api' + path;
            let body: string | null = null;
            if (method === 'GET' && payload) {
                const qs = Object.keys(payload)
                    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(payload[k]))
                    .join('&');
                if (qs) url += (url.includes('?') ? '&' : '?') + qs;
            } else if (payload) {
                body = JSON.stringify(payload);
            }

            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (this.token) xhr.setRequestHeader('token', this.token);
            xhr.timeout = 15000;
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;
                if (xhr.status < 200 || xhr.status >= 300) {
                    resolve({ ok: false, code: xhr.status || -1, msg: `网络错误(${xhr.status})`, data: null });
                    return;
                }
                let json: any;
                try {
                    json = JSON.parse(xhr.responseText);
                } catch (e) {
                    resolve({ ok: false, code: -2, msg: '响应解析失败', data: null });
                    return;
                }
                if (json.code === 1) {
                    resolve({ ok: true, code: 1, msg: json.msg || 'success', data: json.data as T });
                } else {
                    resolve({ ok: false, code: json.code ?? -3, msg: json.msg || '请求失败', data: null });
                }
            };
            xhr.ontimeout = () => resolve({ ok: false, code: -4, msg: '请求超时', data: null });
            xhr.onerror = () => resolve({ ok: false, code: -5, msg: '网络异常', data: null });
            xhr.send(body);
        });
    }
}
