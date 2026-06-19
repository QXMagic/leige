<template>
    <div class="edit-popup">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="500px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="110px" :rules="formRules">
                <el-form-item label="等级序号" prop="level">
                    <el-input v-model="formData.level" type="number" placeholder="如 1、2、3" />
                </el-form-item>
                <el-form-item label="等级名称" prop="name">
                    <el-input v-model="formData.name" placeholder="如 青铜、白银" clearable />
                </el-form-item>
                <el-form-item label="能量下限" prop="min_energy">
                    <el-input v-model="formData.min_energy" type="number" placeholder="达到该等级所需累计能量" />
                </el-form-item>
                <el-form-item label="单期奖励上限" prop="reward_cap">
                    <el-input v-model="formData.reward_cap" type="number" placeholder="该等级每期可获奖励上限" />
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="选填" />
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { levelAdd, levelDetail, levelEdit } from '@/api/promote'
import Popup from '@/components/popup/index.vue'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑等级' : '新增等级'))

const formData = reactive({
    id: '',
    level: '',
    name: '',
    min_energy: '',
    reward_cap: '',
    remark: ''
})

const formRules = reactive({
    level: [{ required: true, message: '请输入等级序号', trigger: 'blur' }],
    name: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
    min_energy: [{ required: true, message: '请输入能量下限', trigger: 'blur' }],
    reward_cap: [{ required: true, message: '请输入奖励上限', trigger: 'blur' }]
})

const handleSubmit = async () => {
    await formRef.value?.validate()
    mode.value == 'edit' ? await levelEdit(formData) : await levelAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    popupRef.value?.open()
}

const setFormData = async (row: any) => {
    const data = await levelDetail({ id: row.id })
    for (const key in formData) {
        if (data[key] != null && data[key] != undefined) {
            //@ts-ignore
            formData[key] = data[key]
        }
    }
}

const handleClose = () => emit('close')

defineExpose({ open, setFormData })
</script>
