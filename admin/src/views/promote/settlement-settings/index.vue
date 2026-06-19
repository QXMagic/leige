<template>
    <div class="promote-settlement-settings">
        <el-card shadow="never" class="!border-none">
            <div class="font-medium mb-7">结算周期设置</div>
            <el-form ref="formRef" :model="formData" label-width="120px">
                <el-form-item label="周期类型" prop="period_type">
                    <div>
                        <el-radio-group v-model="formData.period_type">
                            <el-radio value="month">按月</el-radio>
                            <el-radio value="week">按周</el-radio>
                            <el-radio value="day">按日</el-radio>
                        </el-radio-group>
                        <div class="form-tips">周期标识：按月 202606 / 按周 202624 / 按日 20260614</div>
                    </div>
                </el-form-item>
                <el-form-item v-if="formData.period_type !== 'day'" label="执行日" prop="exec_day">
                    <div>
                        <el-input-number
                            v-model="formData.exec_day"
                            :min="1"
                            :max="formData.period_type === 'week' ? 7 : 28"
                        />
                        <div class="form-tips">
                            {{
                                formData.period_type === 'week'
                                    ? '每周几执行（1=周一 … 7=周日）'
                                    : '每月几号执行（1-28）'
                            }}；定时任务请每日触发 settlement:run，由本配置决定是否到期。
                        </div>
                    </div>
                </el-form-item>
                <el-form-item v-else label="执行日">
                    <div class="form-tips">按日结算，每天执行。</div>
                </el-form-item>
            </el-form>
        </el-card>
        <footer-btns v-perms="['promote.settlementSettings/setConfig']">
            <el-button type="primary" @click="handleSubmit">保存</el-button>
        </footer-btns>
    </div>
</template>

<script lang="ts" setup name="promoteSettlementSettings">
import { getSettlementSettings, setSettlementSettings } from '@/api/promote'

const formData = reactive({
    period_type: 'month',
    exec_day: 1
})

const getData = async () => {
    const data = await getSettlementSettings()
    formData.period_type = data.period_type || 'month'
    formData.exec_day = Number(data.exec_day) || 1
}

const handleSubmit = async () => {
    await setSettlementSettings(formData)
    getData()
}

getData()
</script>
