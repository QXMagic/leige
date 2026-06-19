<template>
    <div class="import-history">
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item class="w-[280px]" label="导入名称">
                    <el-input v-model="queryParams.name" placeholder="输入导入名称" clearable @keyup.enter="resetPage" />
                </el-form-item>
                <el-form-item class="w-[280px]" label="导入状态">
                    <el-select v-model="queryParams.status" placeholder="选择状态" clearable>
                        <el-option v-for="(label, value) in statusOptions" :key="value" :label="label" :value="value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="导入时间">
                    <el-date-picker v-model="queryParams.create_time" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <div class="mb-4">
                <router-link to="/import/index">
                    <el-button type="primary">
                        <template #icon>
                            <icon name="el-icon-Plus" />
                        </template>
                        新建导入
                    </el-button>
                </router-link>
            </div>

            <el-table v-loading="pager.loading" :data="pager.lists" size="large" border stripe>
                <el-table-column label="ID" prop="id" min-width="80" />
                <el-table-column label="导入名称" prop="name" min-width="180" show-overflow-tooltip />
                <el-table-column label="文件名" prop="file_name" min-width="180" show-tooltip-when-overflow />
                <el-table-column label="目标表" prop="target_table" min-width="120" />
                <el-table-column label="导入模式" prop="mode_desc" min-width="100" />
                <el-table-column label="数据量" min-width="200">
                    <template #default="{ row }">
                        <div class="flex items-center gap-2">
                            <el-progress :percentage="row.progress || 0" :stroke-width="8" style="width: 100px;" />
                            <span class="text-gray-500 text-xs">{{ row.total_rows }}行</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="成功/失败" min-width="120">
                    <template #default="{ row }">
                        <span class="text-green-500">{{ row.imported_rows || 0 }}</span>
                        <span class="text-gray-500 mx-1">/</span>
                        <span class="text-red-500">{{ row.error_rows || 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" min-width="100">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)">{{ getStatusDesc(row.status) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="导入时间" prop="create_time" min-width="160" />
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleView(row)">查看</el-button>
                        <el-button v-if="row.status === 6 || row.status === 3" type="warning" link @click="handleRetry(row)">
                            重试
                        </el-button>
                        <el-button v-if="![4, 5].includes(row.status)" type="danger" link @click="handleDelete(row.id)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <el-dialog v-model="detailVisible" title="导入详情" width="800px" destroy-on-close>
            <el-descriptions v-if="detailData" :column="2" border>
                <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
                <el-descriptions-item label="导入名称">{{ detailData.name }}</el-descriptions-item>
                <el-descriptions-item label="文件名">{{ detailData.file_name }}</el-descriptions-item>
                <el-descriptions-item label="目标表">{{ detailData.target_table }}</el-descriptions-item>
                <el-descriptions-item label="导入模式">{{ detailData.mode_desc }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(detailData.status)">{{ getStatusDesc(detailData.status) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="总行数">{{ detailData.total_rows }}</el-descriptions-item>
                <el-descriptions-item label="已导入">{{ detailData.imported_rows }}</el-descriptions-item>
                <el-descriptions-item label="错误数">{{ detailData.error_rows }}</el-descriptions-item>
                <el-descriptions-item label="进度">{{ detailData.progress }}%</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ detailData.create_time }}</el-descriptions-item>
                <el-descriptions-item v-if="detailData.error_msg" label="错误信息" :span="2">
                    <el-alert type="error" :closable="false">{{ detailData.error_msg }}</el-alert>
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import { importLists, importDetail, importDelete, importRetry } from '@/api/import'

const statusOptions: Record<number, string> = {
    0: '待处理',
    1: '解析中',
    2: '验证中',
    3: '待导入',
    4: '导入中',
    5: '已完成',
    6: '失败'
}

const queryParams = reactive({
    name: '',
    status: '',
    create_time: []
})

const { pager, getLists, resetPage, resetParams } = usePaging({
    fetchFun: importLists,
    params: queryParams
})

const detailVisible = ref(false)
const detailData = ref<any>(null)

const getStatusType = (status: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    const types: Record<number, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
        0: 'info',
        1: 'warning',
        2: 'warning',
        3: 'primary',
        4: 'warning',
        5: 'success',
        6: 'danger'
    }
    return types[status] || 'info'
}

const getStatusDesc = (status: number) => {
    return statusOptions[status] || '未知'
}

const handleView = async (row: any) => {
    try {
        const res = await importDetail({ id: row.id })
        if (res.code === 1) {
            detailData.value = res.data
            detailVisible.value = true
        } else {
            ElMessage.error(res.msg || '获取详情失败')
        }
    } catch (error) {
        console.error('获取详情失败', error)
    }
}

const handleRetry = async (row: any) => {
    try {
        await feedback.confirm('确定要重试该导入吗？')
        const res = await importRetry({ batch_id: row.id })
        if (res.code === 1) {
            ElMessage.success('重置成功')
            getLists()
        } else {
            ElMessage.error(res.msg || '重试失败')
        }
    } catch (error) {
        console.error('重试失败', error)
    }
}

const handleDelete = async (id: number) => {
    try {
        await feedback.confirm('确定要删除该导入记录吗？')
        const res = await importDelete({ id })
        if (res.code === 1) {
            ElMessage.success('删除成功')
            getLists()
        } else {
            ElMessage.error(res.msg || '删除失败')
        }
    } catch (error) {
        console.error('删除失败', error)
    }
}

onMounted(() => {
    getLists()
})
</script>

<style lang="scss" scoped>
.import-history {
    padding: 20px;
}
</style>