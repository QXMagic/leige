import request from '@/utils/request'

export function policyDetailLists(params: any) {
    return request.get({ url: '/setting.hecom.policy_detail/lists', params })
}

export function policyDetailAdd(params: any) {
    return request.post({ url: '/setting.hecom.policy_detail/add', params })
}

export function policyDetailEdit(params: any) {
    return request.post({ url: '/setting.hecom.policy_detail/edit', params })
}

export function policyDetailDelete(params: any) {
    return request.post({ url: '/setting.hecom.policy_detail/delete', params })
}

export function policyDetailDetail(params: any) {
    return request.get({ url: '/setting.hecom.policy_detail/detail', params })
}

export function policyDetailUpload(params: any) {
    const formData = new FormData()
    formData.append('file', params.file)
    formData.append('import_mode', params.import_mode || 1)

    return request.post({
        url: '/setting.hecom.policy_detail/upload',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

export function policyDetailParse(params: any) {
    return request.post({ url: '/setting.hecom.policy_detail/parse', params })
}

export function policyDetailPreview(params: any) {
    return request.post({ url: '/setting.hecom.policy_detail/preview', params })
}

export function policyDetailValidate(params: any) {
    return request.post({ url: '/setting.hecom.policy_detail/doValidate', params })
}

export function policyDetailImport(params: any) {
    return request.post({ url: '/setting.hecom.policy_detail/import', params })
}

export function policyDetailProgress(params: any) {
    return request.get({ url: '/setting.hecom.policy_detail/progress', params })
}

export function policyDetailImportBatches() {
    return request.get({ url: '/setting.hecom.policy_detail/importBatches' })
}

export function policyDetailDownloadTemplate() {
    return request.get({ url: '/setting.hecom.policy_detail/downloadTemplate' })
}

export function policyDetailBatchSetEndDate(params: any) {
    return request.post({ url: '/setting.hecom.policy_detail/batchSetEndDate', params })
}
