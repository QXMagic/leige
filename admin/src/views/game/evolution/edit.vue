<template>
    <div class="edit-popup">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="920px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="92px" :rules="formRules">
                <el-form-item label="路线名称" prop="name">
                    <el-input v-model="formData.name" class="w-[280px]" placeholder="如 火系进化" clearable />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="formData.description" class="w-[480px]" placeholder="选填" clearable />
                </el-form-item>
                <el-form-item label="根节点" prop="root_key">
                    <el-select v-model="formData.root_key" class="w-[280px]" placeholder="选择起始阶段">
                        <el-option v-for="n in formData.nodes" :key="n.key" :value="n.key" :label="nodeLabel(n)" />
                    </el-select>
                    <div class="form-tips ml-2">宠物从根节点开始成长</div>
                </el-form-item>
                <el-form-item label="设为默认">
                    <el-switch v-model="formData.is_default" :active-value="1" :inactive-value="0" />
                    <span class="form-tips ml-2">游戏端新宠物默认使用该路线</span>
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="formData.sort" :min="0" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
                </el-form-item>

                <el-form-item label="进化阶段">
                    <div class="w-full">
                        <el-button type="primary" plain size="small" @click="addNode">
                            <template #icon><icon name="el-icon-Plus" /></template>
                            添加阶段
                        </el-button>
                        <div class="form-tips">每个阶段是一个节点；「后继分支」配置升级后可进化到哪些阶段，多个即为分支（游戏端二选一/多选一）。</div>

                        <div
                            v-for="(node, idx) in formData.nodes"
                            :key="idx"
                            class="mt-3 p-3 rounded border border-gray-200 bg-gray-50"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-medium">阶段 {{ idx + 1 }}</span>
                                <el-button type="danger" link size="small" @click="removeNode(idx)">删除</el-button>
                            </div>
                            <div class="flex flex-wrap gap-x-4 gap-y-2 items-start">
                                <div class="flex items-center">
                                    <span class="mr-1 text-tx-secondary">标识key</span>
                                    <el-input v-model="node.key" class="w-[110px]" placeholder="egg" />
                                </div>
                                <div class="flex items-center">
                                    <span class="mr-1 text-tx-secondary">阶段序号</span>
                                    <el-input-number v-model="node.stage" :min="0" :max="4" class="w-[110px]" controls-position="right" />
                                </div>
                                <div class="flex items-center">
                                    <span class="mr-1 text-tx-secondary">名称</span>
                                    <el-input v-model="node.name" class="w-[120px]" placeholder="幼年" />
                                </div>
                                <div class="flex items-center">
                                    <span class="mr-1 text-tx-secondary">升级所需经验</span>
                                    <el-input-number v-model="node.expRequired" :min="0" class="w-[130px]" controls-position="right" />
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-x-4 gap-y-2 items-center mt-2">
                                <div class="flex items-center"><span class="mr-1 text-tx-secondary">攻击</span><el-input-number v-model="node.attack" :min="0" class="w-[100px]" controls-position="right" /></div>
                                <div class="flex items-center"><span class="mr-1 text-tx-secondary">防御</span><el-input-number v-model="node.defense" :min="0" class="w-[100px]" controls-position="right" /></div>
                                <div class="flex items-center"><span class="mr-1 text-tx-secondary">速度</span><el-input-number v-model="node.speed" :min="0" class="w-[100px]" controls-position="right" /></div>
                                <div class="flex items-center"><span class="mr-1 text-tx-secondary">生命</span><el-input-number v-model="node.hp" :min="0" class="w-[100px]" controls-position="right" /></div>
                            </div>
                            <div class="flex flex-wrap gap-x-4 gap-y-2 items-center mt-2">
                                <div class="flex items-center">
                                    <span class="mr-1 text-tx-secondary">形象图</span>
                                    <material-picker v-model="node.image" :limit="1" />
                                </div>
                                <div class="flex items-center flex-1 min-w-[280px]">
                                    <span class="mr-1 text-tx-secondary whitespace-nowrap">后继分支</span>
                                    <el-select
                                        v-model="node.next"
                                        multiple
                                        clearable
                                        collapse-tags
                                        class="flex-1"
                                        placeholder="升级后可进化到的阶段（多个=分支）"
                                    >
                                        <el-option
                                            v-for="opt in otherNodes(node)"
                                            :key="opt.key"
                                            :value="opt.key"
                                            :label="nodeLabel(opt)"
                                        />
                                    </el-select>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { evolutionAdd, evolutionDetail, evolutionEdit } from '@/api/game'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

interface NodeForm {
    key: string
    stage: number
    name: string
    image: string
    expRequired: number
    attack: number
    defense: number
    speed: number
    hp: number
    next: string[]
}

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑进化路线' : '新增进化路线'))

const formData = reactive({
    id: '',
    name: '',
    description: '',
    root_key: '',
    is_default: 0,
    sort: 0,
    status: 1,
    nodes: [] as NodeForm[]
})

const formRules = {
    name: [{ required: true, message: '请输入路线名称', trigger: 'blur' }],
    root_key: [{ required: true, message: '请选择根节点', trigger: 'change' }]
}

const nodeLabel = (n: NodeForm) => `${n.name || '未命名'}（${n.key}）`
const otherNodes = (self: NodeForm) => formData.nodes.filter((n) => n !== self && n.key)

const newNode = (): NodeForm => ({
    key: `node_${formData.nodes.length + 1}`,
    stage: formData.nodes.length,
    name: '',
    image: '',
    expRequired: 100,
    attack: 0,
    defense: 0,
    speed: 0,
    hp: 0,
    next: []
})
const addNode = () => formData.nodes.push(newNode())
const removeNode = (idx: number) => {
    const removed = formData.nodes[idx]
    formData.nodes.splice(idx, 1)
    // 清理对已删节点的分支引用
    formData.nodes.forEach((n) => (n.next = n.next.filter((k) => k !== removed.key)))
    if (formData.root_key === removed.key) formData.root_key = ''
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    if (!formData.nodes.length) {
        feedback.msgError('请至少添加一个进化阶段')
        return
    }
    const keys = formData.nodes.map((n) => n.key.trim())
    if (keys.some((k) => !k)) {
        feedback.msgError('每个阶段都需要填写标识key')
        return
    }
    if (new Set(keys).size !== keys.length) {
        feedback.msgError('阶段标识key不能重复')
        return
    }
    if (!keys.includes(formData.root_key)) {
        feedback.msgError('根节点必须是已配置的阶段之一')
        return
    }
    mode.value == 'edit' ? await evolutionEdit(formData) : await evolutionAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    if (type === 'add' && !formData.nodes.length) {
        addNode()
        formData.root_key = formData.nodes[0].key
    }
    popupRef.value?.open()
}

const setFormData = async (row: any) => {
    const data = await evolutionDetail({ id: row.id })
    formData.id = data.id
    formData.name = data.name || ''
    formData.description = data.description || ''
    formData.root_key = data.root_key || ''
    formData.is_default = data.is_default ?? 0
    formData.sort = data.sort ?? 0
    formData.status = data.status ?? 1
    formData.nodes = (data.nodes || []).map((n: any) => ({
        key: n.key || '',
        stage: n.stage ?? 0,
        name: n.name || '',
        image: n.image || '',
        expRequired: n.expRequired ?? 0,
        attack: n.attack ?? 0,
        defense: n.defense ?? 0,
        speed: n.speed ?? 0,
        hp: n.hp ?? 0,
        next: Array.isArray(n.next) ? n.next : []
    }))
}

const handleClose = () => emit('close')

defineExpose({ open, setFormData })
</script>
