<template>
    <el-drawer v-model="visible" title="推广关系树" size="460px" @closed="handleClose">
        <div v-loading="loading">
            <div v-if="parent" class="mb-3 text-sm text-gray-500">
                上级：{{ parent.nickname }}（{{ parent.sn }}）
            </div>
            <div
                v-for="(row, index) in flatRows"
                :key="index"
                class="py-2 border-b border-gray-100"
                :style="{ paddingLeft: row.depth * 20 + 'px' }"
            >
                <el-tag v-if="row.branch_desc" size="small" class="mr-2">{{ row.branch_desc }}</el-tag>
                <span class="font-medium">{{ row.nickname || '虚位以待' }}</span>
                <span v-if="row.nickname" class="text-xs text-gray-400 ml-2">
                    Lv{{ row.level }} · 能量 {{ row.energy }} · 阴 {{ row.yin_energy }} / 阳 {{ row.yang_energy }}
                </span>
            </div>
        </div>
    </el-drawer>
</template>

<script lang="ts" setup>
import { promoteTree } from '@/api/promote'

const emit = defineEmits(['close'])
const visible = ref(false)
const loading = ref(false)
const parent = ref<any>(null)
const flatRows = ref<any[]>([])

const flatten = (node: any, depth: number, rows: any[]) => {
    if (!node) return
    rows.push({
        depth,
        branch_desc: depth === 0 ? '' : node.branch_desc,
        nickname: node.nickname,
        sn: node.sn,
        level: node.level,
        energy: node.energy,
        yin_energy: node.yin_energy,
        yang_energy: node.yang_energy
    })
    flatten(node.yin, depth + 1, rows)
    flatten(node.yang, depth + 1, rows)
}

const open = async (userId: number) => {
    visible.value = true
    loading.value = true
    parent.value = null
    flatRows.value = []
    try {
        const data = await promoteTree({ user_id: userId })
        parent.value = data.parent
        const rows: any[] = []
        flatten(data.node, 0, rows)
        flatRows.value = rows
    } finally {
        loading.value = false
    }
}

const handleClose = () => emit('close')

defineExpose({ open })
</script>
