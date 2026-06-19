<template>
    <div class="promote-source-key">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item label="活动码">
                    <el-input
                        v-model="formData.source_key"
                        class="w-[240px]"
                        placeholder="请输入活动码"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="formData.status" class="w-[160px]" clearable placeholder="全部">
                        <el-option label="未使用" :value="0" />
                        <el-option label="已使用" :value="1" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-button v-perms="['promote.sourceKey/batchImport']" type="primary" @click="handleImport">
                <template #icon>
                    <icon name="el-icon-Upload" />
                </template>
                批量导入
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="ID" prop="id" min-width="70" />
                    <el-table-column label="活动码" prop="source_key" min-width="160" />
                    <el-table-column label="状态" min-width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status == 0 ? 'success' : 'info'">
                                {{ row.status_desc }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="消费者" prop="used_user_nickname" min-width="120" />
                    <el-table-column label="创建时间" prop="create_time" min-width="180" />
                    <el-table-column label="操作" width="100" fixed="right">
                        <template #default="{ row }">
                            <el-button
                                v-if="row.status == 0"
                                v-perms="['promote.sourceKey/delete']"
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
        <import-popup v-if="showImport" ref="importRef" @success="getLists" @close="showImport = false" />
    </div>
</template>

<script lang="ts" setup name="promoteSourceKey">
import { sourceKeyDelete, sourceKeyLists } from '@/api/promote'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import ImportPopup from './import.vue'

const importRef = shallowRef<InstanceType<typeof ImportPopup>>()
const showImport = ref(false)
const formData = reactive({
    source_key: '',
    status: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: sourceKeyLists,
    params: formData
})

const handleImport = async () => {
    showImport.value = true
    await nextTick()
    importRef.value?.open()
}
const handleDelete = async (id: number) => {
    await feedback.confirm('确定要删除该活动码？')
    await sourceKeyDelete({ id })
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
