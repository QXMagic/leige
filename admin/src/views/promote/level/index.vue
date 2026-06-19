<template>
    <div class="promote-level">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="等级名称">
                    <el-input
                        v-model="formData.name"
                        class="w-[240px]"
                        placeholder="请输入等级名称"
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
            <el-button v-perms="['promote.level/add']" type="primary" @click="handleAdd">
                <template #icon>
                    <icon name="el-icon-Plus" />
                </template>
                新增等级
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="等级" prop="level" min-width="80" />
                    <el-table-column label="名称" prop="name" min-width="120" />
                    <el-table-column label="能量下限" prop="min_energy" min-width="120" />
                    <el-table-column label="单期奖励上限" prop="reward_cap" min-width="140" />
                    <el-table-column label="备注" prop="remark" min-width="160" show-tooltip-when-overflow />
                    <el-table-column label="操作" width="150" fixed="right">
                        <template #default="{ row }">
                            <el-button
                                v-perms="['promote.level/edit']"
                                type="primary"
                                link
                                @click="handleEdit(row)"
                            >
                                编辑
                            </el-button>
                            <el-button
                                v-perms="['promote.level/delete']"
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

<script lang="ts" setup name="promoteLevel">
import { levelDelete, levelLists } from '@/api/promote'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import EditPopup from './edit.vue'

const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const formData = reactive({
    name: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: levelLists,
    params: formData
})

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
    await feedback.confirm('确定要删除该等级？')
    await levelDelete({ id })
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
