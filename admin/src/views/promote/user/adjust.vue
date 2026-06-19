<template>
    <div class="adjust-popup">
        <popup
            ref="popupRef"
            title="调整用户能量"
            :async="true"
            width="460px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="90px" :rules="formRules">
                <el-form-item label="用户">
                    <span>{{ userInfo.nickname }}（当前能量 {{ userInfo.energy }}）</span>
                </el-form-item>
                <el-form-item label="调整值" prop="delta">
                    <div>
                        <el-input-number v-model="formData.delta" :step="10" />
                        <div class="form-tips">正数增加、负数扣减；扣减后能量不会低于 0，仅影响自身等级，不向上级阴阳统计传播</div>
                    </div>
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="formData.remark" placeholder="选填" clearable />
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { promoteAdjustEnergy } from '@/api/promote'
import Popup from '@/components/popup/index.vue'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const userInfo = reactive({ nickname: '', energy: 0 })
const formData = reactive({
    user_id: 0,
    delta: 0,
    remark: ''
})
const formRules = {
    delta: [
        {
            validator: (rule: any, value: number, callback: any) => {
                if (!value || Number(value) === 0) callback(new Error('调整值不能为0'))
                else callback()
            },
            trigger: 'blur'
        }
    ]
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    await promoteAdjustEnergy(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (row: any) => {
    formData.user_id = row.id
    formData.delta = 0
    formData.remark = ''
    userInfo.nickname = row.nickname
    userInfo.energy = row.energy
    popupRef.value?.open()
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>
