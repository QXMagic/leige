<template>
    <div class="promote-settlement">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="用户ID">
                    <el-input
                        v-model="formData.user_id"
                        class="w-[180px]"
                        placeholder="用户ID"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="结算周期">
                    <el-input
                        v-model="formData.period"
                        class="w-[180px]"
                        placeholder="如 202606"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="formData.status" class="w-[160px]" clearable placeholder="全部">
                        <el-option label="已发放" :value="1" />
                        <el-option label="已撤销" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-button v-perms="['promote.settlement/run']" type="primary" @click="handleRun">
                <template #icon>
                    <icon name="el-icon-Money" />
                </template>
                手动执行结算
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="ID" prop="id" min-width="70" />
                    <el-table-column label="用户" min-width="140">
                        <template #default="{ row }">
                            <div>{{ row.nickname }}</div>
                            <div class="text-xs text-gray-400">{{ row.user_sn }} (#{{ row.user_id }})</div>
                        </template>
                    </el-table-column>
                    <el-table-column label="周期" prop="period" min-width="100" />
                    <el-table-column label="等级" prop="level" min-width="70" />
                    <el-table-column label="奖励上限" prop="reward_cap" min-width="100" />
                    <el-table-column label="阴累计" prop="yin_energy" min-width="90" />
                    <el-table-column label="阳累计" prop="yang_energy" min-width="90" />
                    <el-table-column label="发放奖励" prop="reward" min-width="100" />
                    <el-table-column label="状态" min-width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status == 1 ? 'success' : 'info'">{{ row.status_desc }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="时间" prop="create_time" min-width="170" />
                    <el-table-column label="操作" width="100" fixed="right">
                        <template #default="{ row }">
                            <el-button
                                v-if="row.status == 1"
                                v-perms="['promote.settlement/revoke']"
                                type="danger"
                                link
                                @click="handleRevoke(row.id)"
                            >
                                撤销
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="promoteSettlement">
import { settlementLists, settlementRevoke, settlementRun } from '@/api/promote'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

const formData = reactive({
    user_id: '',
    period: '',
    status: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: settlementLists,
    params: formData
})

const handleRun = async () => {
    try {
        const { value } = await feedback.prompt(
            '留空则按后台配置的当前周期执行；同周期已结算用户会自动跳过。',
            '手动执行结算',
            { inputPlaceholder: '可指定周期，如 202606', confirmButtonText: '执行' }
        )
        const res = await settlementRun({ period: value || '' })
        feedback.msgSuccess(
            `周期 ${res.period}：共 ${res.total}，发放 ${res.granted}，跳过 ${res.skipped}，合计 ${res.reward_sum}`
        )
        getLists()
    } catch (e) {
        // 取消
    }
}

const handleRevoke = async (id: number) => {
    await feedback.confirm('撤销将扣回该用户已发奖励，确定撤销？')
    await settlementRevoke({ id })
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
