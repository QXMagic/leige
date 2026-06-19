<template>
    <div class="promote-energy-log">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="用户ID">
                    <el-input
                        v-model="formData.user_id"
                        class="w-[160px]"
                        placeholder="用户ID"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="来源">
                    <el-select v-model="formData.scene" class="w-[160px]" clearable placeholder="全部">
                        <el-option label="扫码获取" :value="1" />
                        <el-option label="平台调整" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="活动码">
                    <el-input
                        v-model="formData.source_key"
                        class="w-[180px]"
                        placeholder="source_key"
                        clearable
                        @keyup.enter="resetPage"
                    />
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
                <el-table-column label="用户" min-width="140">
                    <template #default="{ row }">
                        <div>{{ row.nickname }}</div>
                        <div class="text-xs text-gray-400">{{ row.user_sn }} (#{{ row.user_id }})</div>
                    </template>
                </el-table-column>
                <el-table-column label="变动" min-width="90">
                    <template #default="{ row }">
                        <span :class="row.change_energy >= 0 ? 'text-green-600' : 'text-red-500'">
                            {{ row.change_energy >= 0 ? '+' : '' }}{{ row.change_energy }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="变动前" prop="before_energy" min-width="90" />
                <el-table-column label="变动后" prop="after_energy" min-width="90" />
                <el-table-column label="来源" prop="scene_desc" min-width="100" />
                <el-table-column label="活动码" prop="source_key" min-width="140" />
                <el-table-column label="时间" prop="create_time" min-width="170" />
            </el-table>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="promoteEnergyLog">
import { energyLogLists } from '@/api/promote'
import { usePaging } from '@/hooks/usePaging'

const formData = reactive({
    user_id: '',
    scene: '',
    source_key: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: energyLogLists,
    params: formData
})

onMounted(() => {
    getLists()
})
</script>
