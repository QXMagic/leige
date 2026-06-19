<template>
    <div class="promote-user">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="昵称">
                    <el-input
                        v-model="formData.nickname"
                        class="w-[180px]"
                        placeholder="用户昵称"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="编号">
                    <el-input
                        v-model="formData.sn"
                        class="w-[180px]"
                        placeholder="用户编号 SN"
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
                <el-table-column label="用户" min-width="150">
                    <template #default="{ row }">
                        <div>{{ row.nickname }}</div>
                        <div class="text-xs text-gray-400">{{ row.sn }}</div>
                    </template>
                </el-table-column>
                <el-table-column label="手机" prop="mobile" min-width="120" />
                <el-table-column label="上级" min-width="120">
                    <template #default="{ row }">
                        <span v-if="row.parent_id">{{ row.parent_nickname }} ({{ row.branch_desc }})</span>
                        <span v-else class="text-gray-400">无</span>
                    </template>
                </el-table-column>
                <el-table-column label="能量" prop="energy" min-width="90" />
                <el-table-column label="等级" prop="level" min-width="70" />
                <el-table-column label="阴累计" prop="yin_energy" min-width="90" />
                <el-table-column label="阳累计" prop="yang_energy" min-width="90" />
                <el-table-column label="累计奖励" prop="reward_total" min-width="100" />
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleTree(row)">推广树</el-button>
                        <el-button
                            v-perms="['promote.promote/adjustEnergy']"
                            type="primary"
                            link
                            @click="handleAdjust(row)"
                        >
                            调能量
                        </el-button>
                        <el-button
                            v-if="row.parent_id"
                            v-perms="['promote.promote/unbind']"
                            type="danger"
                            link
                            @click="handleUnbind(row.id)"
                        >
                            解绑
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
        <adjust-popup v-if="showAdjust" ref="adjustRef" @success="getLists" @close="showAdjust = false" />
        <tree-drawer v-if="showTree" ref="treeRef" @close="showTree = false" />
    </div>
</template>

<script lang="ts" setup name="promoteUser">
import { promoteUnbind, promoteUserLists } from '@/api/promote'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import AdjustPopup from './adjust.vue'
import TreeDrawer from './tree.vue'

const adjustRef = shallowRef<InstanceType<typeof AdjustPopup>>()
const treeRef = shallowRef<InstanceType<typeof TreeDrawer>>()
const showAdjust = ref(false)
const showTree = ref(false)
const formData = reactive({
    nickname: '',
    sn: '',
    branch: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: promoteUserLists,
    params: formData
})

const handleAdjust = async (row: any) => {
    showAdjust.value = true
    await nextTick()
    adjustRef.value?.open(row)
}
const handleTree = async (row: any) => {
    showTree.value = true
    await nextTick()
    treeRef.value?.open(row.id)
}
const handleUnbind = async (id: number) => {
    await feedback.confirm('解绑后将断开与上级的推广关系（历史累计不回退），确定？')
    await promoteUnbind({ user_id: id })
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
