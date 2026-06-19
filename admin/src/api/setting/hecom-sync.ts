import request from '@/utils/request'

export function hecomSyncLists(params: any) {
    return request.get({ url: '/setting.hecom.hecom_sync/lists', params })
}

export function hecomSyncFull(params: any) {
    return request.post({ url: '/setting.hecom.hecom_sync/syncFull', params })
}

export function hecomSyncIncrement(params: any) {
    return request.post({ url: '/setting.hecom.hecom_sync/syncIncrement', params })
}

export function hecomSyncStatus(params: any) {
    return request.get({ url: '/setting.hecom.hecom_sync/syncStatus', params })
}

export function hecomSyncLogs(params: any) {
    return request.get({ url: '/setting.hecom.hecom_sync/syncLogs', params })
}

export function hecomSyncConnectors() {
    return request.get({ url: '/setting.hecom.hecom_sync/connectors' })
}
