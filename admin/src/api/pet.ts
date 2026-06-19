import request from '@/utils/request'

/** ============ 宠物资料 ============ */
export function petLists(params: any) {
    return request.get({ url: '/promote.pet/lists', params })
}
export function petAdd(params: any) {
    return request.post({ url: '/promote.pet/add', params })
}
export function petEdit(params: any) {
    return request.post({ url: '/promote.pet/edit', params })
}
export function petDelete(params: any) {
    return request.post({ url: '/promote.pet/delete', params })
}
export function petDetail(params: any) {
    return request.get({ url: '/promote.pet/detail', params })
}

/** ============ 宠物解锁记录 ============ */
export function petUnlockLists(params: any) {
    return request.get({ url: '/promote.pet/unlockLists', params })
}
