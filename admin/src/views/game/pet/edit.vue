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
                <el-form-item label="名称" prop="name">
                    <el-input v-model="formData.name" placeholder="如 小龙" clearable />
                </el-form-item>
                <el-form-item label="图片">
                    <material-picker v-model="formData.image" :limit="1" @change="onImageChange" />
                    <div class="form-tips">仅支持正方形图片(宽=高),否则游戏端显示会被压扁</div>
                </el-form-item>
                <el-form-item label="品质" prop="quality">
                    <el-select v-model="formData.quality">
                        <el-option label="普通" :value="1" />
                        <el-option label="稀有" :value="2" />
                        <el-option label="史诗" :value="3" />
                        <el-option label="传说" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item label="属性">
                    <div class="flex flex-wrap gap-y-2">
                        <div class="flex items-center mr-4">
                            <span class="mr-2 text-tx-secondary">攻击</span>
                            <el-input-number v-model="formData.attack" :min="0" controls-position="right" class="w-[120px]" />
                        </div>
                        <div class="flex items-center mr-4">
                            <span class="mr-2 text-tx-secondary">防御</span>
                            <el-input-number v-model="formData.defense" :min="0" controls-position="right" class="w-[120px]" />
                        </div>
                        <div class="flex items-center mr-4">
                            <span class="mr-2 text-tx-secondary">速度</span>
                            <el-input-number v-model="formData.speed" :min="0" controls-position="right" class="w-[120px]" />
                        </div>
                        <div class="flex items-center mr-4">
                            <span class="mr-2 text-tx-secondary">生命</span>
                            <el-input-number v-model="formData.hp" :min="0" controls-position="right" class="w-[120px]" />
                        </div>
                    </div>
                </el-form-item>
                <el-form-item label="解锁积分" prop="unlock_energy">
                    <div class="w-full">
                        <el-input-number v-model="formData.unlock_energy" :min="0" />
                        <div class="form-tips">用户能量(积分)达到该值即可解锁，0 表示默认解锁</div>
                    </div>
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
import { petAdd, petDetail, petEdit } from '@/api/game'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'
import { isSquareImage } from '@/utils/util'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑宠物' : '新增宠物'))

const formData = reactive({
    id: '',
    name: '',
    image: '',
    quality: 1,
    attack: 0,
    defense: 0,
    speed: 0,
    hp: 0,
    unlock_energy: 0,
    sort: 0,
    status: 1,
    remark: ''
})

const formRules = {
    name: [{ required: true, message: '请输入宠物名称', trigger: 'blur' }],
    quality: [{ required: true, message: '请选择品质', trigger: 'change' }]
}

// 选择宠物图片后立刻校验是否为正方形,非正方形清空并提示
const onImageChange = async (url: string) => {
    if (!url) return
    const ok = await isSquareImage(url)
    if (!ok) {
        feedback.msgError('宠物图片必须是正方形图片(宽=高),请重新选择')
        formData.image = ''
    }
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    // 提交前再做一次兜底校验,防止用户绕过 onChange(如直接编辑已有非正方形旧数据后直接保存)
    if (formData.image) {
        const ok = await isSquareImage(formData.image)
        if (!ok) {
            feedback.msgError('宠物图片必须是正方形图片(宽=高),请重新选择')
            return
        }
    }
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
