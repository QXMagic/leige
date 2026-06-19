import request from '@/utils/request'

/** ============ 宠物资料 ============ */
export function petLists(params: any) {
    return request.get({ url: '/game.pet/lists', params })
}
export function petAdd(params: any) {
    return request.post({ url: '/game.pet/add', params })
}
export function petEdit(params: any) {
    return request.post({ url: '/game.pet/edit', params })
}
export function petDelete(params: any) {
    return request.post({ url: '/game.pet/delete', params })
}
export function petDetail(params: any) {
    return request.get({ url: '/game.pet/detail', params })
}

/** ============ 学生资料 ============ */
export function studentLists(params: any) {
    return request.get({ url: '/game.student/lists', params })
}
export function studentAdd(params: any) {
    return request.post({ url: '/game.student/add', params })
}
export function studentEdit(params: any) {
    return request.post({ url: '/game.student/edit', params })
}
export function studentDelete(params: any) {
    return request.post({ url: '/game.student/delete', params })
}
export function studentDetail(params: any) {
    return request.get({ url: '/game.student/detail', params })
}
