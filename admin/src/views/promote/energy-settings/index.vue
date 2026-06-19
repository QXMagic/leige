<template>
    <div class="promote-energy-settings">
        <el-card shadow="never" class="!border-none">
            <div class="font-medium mb-7">能量参数设置</div>
            <el-form ref="formRef" :model="formData" label-width="140px">
                <el-form-item label="单次扫码能量">
                    <div>
                        <el-input-number v-model="formData.scan_energy" :min="1" />
                        <div class="form-tips">每次成功扫码获得的能量值</div>
                    </div>
                </el-form-item>
                <el-form-item label="每日扫码上限">
                    <div>
                        <el-input-number v-model="formData.daily_scan_limit" :min="0" />
                        <div class="form-tips">0 = 不限制；与早中晚时段规则叠加生效</div>
                    </div>
                </el-form-item>
                <el-form-item label="扫码时段">
                    <div class="w-full">
                        <div
                            v-for="(slot, index) in formData.scan_slots"
                            :key="index"
                            class="flex items-center mb-3"
                        >
                            <el-input v-model="slot.name" class="w-[120px]" placeholder="名称 如 早" />
                            <el-time-picker
                                v-model="slot.start"
                                class="!w-[130px] mx-2"
                                value-format="HH:mm"
                                format="HH:mm"
                                placeholder="开始"
                            />
                            <span>~</span>
                            <el-time-picker
                                v-model="slot.end"
                                class="!w-[130px] mx-2"
                                value-format="HH:mm"
                                format="HH:mm"
                                placeholder="结束"
                            />
                            <el-button type="danger" link @click="removeSlot(index)">删除</el-button>
                        </div>
                        <el-button @click="addSlot">
                            <template #icon>
                                <icon name="el-icon-Plus" />
                            </template>
                            添加时段
                        </el-button>
                        <div class="form-tips">用户每个时段当日仅可扫一次；时间为 24 小时制 HH:mm</div>
                    </div>
                </el-form-item>
            </el-form>
        </el-card>
        <footer-btns v-perms="['promote.energySettings/setConfig']">
            <el-button type="primary" @click="handleSubmit">保存</el-button>
        </footer-btns>
    </div>
</template>

<script lang="ts" setup name="promoteEnergySettings">
import { getEnergySettings, setEnergySettings } from '@/api/promote'
import feedback from '@/utils/feedback'

const formData = reactive<{
    scan_energy: number
    daily_scan_limit: number
    scan_slots: Array<{ name: string; start: string; end: string }>
}>({
    scan_energy: 10,
    daily_scan_limit: 0,
    scan_slots: []
})

const addSlot = () => {
    formData.scan_slots.push({ name: '', start: '', end: '' })
}
const removeSlot = (index: number) => {
    formData.scan_slots.splice(index, 1)
}

const getData = async () => {
    const data = await getEnergySettings()
    formData.scan_energy = Number(data.scan_energy) || 10
    formData.daily_scan_limit = Number(data.daily_scan_limit) || 0
    formData.scan_slots = Array.isArray(data.scan_slots) ? data.scan_slots : []
}

const handleSubmit = async () => {
    if (!formData.scan_slots.length) {
        feedback.msgError('请至少配置一个扫码时段')
        return
    }
    for (const s of formData.scan_slots) {
        if (!s.name || !s.start || !s.end) {
            feedback.msgError('时段名称与起止时间不能为空')
            return
        }
    }
    await setEnergySettings(formData)
    getData()
}

getData()
</script>
