import request from '@/utils/request'

export function identityVerifyLists(params: any) {
    return request.get({ url: '/verify.identity_verify/lists', params })
}

export function identityVerifyDetail(params: any) {
    return request.get({ url: '/verify.identity_verify/detail', params })
}

export function identityVerifyStatistics() {
    return request.get({ url: '/verify.identity_verify/statistics' })
}

export function identityVerifyGetConfig() {
    return request.get({ url: '/verify.identity_verify/getConfig' })
}

export function identityVerifySetConfig(params: any) {
    return request.post({ url: '/verify.identity_verify/setConfig', params })
}

export function identityVerifyExpireRecords() {
    return request.post({ url: '/verify.identity_verify/expireRecords' })
}