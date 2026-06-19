<template>
    <div class="edit-popup">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="540px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="100px" :rules="formRules">
                <el-form-item label="标识" prop="key">
                    <el-input v-model="formData.key" placeholder="唯一英文标识，如 streak_7" clearable />
                </el-form-item>
                <el-form-item label="名称" prop="name">
                    <el-input v-model="formData.name" placeholder="如 连续满勤7天" clearable />
                </el-form-item>
                <el-form-item label="类型" prop="type">
                    <el-select v-model="formData.type" placeholder="请选择类型">
                        <el-option label="每日满勤" value="full_day" />
                        <el-option label="连续满勤" value="streak" />
                        <el-option label="累计扫码" value="total_scan" />
                        <el-option label="月度全勤" value="monthly_perfect" />
                    </el-select>
                </el-form-item>
                <el-form-item label="阈值" prop="threshold">
                    <div class="w-full">
                        <el-input-number v-model="formData.threshold" :min="0" />
                        <div class="form-tips">连续满勤=天数；累计扫码=次数；满勤/月度全勤可填 0</div>
                    </div>
                </el-form-item>
                <el-form-item label="图标">
                    <material-picker v-model="formData.icon" :limit="1" />
                </el-form-item>
                <el-form-item label="稀有度">
                    <el-select v-model="formData.rarity">
                        <el-option label="普通" :value="1" />
                        <el-option label="稀有" :value="2" />
                        <el-option label="史诗" :value="3" />
                    </el-select>
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="formData.sort" :min="0" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="选填" />
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { achievementAdd, achievementDetail, achievementEdit } from '@/api/promote'
import Popup from '@/components/popup/index.vue'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑成就' : '新增成就'))

const formData = reactive({
    id: '',
    key: '',
    name: '',
    type: 'streak',
    threshold: 0,
    icon: '',
    rarity: 1,
    sort: 0,
    status: 1,
    remark: ''
})

const formRules = {
    key: [{ required: true, message: '请输入成就标识', trigger: 'blur' }],
    name: [{ required: true, message: '请输入成就名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    mode.value == 'edit' ? await achievementEdit(formData) : await achievementAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    popupRef.value?.open()
}

const setFormData = async (row: any) => {
    const data = await achievementDetail({ id: row.id })
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
