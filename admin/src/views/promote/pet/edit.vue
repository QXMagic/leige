<template>
    <div class="edit-popup">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="560px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="100px" :rules="formRules">
                <el-form-item label="宠物名称" prop="name">
                    <el-input v-model="formData.name" placeholder="如 烈焰小龙" clearable />
                </el-form-item>
                <el-form-item label="宠物图片" prop="image">
                    <material-picker v-model="formData.image" :limit="1" />
                </el-form-item>
                <el-form-item label="属性" prop="attribute">
                    <el-select v-model="formData.attribute" placeholder="请选择属性">
                        <el-option label="火" value="fire" />
                        <el-option label="水" value="water" />
                        <el-option label="木" value="wood" />
                        <el-option label="光" value="light" />
                        <el-option label="暗" value="dark" />
                    </el-select>
                </el-form-item>
                <el-form-item label="品质" prop="quality">
                    <el-select v-model="formData.quality" placeholder="请选择品质">
                        <el-option label="普通" :value="1" />
                        <el-option label="稀有" :value="2" />
                        <el-option label="史诗" :value="3" />
                        <el-option label="传说" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item label="需要积分" prop="points">
                    <div class="w-full">
                        <el-input-number v-model="formData.points" :min="0" :step="100" />
                        <div class="form-tips">游戏端用户积分达到该值时可解锁该宠物</div>
                    </div>
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="formData.sort" :min="0" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input
                        v-model="formData.remark"
                        type="textarea"
                        :rows="2"
                        placeholder="选填，宠物背景或属性描述"
                    />
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { petAdd, petDetail, petEdit } from '@/api/pet'
import Popup from '@/components/popup/index.vue'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑宠物' : '新增宠物'))

const formData = reactive({
    id: '',
    name: '',
    image: '',
    attribute: 'fire',
    quality: 1,
    points: 0,
    sort: 0,
    status: 1,
    remark: ''
})

const formRules = {
    name: [{ required: true, message: '请输入宠物名称', trigger: 'blur' }],
    image: [{ required: true, message: '请上传宠物图片', trigger: 'change' }],
    attribute: [{ required: true, message: '请选择属性', trigger: 'change' }],
    quality: [{ required: true, message: '请选择品质', trigger: 'change' }],
    points: [{ required: true, message: '请输入需要积分', trigger: 'blur' }]
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    mode.value == 'edit' ? await petEdit(formData) : await petAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    popupRef.value?.open()
}

const setFormData = async (row: any) => {
    const data = await petDetail({ id: row.id })
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
