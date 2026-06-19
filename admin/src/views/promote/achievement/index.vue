<template>
    <div class="promote-achievement">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="名称">
                    <el-input
                        v-model="formData.name"
                        class="w-[200px]"
                        placeholder="成就名称"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="类型">
                    <el-select v-model="formData.type" class="w-[160px]" clearable placeholder="全部">
                        <el-option label="每日满勤" value="full_day" />
                        <el-option label="连续满勤" value="streak" />
                        <el-option label="累计扫码" value="total_scan" />
                        <el-option label="月度全勤" value="monthly_perfect" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-button v-perms="['promote.achievement/add']" type="primary" @click="handleAdd">
                <template #icon>
                    <icon name="el-icon-Plus" />
                </template>
                新增成就
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="图标" min-width="80">
                        <template #default="{ row }">
                            <el-image v-if="row.icon" :src="row.icon" style="width: 40px; height: 40px" />
                            <span v-else class="text-gray-300">-</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="标识" prop="key" min-width="120" />
                    <el-table-column label="名称" prop="name" min-width="140" />
                    <el-table-column label="类型" prop="type_desc" min-width="100" />
                    <el-table-column label="阈值" prop="threshold" min-width="80" />
                    <el-table-column label="稀有度" min-width="90">
                        <template #default="{ row }">
                            <el-tag :type="rarityTag(row.rarity)">{{ rarityText(row.rarity) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" min-width="80">
                        <template #default="{ row }">
                            <el-tag :type="row.status == 1 ? 'success' : 'info'">
                                {{ row.status == 1 ? '启用' : '禁用' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="排序" prop="sort" min-width="70" />
                    <el-table-column label="描述" prop="remark" min-width="160" show-tooltip-when-overflow />
                    <el-table-column label="操作" width="150" fixed="right">
                        <template #default="{ row }">
                            <el-button
                                v-perms="['promote.achievement/edit']"
                                type="primary"
                                link
                                @click="handleEdit(row)"
                            >
                                编辑
                            </el-button>
                            <el-button
                                v-perms="['promote.achievement/delete']"
                                type="danger"
                                link
                                @click="handleDelete(row.id)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>
        <edit-popup v-if="showEdit" ref="editRef" @success="getLists" @close="showEdit = false" />
    </div>
</template>

<script lang="ts" setup name="promoteAchievement">
import { achievementDelete, achievementLists } from '@/api/promote'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import EditPopup from './edit.vue'

const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const formData = reactive({
    name: '',
    type: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: achievementLists,
    params: formData
})

const rarityText = (r: number) => ['', '普通', '稀有', '史诗'][r] || '普通'
const rarityTag = (r: number) => (['info', '', 'warning', 'danger'][r] || 'info') as any

const handleAdd = async () => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('add')
}
const handleEdit = async (data: any) => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('edit')
    editRef.value?.setFormData(data)
}
const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该成就？')
    await achievementDelete({ id })
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
