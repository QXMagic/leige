<template>
    <div class="promote-branch-log">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="接收者ID">
                    <el-input
                        v-model="formData.user_id"
                        class="w-[160px]"
                        placeholder="上级用户ID"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="来源者ID">
                    <el-input
                        v-model="formData.from_user_id"
                        class="w-[160px]"
                        placeholder="产生能量用户ID"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="分支">
                    <el-select v-model="formData.branch" class="w-[140px]" clearable placeholder="全部">
                        <el-option label="阴(A)" :value="1" />
                        <el-option label="阳(B)" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-table :data="pager.lists" size="large">
                <el-table-column label="ID" prop="id" min-width="70" />
                <el-table-column label="接收者(上级)" min-width="160">
                    <template #default="{ row }">{{ row.nickname }} (#{{ row.user_id }})</template>
                </el-table-column>
                <el-table-column label="来源者(下级)" min-width="160">
                    <template #default="{ row }">{{ row.from_nickname }} (#{{ row.from_user_id }})</template>
                </el-table-column>
                <el-table-column label="分支" prop="branch_desc" min-width="90" />
                <el-table-column label="贡献能量" prop="change_energy" min-width="100" />
                <el-table-column label="时间" prop="create_time" min-width="170" />
            </el-table>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="promoteBranchLog">
import { branchLogLists } from '@/api/promote'
import { usePaging } from '@/hooks/usePaging'

const formData = reactive({
    user_id: '',
    from_user_id: '',
    branch: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: branchLogLists,
    params: formData
})

onMounted(() => {
    getLists()
})
</script>
