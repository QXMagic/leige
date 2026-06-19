import request from '@/utils/request'

export function policyBrowseLogLists(params: any) {
    return request.get({ url: '/setting.hecom.policy_browse_log/lists', params })
}

export function policyBrowseLogDetail(params: any) {
    return request.get({ url: '/setting.hecom.policy_browse_log/detail', params })
}

export function policyBrowseLogStatistics(params?: any) {
    return request.get({ url: '/setting.hecom.policy_browse_log/statistics', params })
}

export function policyBrowseLogTrajectory(params: any) {
    return request.get({ url: '/setting.hecom.policy_browse_log/trajectory', params })
}
