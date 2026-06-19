import request from '@/utils/request'

export function hecomConnectorLists(params: any) {
    return request.get({ url: '/setting.hecom.hecom_connector/lists', params })
}

export function hecomConnectorAdd(params: any) {
    return request.post({ url: '/setting.hecom.hecom_connector/add', params })
}

export function hecomConnectorEdit(params: any) {
    return request.post({ url: '/setting.hecom.hecom_connector/edit', params })
}

export function hecomConnectorDelete(params: any) {
    return request.post({ url: '/setting.hecom.hecom_connector/delete', params })
}

export function hecomConnectorDetail(params: any) {
    return request.get({ url: '/setting.hecom.hecom_connector/detail', params })
}

export function hecomTestConnect(params: any) {
    return request.post({ url: '/setting.hecom.hecom_connector/testConnect', params })
}

export function hecomRefreshToken(params: any) {
    return request.post({ url: '/setting.hecom.hecom_connector/refreshToken', params })
}

export function hecomBusinessObjects(params: any) {
    return request.post({ url: '/setting.hecom.hecom_connector/businessObjects', params })
}

export function hecomBusinessData(params: any) {
    return request.post({ url: '/setting.hecom.hecom_connector/businessData', params })
}

export function hecomApiLogs(params: any) {
    return request.get({ url: '/setting.hecom.hecom_connector/apiLogs', params })
}
