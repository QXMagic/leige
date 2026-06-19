<template>
    <div class="edit-popup">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="550px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form
                class="ls-form"
                ref="formRef"
                :rules="rules"
                :model="formData"
                label-width="100px"
            >
                <el-form-item label="类型名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入选项类型名称" clearable />
                </el-form-item>
                <el-form-item label="类型编码" prop="code">
                    <el-input
                        v-model="formData.code"
                        placeholder="请输入选项类型编码"
                        clearable
                        :disabled="mode == 'edit'"
                    />
                    <div class="form-tips">
                        编码对应 policy_detail 表字段名，如：investor、biz_type、biz_model、filing_mode、policy_date、app_scenario、component_model
                    </div>
                </el-form-item>
                <el-form-item label="排序" prop="sort">
                    <div>
                        <el-input-number v-model="formData.sort" :min="0" :max="9999" />
                        <div class="form-tips">数值越大越排前</div>
                    </div>
                </el-form-item>
                <el-form-item label="状态" required prop="status">
                    <el-radio-group v-model="formData.status">
                        <el-radio :value="1">正常</el-radio>
                        <el-radio :value="0">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input
                        v-model="formData.remark"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 6 }"
                        clearable
                        maxlength="255"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>
<script lang="ts" setup>
import type { FormInstance } from 'element-plus'

import { optionTypeAdd, optionTypeEdit } from '@/api/setting/option'
import Popup from '@/components/popup/index.vue'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => {
    return mode.value == 'edit' ? '编辑选项类型' : '新增选项类型'
})
const formData = reactive({
    id: '',
    name: '',
    code: '',
    sort: 0,
    status: 1,
    remark: ''
})

const rules = {
    name: [
        {
            required: true,
            message: '请输入选项类型名称',
            trigger: ['blur']
        }
    ],
    code: [
        {
            required: true,
            message: '请输入选项类型编码',
            trigger: ['blur']
        }
    ]
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    mode.value == 'edit' ? await optionTypeEdit(formData) : await optionTypeAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const handleClose = () => {
    emit('close')
}

const open = (type = 'add') => {
    mode.value = type
    popupRef.value?.open()
}

const setFormData = (data: Record<any, any>) => {
    for (const key in formData) {
        if (data[key] != null && data[key] != undefined) {
            //@ts-ignore
            formData[key] = data[key]
        }
    }
}

defineExpose({
    open,
    setFormData
})
</script>
