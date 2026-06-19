<template>
    <div class="option-config">
        <div class="flex gap-4">
            <el-card class="!border-none flex-none" shadow="never" style="width: 360px">
                <template #header>
                    <div class="flex items-center justify-between">
                        <span class="font-medium">选项类型</span>
                        <el-button
                            v-perms="['setting.option.option_type/add']"
                            type="primary"
                            size="small"
                            @click="handleAddType"
                        >
                            <template #icon>
                                <icon name="el-icon-Plus" />
                            </template>
                            新增
                        </el-button>
                    </div>
                </template>
                <el-input
                    v-model="typeQuery.name"
                    placeholder="搜索类型名称"
                    clearable
                    class="mb-3"
                    @keyup.enter="getTypeLists"
                    @clear="getTypeLists"
                >
                    <template #append>
                        <el-button @click="getTypeLists">
                            <icon name="el-icon-Search" />
                        </el-button>
                    </template>
                </el-input>
                <div v-loading="typeLoading" class="type-list">
                    <div
                        v-for="item in typeList"
                        :key="item.id"
                        class="type-item"
                        :class="{ active: currentType?.id === item.id }"
                        @click="handleSelectType(item)"
                    >
                        <div class="flex items-center justify-between flex-1 min-w-0">
                            <div class="flex items-center min-w-0 flex-1">
                                <icon :name="getTypeIcon(item.code)" class="mr-2 flex-none" />
                                <span class="truncate">{{ item.name }}</span>
                            </div>
                            <div class="flex items-center gap-1 flex-none">
                                <el-tag v-if="item.is_syncable" type="success" size="small">
                                    可同步
                                </el-tag>
                                <el-tag :type="item.status ? undefined : 'danger'" size="small">
                                    {{ item.status ? '正常' : '停用' }}
                                </el-tag>
                            </div>
                        </div>
                        <div class="type-actions" @click.stop>
                            <el-button
                                v-perms="['setting.option.option_type/edit']"
                                link
                                type="primary"
                                size="small"
                                @click="handleEditType(item)"
                            >
                                编辑
                            </el-button>
                            <el-button
                                v-perms="['setting.option.option_type/delete']"
                                link
                                type="danger"
                                size="small"
                                @click="handleDeleteType(item.id)"
                            >
                                删除
                            </el-button>
                        </div>
                    </div>
                    <el-empty v-if="!typeLoading && !typeList.length" description="暂无选项类型" />
                </div>
            </el-card>

            <el-card class="!border-none flex-1" shadow="never">
                <template #header>
                    <div class="flex items-center justify-between">
                        <span class="font-medium">
                            {{ currentType ? `${currentType.name} - 选项值` : '选项值' }}
                            <el-tag
                                v-if="currentType?.policy_field"
                                size="small"
                                type="info"
                                class="ml-2"
                            >
                                字段: {{ currentType.policy_field }}
                            </el-tag>
                        </span>
                        <div class="flex items-center gap-2">
                            <el-button
                                v-if="currentType"
                                @click="handlePreview"
                            >
                                <template #icon>
                                    <icon name="el-icon-View" />
                                </template>
                                预览配置
                            </el-button>
                            <el-button
                                v-if="currentType?.is_syncable"
                                v-perms="['setting.option.option_value/sync']"
                                type="warning"
                                :loading="syncLoading"
                                @click="handleSync"
                            >
                                <template #icon>
                                    <icon name="el-icon-Refresh" />
                                </template>
                                从policy_detail同步
                            </el-button>
                            <el-button
                                v-perms="['setting.option.option_value/delete']"
                                :disabled="!currentType || !selectData.length"
                                type="danger"
                                @click="handleDeleteValue(selectData)"
                            >
                                <template #icon>
                                    <icon name="el-icon-Delete" />
                                </template>
                                删除
                            </el-button>
                        </div>
                    </div>
                </template>

                <div v-if="!currentType" class="flex items-center justify-center" style="height: 400px">
                    <el-empty description="请在左侧选择选项类型" />
                </div>

                <div v-else v-loading="valueLoading">
                    <el-alert
                        v-if="currentType?.is_syncable"
                        type="info"
                        :closable="false"
                        class="mb-3"
                    >
                        <template #title>
                            该选项类型已关联 policy_detail.{{ currentType.policy_field }} 字段，
                            点击"从policy_detail同步"按钮可自动获取最新数据。
                        </template>
                    </el-alert>
                    <el-table
                        :data="valuePager.lists"
                        size="large"
                        row-key="id"
                        default-expand-all
                        @selection-change="handleSelectionChange"
                    >
                        <el-table-column type="selection" width="55" />
                        <el-table-column label="ID" prop="id" width="80" />
                        <el-table-column label="选项名称" prop="name" min-width="150" />
                        <el-table-column label="选项值" prop="value" min-width="150" />
                        <el-table-column label="数据来源" min-width="120">
                            <template v-slot="{ row }">
                                <el-tag v-if="row.remark === '从policy_detail同步'" type="success" size="small">
                                    自动同步
                                </el-tag>
                                <el-tag v-else type="info" size="small">手动录入</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="100">
                            <template v-slot="{ row }">
                                <el-tag v-if="row.status == 1" size="small">正常</el-tag>
                                <el-tag v-else type="danger" size="small">停用</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="排序" prop="sort" width="80" />
                        <el-table-column label="创建时间" prop="create_time" min-width="180" />
                        <el-table-column label="操作" width="100" fixed="right">
                            <template #default="{ row }">
                                <el-button
                                    v-perms="['setting.option.option_value/delete']"
                                    link
                                    type="danger"
                                    @click="handleDeleteValue(row.id)"
                                >
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="flex justify-end mt-4">
                        <pagination v-model="valuePager" @change="getValueLists" />
                    </div>
                </div>
            </el-card>
        </div>

        <type-edit-popup
            v-if="showTypeEdit"
            ref="typeEditRef"
            @success="onTypeEditSuccess"
            @close="showTypeEdit = false"
        />

        <el-dialog v-model="showPreview" title="配置预览" width="700px" destroy-on-close>
            <div v-if="previewData.length">
                <div v-for="type in previewData" :key="type.id" class="mb-4">
                    <div class="font-medium mb-2 flex items-center">
                        <icon :name="getTypeIcon(type.code)" class="mr-2" />
                        {{ type.name }}
                        <el-tag size="small" class="ml-2">{{ type.code }}</el-tag>
                    </div>
                    <el-table :data="type.values || []" size="small" border row-key="id" default-expand-all>
                        <el-table-column label="名称" prop="name" min-width="150" />
                        <el-table-column label="值" prop="value" min-width="150" />
                        <el-table-column label="状态" width="80">
                            <template v-slot="{ row }">
                                <el-tag v-if="row.status == 1" size="small">正常</el-tag>
                                <el-tag v-else type="danger" size="small">停用</el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
            <el-empty v-else description="暂无配置数据" />
        </el-dialog>
    </div>
</template>
<script lang="ts" setup name="optionConfig">
import {
    optionTypeDelete,
    optionTypeLists,
    optionValueDelete,
    optionValueLists,
    optionValueTree,
    optionValueSync
} from '@/api/setting/option'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

import TypeEditPopup from './type-edit.vue'

const typeEditRef = shallowRef<InstanceType<typeof TypeEditPopup>>()
const showTypeEdit = ref(false)

const typeLoading = ref(false)
const valueLoading = ref(false)
const syncLoading = ref(false)
const typeList = ref<any[]>([])
const currentType = ref<any>(null)
const selectData = ref<any[]>([])
const showPreview = ref(false)
const previewData = ref<any[]>([])

const typeQuery = reactive({
    name: '',
    status: ''
})

const valueQuery = reactive({
    type_id: 0,
    name: '',
    status: ''
})

const { pager: valuePager, getLists: getValueLists, resetPage: resetValuePage } = usePaging({
    fetchFun: optionValueLists,
    params: valueQuery
})

const typeIconMap: Record<string, string> = {
    investor: 'el-icon-Money',
    biz_type: 'el-icon-Briefcase',
    policy_date: 'el-icon-Calendar',
    biz_model: 'el-icon-DataAnalysis',
    filing_mode: 'el-icon-Document',
    app_scenario: 'el-icon-Location',
    component_model: 'el-icon-Box',
    capital_source: 'el-icon-Money',
    business_type: 'el-icon-Briefcase',
    business_model: 'el-icon-DataAnalysis',
    filing_method: 'el-icon-Document',
    policy_region: 'el-icon-Location'
}

const getTypeIcon = (code: string) => {
    return typeIconMap[code] || 'el-icon-Setting'
}

const getTypeLists = async () => {
    typeLoading.value = true
    try {
        const data = await optionTypeLists({ ...typeQuery, page_size: 100 })
        typeList.value = data.lists || []
    } finally {
        typeLoading.value = false
    }
}

const handleSelectType = (item: any) => {
    currentType.value = item
    valueQuery.type_id = item.id
    resetValuePage()
}

const handleAddType = async () => {
    showTypeEdit.value = true
    await nextTick()
    typeEditRef.value?.open('add')
}

const handleEditType = async (data: any) => {
    showTypeEdit.value = true
    await nextTick()
    typeEditRef.value?.open('edit')
    typeEditRef.value?.setFormData(data)
}

const handleDeleteType = async (id: any) => {
    await feedback.confirm('确定要删除该选项类型？删除后该类型下的选项值也将被删除。')
    await optionTypeDelete({ id })
    if (currentType.value?.id === id) {
        currentType.value = null
        valueQuery.type_id = 0
    }
    getTypeLists()
}

const onTypeEditSuccess = () => {
    getTypeLists()
}

const handleDeleteValue = async (id: any[] | number) => {
    await feedback.confirm('确定要删除？')
    await optionValueDelete({ id })
    getValueLists()
}

const handleSelectionChange = (val: any[]) => {
    selectData.value = val.map(({ id }) => id)
}

const handleSync = async () => {
    if (!currentType.value) return
    await feedback.confirm(
        `将从 policy_detail.${currentType.value.policy_field} 字段同步数据，已存在但不在源数据中的选项值将被删除，是否继续？`
    )
    syncLoading.value = true
    try {
        const result = await optionValueSync({ type_id: currentType.value.id })
        feedback.msgSuccess(
            `同步完成：新增 ${result.added} 条，跳过 ${result.skipped} 条，移除 ${result.removed} 条`
        )
        getValueLists()
    } catch (e: any) {
        feedback.msgError(e.message || '同步失败')
    } finally {
        syncLoading.value = false
    }
}

const handlePreview = async () => {
    if (!currentType.value) return
    try {
        const treeData = await optionValueTree({ type_id: currentType.value.id })
        previewData.value = [
            {
                ...currentType.value,
                values: treeData || []
            }
        ]
        showPreview.value = true
    } catch {
        feedback.msgError('获取配置数据失败')
    }
}

getTypeLists()
</script>

<style lang="scss" scoped>
.type-list {
    max-height: calc(100vh - 320px);
    overflow-y: auto;
}

.type-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background-color: var(--el-fill-color-light);

        .type-actions {
            opacity: 1;
        }
    }

    &.active {
        background-color: var(--el-color-primary-light-9);
        border-left: 3px solid var(--el-color-primary);
    }
}

.type-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.2s;
    margin-left: 8px;
    flex-shrink: 0;
}
</style>
