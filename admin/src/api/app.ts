import config from '@/config'
import request from '@/utils/request'

// 获取配置
export function getConfig() {
    return request.get({ url: '/config/getConfig' })
}

// 工作台数据
export function getWorkbench() {
    return request.get({ url: '/workbench/index' })
}
