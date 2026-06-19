import request from '@/utils/request'

export function hecomAgreementLists(params: any) {
    return request.get({ url: '/setting.hecom.hecom_agreement/lists', params })
}

export function hecomAgreementSyncFull(params: any) {
    return request.post({ url: '/setting.hecom.hecom_agreement/syncFull', params })
}

export function hecomAgreementSyncIncrement(params: any) {
    return request.post({ url: '/setting.hecom.hecom_agreement/syncIncrement', params })
}

export function hecomAgreementSyncStatus(params: any) {
    return request.get({ url: '/setting.hecom.hecom_agreement/syncStatus', params })
}

export function hecomAgreementConnectors() {
    return request.get({ url: '/setting.hecom.hecom_agreement/connectors' })
}
