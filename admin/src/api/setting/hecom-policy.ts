import request from '@/utils/request'

export function hecomPolicyLists(params: any) {
    return request.get({ url: '/setting.hecom.hecom_policy_data/lists', params })
}
