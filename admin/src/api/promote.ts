import request from '@/utils/request'

/** ============ 推广等级 ============ */
export function levelLists(params: any) {
    return request.get({ url: '/promote.level/lists', params })
}
export function levelAdd(params: any) {
    return request.post({ url: '/promote.level/add', params })
}
export function levelEdit(params: any) {
    return request.post({ url: '/promote.level/edit', params })
}
export function levelDelete(params: any) {
    return request.post({ url: '/promote.level/delete', params })
}
export function levelDetail(params: any) {
    return request.get({ url: '/promote.level/detail', params })
}

/** ============ 活动码 source_key ============ */
export function sourceKeyLists(params: any) {
    return request.get({ url: '/promote.sourceKey/lists', params })
}
export function sourceKeyBatchImport(params: any) {
    return request.post({ url: '/promote.sourceKey/batchImport', params })
}
export function sourceKeyDelete(params: any) {
    return request.post({ url: '/promote.sourceKey/delete', params })
}
export function sourceKeyDetail(params: any) {
    return request.get({ url: '/promote.sourceKey/detail', params })
}

/** ============ 结算记录 ============ */
export function settlementLists(params: any) {
    return request.get({ url: '/promote.settlement/lists', params })
}
export function settlementRun(params: any) {
    return request.post({ url: '/promote.settlement/run', params })
}
export function settlementRevoke(params: any) {
    return request.post({ url: '/promote.settlement/revoke', params })
}

/** ============ 结算周期设置 ============ */
export function getSettlementSettings() {
    return request.get({ url: '/promote.settlementSettings/getConfig' })
}
export function setSettlementSettings(params: any) {
    return request.post({ url: '/promote.settlementSettings/setConfig', params })
}

/** ============ 能量参数设置 ============ */
export function getEnergySettings() {
    return request.get({ url: '/promote.energySettings/getConfig' })
}
export function setEnergySettings(params: any) {
    return request.post({ url: '/promote.energySettings/setConfig', params })
}

/** ============ 能量流水 ============ */
export function energyLogLists(params: any) {
    return request.get({ url: '/promote.energyLog/lists', params })
}

/** ============ 阴阳贡献流水 ============ */
export function branchLogLists(params: any) {
    return request.get({ url: '/promote.branchLog/lists', params })
}

/** ============ 成就配置 ============ */
export function achievementLists(params: any) {
    return request.get({ url: '/promote.achievement/lists', params })
}
export function achievementAdd(params: any) {
    return request.post({ url: '/promote.achievement/add', params })
}
export function achievementEdit(params: any) {
    return request.post({ url: '/promote.achievement/edit', params })
}
export function achievementDelete(params: any) {
    return request.post({ url: '/promote.achievement/delete', params })
}
export function achievementDetail(params: any) {
    return request.get({ url: '/promote.achievement/detail', params })
}

/** ============ 推广用户 ============ */
export function promoteUserLists(params: any) {
    return request.get({ url: '/promote.promote/lists', params })
}
export function promoteAdjustEnergy(params: any) {
    return request.post({ url: '/promote.promote/adjustEnergy', params })
}
export function promoteUnbind(params: any) {
    return request.post({ url: '/promote.promote/unbind', params })
}
export function promoteTree(params: any) {
    return request.get({ url: '/promote.promote/tree', params })
}
