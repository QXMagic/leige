import request from '@/utils/request'

export function importUpload(params: any) {
    const formData = new FormData()
    formData.append('file', params.file)
    formData.append('name', params.name || '')
    formData.append('target_table', params.target_table || '')
    formData.append('import_mode', params.import_mode || 1)

    return request.post({
        url: '/import.import/upload',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

export function importParse(params: any) {
    return request.post({
        url: '/import.import/parse',
        params
    })
}

export function importPreview(params: any) {
    return request.post({
        url: '/import.import/preview',
        params
    })
}

export function importValidate(params: any) {
    return request.post({
        url: '/import.import/doValidate',
        params
    })
}

export function importDo(params: any) {
    return request.post({
        url: '/import.import/import',
        params
    })
}

export function importProgress(params: any) {
    return request.get({
        url: '/import.import/progress',
        params
    })
}

export function importErrorReport(params: any) {
    return request.get({
        url: '/import.import/errorReport',
        params
    })
}

export function importLists(params?: any) {
    return request.get({
        url: '/import.import/lists',
        params
    })
}

export function importDetail(params: any) {
    return request.get({
        url: '/import.import/detail',
        params
    })
}

export function importDelete(params: any) {
    return request.post({
        url: '/import.import/delete',
        params
    })
}

export function importRetry(params: any) {
    return request.post({
        url: '/import.import/retry',
        params
    })
}

export function getImportTables() {
    return request.post({
        url: '/import.import/getTables'
    })
}

export function getTableFields(params: any) {
    return request.post({
        url: '/import.import/getTableFields',
        params
    })
}