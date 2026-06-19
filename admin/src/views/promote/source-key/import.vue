<template>
    <div class="import-popup">
        <popup
            ref="popupRef"
            title="批量导入活动码"
            :async="true"
            width="520px"
            confirm-button-text="导入"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form label-width="80px">
                <el-form-item label="活动码">
                    <el-input
                        v-model="codes"
                        type="textarea"
                        :rows="10"
                        placeholder="每行一个活动码，重复及已存在的将自动跳过"
                    />
                </el-form-item>
                <div class="form-tips px-[80px]">
                    每行一个；导入后每个码全局仅可被扫码消费一次。
                </div>
                <el-alert
                    v-if="result"
                    class="mt-3"
                    :title="resultText"
                    type="success"
                    :closable="false"
                />
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import { sourceKeyBatchImport } from '@/api/promote'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

const emit = defineEmits(['success', 'close'])
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const codes = ref('')
const result = ref<any>(null)

const resultText = computed(() => {
    if (!result.value) return ''
    const r = result.value
    return `成功 ${r.success} 个，已存在跳过 ${r.exists} 个，重复 ${r.duplicated} 个，空行 ${r.empty} 个`
})

const handleSubmit = async () => {
    if (!codes.value.trim()) {
        feedback.msgError('请输入活动码')
        return
    }
    result.value = await sourceKeyBatchImport({ codes: codes.value })
    feedback.msgSuccess(resultText.value)
    popupRef.value?.close()
    emit('success')
}

const open = () => {
    codes.value = ''
    result.value = null
    popupRef.value?.open()
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>
