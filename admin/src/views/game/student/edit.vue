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
            <el-form ref="formRef" :model="formData" label-width="92px" :rules="formRules">
                <el-form-item label="姓名" prop="name">
                    <el-input v-model="formData.name" placeholder="如 小明" clearable />
                </el-form-item>
                <el-form-item label="头像">
                    <material-picker v-model="formData.avatar" :limit="1" @change="onAvatarChange" />
                    <div class="form-tips">仅支持正方形图片(宽=高),否则游戏端显示会被压扁</div>
                </el-form-item>
                <el-form-item label="学号" prop="student_no">
                    <el-input v-model="formData.student_no" placeholder="选填" clearable />
                </el-form-item>
                <el-form-item label="性别">
                    <el-radio-group v-model="formData.gender">
                        <el-radio :value="0">未知</el-radio>
                        <el-radio :value="1">男</el-radio>
                        <el-radio :value="2">女</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="班级" prop="class_name">
                    <el-input v-model="formData.class_name" placeholder="如 三年级二班" clearable />
                </el-form-item>
                <el-form-item label="联系电话" prop="phone">
                    <el-input v-model="formData.phone" placeholder="选填" clearable />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="formData.sort" :min="0" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
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
import { studentAdd, studentDetail, studentEdit } from '@/api/game'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'
import { isSquareImage } from '@/utils/util'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑学生' : '新增学生'))

const formData = reactive({
    id: '',
    name: '',
    avatar: '',
    student_no: '',
    gender: 0,
    class_name: '',
    phone: '',
    sort: 0,
    status: 1,
    remark: ''
})

const formRules = {
    name: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }]
}

// 选择头像后立刻校验是否为正方形,非正方形清空并提示
const onAvatarChange = async (url: string) => {
    if (!url) return
    const ok = await isSquareImage(url)
    if (!ok) {
        feedback.msgError('学生头像必须是正方形图片(宽=高),请重新选择')
        formData.avatar = ''
    }
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    // 提交前再做一次兜底校验,防止用户绕过 onChange(如直接编辑已有非正方形旧数据后直接保存)
    if (formData.avatar) {
        const ok = await isSquareImage(formData.avatar)
        if (!ok) {
            feedback.msgError('学生头像必须是正方形图片(宽=高),请重新选择')
            return
        }
    }
    mode.value == 'edit' ? await studentEdit(formData) : await studentAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    popupRef.value?.open()
}

const setFormData = async (row: any) => {
    const data = await studentDetail({ id: row.id })
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
