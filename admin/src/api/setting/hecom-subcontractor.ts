import request from '@/utils/request'

export function hecomSubcontractorLists(params: any) {
    return request.get({ url: '/setting.hecom.hecom_subcontractor/lists', params })
}

export function hecomSubcontractorDetail(params: any) {
    return request.get({ url: '/setting.hecom.hecom_subcontractor/detail', params })
}

export function hecomSubcontractorQueryByTelphone(params: any) {
    return request.post({ url: '/setting.hecom.hecom_subcontractor/queryByTelphone', params })
}

export function hecomSubcontractorMatchUser(params: any) {
    return request.post({ url: '/setting.hecom.hecom_subcontractor/matchUser', params })
}
