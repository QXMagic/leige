import request from '@/utils/request'

export function optionTypeLists(params: any) {
    return request.get({ url: '/setting.option.option_type/lists', params })
}

export function optionTypeAll(params?: any) {
    return request.get({ url: '/setting.option.option_type/all', params })
}

export function optionTypeAdd(params: any) {
    return request.post({ url: '/setting.option.option_type/add', params })
}

export function optionTypeEdit(params: any) {
    return request.post({ url: '/setting.option.option_type/edit', params })
}

export function optionTypeDelete(params: any) {
    return request.post({ url: '/setting.option.option_type/delete', params })
}

export function optionTypeDetail(params: any) {
    return request.get({ url: '/setting.option.option_type/detail', params })
}

export function optionValueLists(params: any) {
    return request.get(
        { url: '/setting.option.option_value/lists', params },
        { ignoreCancelToken: true }
    )
}

export function optionValueAdd(params: any) {
    return request.post({ url: '/setting.option.option_value/add', params })
}

export function optionValueEdit(params: any) {
    return request.post({ url: '/setting.option.option_value/edit', params })
}

export function optionValueDelete(params: any) {
    return request.post({ url: '/setting.option.option_value/delete', params })
}

export function optionValueDetail(params: any) {
    return request.get({ url: '/setting.option.option_value/detail', params })
}

export function optionValueTree(params: any) {
    return request.get({ url: '/setting.option.option_value/tree', params })
}

export function optionValueSync(params: any) {
    return request.post({ url: '/setting.option.option_value/sync', params })
}
