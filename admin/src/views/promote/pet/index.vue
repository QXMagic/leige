<template>
    <div class="promote-pet">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="名称">
                    <el-input
                        v-model="formData.name"
                        class="w-[200px]"
                        placeholder="宠物名称"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="属性">
                    <el-select v-model="formData.attribute" class="w-[160px]" clearable placeholder="全部">
                        <el-option label="火" value="fire" />
                        <el-option label="水" value="water" />
                        <el-option label="木" value="wood" />
                        <el-option label="光" value="light" />
                        <el-option label="暗" value="dark" />
                    </el-select>
                </el-form-item>
                <el-form-item label="品质">
                    <el-select v-model="formData.quality" class="w-[160px]" clearable placeholder="全部">
                        <el-option label="普通" :value="1" />
                        <el-option label="稀有" :value="2" />
                        <el-option label="史诗" :value="3" />
                        <el-option label="传说" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-button v-perms="['promote.pet/add']" type="primary" @click="handleAdd">
                <template #icon>
                    <icon name="el-icon-Plus" />
                </template>
                新增宠物
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="图片" min-width="90">
                        <template #default="{ row }">
                            <el-image
                                v-if="row.image"
                                :src="row.image"
                                style="width: 50px; height: 50px"
                                fit="cover"
                            />
                            <span v-else class="text-gray-300">-</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="名称" prop="name" min-width="140" />
                    <el-table-column label="属性" min-width="90">
                        <template #default="{ row }">
                            <el-tag :type="attributeTag(row.attribute)">{{ attributeText(row.attribute) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="品质" min-width="90">
                        <template #default="{ row }">
                            <el-tag :type="qualityTag(row.quality)">{{ qualityText(row.quality) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="需要积分" prop="points" min-width="100" />
                    <el-table-column label="解锁数" prop="unlock_count" min-width="90" />
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
                                v-perms="['promote.pet/edit']"
                                type="primary"
                                link
                                @click="handleEdit(row)"
                            >
                                编辑
                            </el-button>
                            <el-button
                                v-perms="['promote.pet/delete']"
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

<script lang="ts" setup name="promotePet">
import { petDelete, petLists } from '@/api/pet'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import EditPopup from './edit.vue'

const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const formData = reactive({
    name: '',
    attribute: '',
    quality: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: petLists,
    params: formData
})

const attributeText = (a: string) =>
    ({ fire: '火', water: '水', wood: '木', light: '光', dark: '暗' }[a] || '未知')
const attributeTag = (a: string) =>
    ({ fire: 'danger', water: 'primary', wood: 'success', light: 'warning', dark: 'info' }[a] || 'info') as any

const qualityText = (q: number) => ['', '普通', '稀有', '史诗', '传说'][q] || '普通'
const qualityTag = (q: number) => (['info', '', 'warning', 'danger', 'success'][q] || 'info') as any

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
    await feedback.confirm('确定要删除该宠物？')
    await petDelete({ id })
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
