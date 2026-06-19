<template>
    <div class="game-student">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="姓名">
                    <el-input
                        v-model="formData.name"
                        class="w-[180px]"
                        placeholder="学生姓名"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="学号">
                    <el-input
                        v-model="formData.student_no"
                        class="w-[160px]"
                        placeholder="学号"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="班级">
                    <el-input
                        v-model="formData.class_name"
                        class="w-[160px]"
                        placeholder="班级"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="formData.status" class="w-[120px]" clearable placeholder="全部">
                        <el-option label="启用" :value="1" />
                        <el-option label="禁用" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-button v-perms="['game.student/add']" type="primary" @click="handleAdd">
                <template #icon>
                    <icon name="el-icon-Plus" />
                </template>
                新增学生
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="头像" min-width="80">
                        <template #default="{ row }">
                            <el-avatar v-if="row.avatar" :src="row.avatar" :size="40" shape="circle" />
                            <span v-else class="text-gray-300">-</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="姓名" prop="name" min-width="100" />
                    <el-table-column label="学号" prop="student_no" min-width="120" />
                    <el-table-column label="性别" prop="gender_desc" min-width="70" />
                    <el-table-column label="班级" prop="class_name" min-width="120" />
                    <el-table-column label="联系电话" prop="phone" min-width="130" />
                    <el-table-column label="状态" min-width="80">
                        <template #default="{ row }">
                            <el-tag :type="row.status == 1 ? 'success' : 'info'">
                                {{ row.status == 1 ? '启用' : '禁用' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="排序" prop="sort" min-width="70" />
                    <el-table-column label="备注" prop="remark" min-width="140" show-tooltip-when-overflow />
                    <el-table-column label="操作" width="150" fixed="right">
                        <template #default="{ row }">
                            <el-button
                                v-perms="['game.student/edit']"
                                type="primary"
                                link
                                @click="handleEdit(row)"
                            >
                                编辑
                            </el-button>
                            <el-button
                                v-perms="['game.student/delete']"
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

<script lang="ts" setup name="gameStudent">
import { studentDelete, studentLists } from '@/api/game'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import EditPopup from './edit.vue'

const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const formData = reactive({
    name: '',
    student_no: '',
    class_name: '',
    status: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: studentLists,
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
    await feedback.confirm('确定要删除该学生？')
    await studentDelete({ id })
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
