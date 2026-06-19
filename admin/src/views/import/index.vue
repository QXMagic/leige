<template>
    <div class="import-container">
        <el-card class="!border-none" shadow="never">
            <el-steps :active="currentStep" finish-status="success" align-center>
                <el-step title="上传文件" description="上传Excel文件" />
                <el-step title="数据预览" description="预览并确认数据" />
                <el-step title="字段映射" description="配置字段映射规则" />
                <el-step title="数据验证" description="验证数据格式" />
                <el-step title="执行导入" description="执行数据导入" />
            </el-steps>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <div v-show="currentStep === 0">
                <el-form ref="uploadFormRef" :model="uploadForm" label-width="120px">
                    <el-form-item label="导入名称" prop="name">
                        <el-input v-model="uploadForm.name" placeholder="请输入导入名称" class="w-[400px]" />
                    </el-form-item>
                    <el-form-item label="目标数据表" prop="target_table">
                        <el-select v-model="uploadForm.target_table" placeholder="请选择目标表" class="w-[400px]" filterable @change="handleTableChange">
                            <el-option v-for="item in tableList" :key="item.name" :label="`${item.name}${item.comment ? ' - ' + item.comment : ''}`" :value="item.name" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="导入模式" prop="import_mode">
                        <el-radio-group v-model="uploadForm.import_mode">
                            <el-radio :label="1">仅新增</el-radio>
                            <el-radio :label="2">仅更新</el-radio>
                            <el-radio :label="3">新增或更新</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="选择文件">
                        <el-upload ref="uploadRef" class="import-upload" drag :auto-upload="false" :limit="1"
                            :accept="'.xlsx,.xls,.csv'" :file-list="fileList" :on-change="handleFileChange"
                            :on-remove="handleFileRemove">
                            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                            <div class="el-upload__text">拖拽文件到此处 或 <em>点击上传</em></div>
                            <template #tip>
                                <div class="el-upload__tip">支持 .xlsx、.xls、.csv 格式文件，大小不超过10MB</div>
                            </template>
                        </el-upload>
                    </el-form-item>
                </el-form>
                <div class="flex justify-center mt-4">
                    <el-button type="primary" :loading="uploading" :disabled="!canUpload" @click="handleUpload">
                        上传并解析
                    </el-button>
                </div>
            </div>

            <div v-show="currentStep === 1">
                <div class="mb-4 flex justify-between items-center">
                    <div>
                        <span class="text-gray-500">文件名：{{ batchInfo.file_name }}</span>
                        <span class="ml-4 text-gray-500">总行数：{{ batchInfo.total_rows }}</span>
                    </div>
                    <div>
                        <el-button @click="handleBack">上一步</el-button>
                        <el-button type="primary" :loading="parsing" :disabled="batchInfo.total_rows <= 0" @click="handleNext">
                            下一步
                        </el-button>
                    </div>
                </div>
                <el-table v-loading="loading" :data="previewData" size="large" max-height="500" border stripe>
                    <el-table-column v-for="header in previewHeaders" :key="header" :prop="header" :label="header" min-width="150" show-overflow-tooltip />
                </el-table>
                <div class="flex justify-end mt-4">
                    <pagination v-model="previewPager" @change="getPreview" />
                </div>
            </div>

            <div v-show="currentStep === 2">
                <div class="mb-4">
                    <el-alert title="字段映射说明" type="info" :closable="false" class="mb-4">
                        <template #default>
                            <p>请将Excel列与数据库字段进行映射。必填字段需要确保映射完成。</p>
                            <p>对于某些字段，您可以设置默认值。</p>
                        </template>
                    </el-alert>
                </div>
                <el-form ref="mappingFormRef" :model="mappingForm" label-width="150px">
                    <el-form-item label="唯一标识字段">
                        <el-select v-model="mappingForm.unique_field" placeholder="选择唯一标识字段（用于更新模式）" clearable class="w-[400px]">
                            <el-option v-for="field in availableFields" :key="field.name" :label="`${field.name}${field.comment ? ' - ' + field.comment : ''}`" :value="field.name" />
                        </el-select>
                    </el-form-item>
                    <el-divider />
                    <div v-for="(mapping, index) in mappingForm.mappings" :key="index" class="mapping-item mb-4 p-4 border border-gray-200 rounded">
                        <el-form-item label="Excel列名">
                            <el-select v-model="mapping.excel_field" placeholder="选择Excel列" clearable class="w-[200px]" @change="handleExcelFieldChange(index)">
                                <el-option v-for="header in previewHeaders" :key="header" :label="header" :value="header" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="对应数据库字段">
                            <el-select v-model="mapping.db_field" placeholder="选择数据库字段" clearable class="w-[200px]">
                                <el-option v-for="field in availableFields" :key="field.name" :label="`${field.name}${field.comment ? ' - ' + field.comment : ''}`" :value="field.name" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="默认值">
                            <el-input v-model="mapping.default_value" placeholder="设置默认值（可选）" class="w-[200px]" clearable />
                        </el-form-item>
                        <el-form-item label="验证规则">
                            <el-checkbox v-model="mapping.required">必填</el-checkbox>
                            <el-checkbox v-model="mapping.type_enabled">启用类型验证</el-checkbox>
                        </el-form-item>
                        <el-button type="danger" size="small" link @click="removeMapping(index)">删除映射</el-button>
                        <el-divider />
                    </div>
                    <el-button type="primary" link @click="addMapping">+ 添加字段映射</el-button>
                </el-form>
                <div class="flex justify-center mt-4">
                    <el-button @click="handleBack">上一步</el-button>
                    <el-button type="primary" :loading="validating" @click="handleValidate">验证数据</el-button>
                </div>
            </div>

            <div v-show="currentStep === 3">
                <div class="mb-4">
                    <el-alert v-if="validationResult && validationResult.total_errors > 0" type="warning" :closable="false">
                        <template #title>
                            验证完成，发现 {{ validationResult.total_errors }} 条错误数据
                        </template>
                    </el-alert>
                    <el-alert v-else-if="validationResult && validationResult.total_errors === 0" type="success" :closable="false">
                        <template #title>验证通过，所有数据均有效</template>
                    </el-alert>
                </div>

                <div class="flex gap-4 mb-4">
                    <el-card shadow="never" class="flex-1">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-500">{{ batchInfo.total_rows }}</div>
                            <div class="text-gray-500">总行数</div>
                        </div>
                    </el-card>
                    <el-card shadow="never" class="flex-1">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-500">{{ validationResult?.valid_rows || 0 }}</div>
                            <div class="text-gray-500">有效数据</div>
                        </div>
                    </el-card>
                    <el-card shadow="never" class="flex-1">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-red-500">{{ validationResult?.total_errors || 0 }}</div>
                            <div class="text-gray-500">错误数据</div>
                        </div>
                    </el-card>
                </div>

                <div v-if="validationResult && validationResult.total_errors > 0" class="mb-4">
                    <el-tabs v-model="errorTab">
                        <el-tab-pane label="错误详情" name="errors">
                            <el-table v-loading="loading" :data="errorData" size="large" max-height="400" border stripe>
                                <el-table-column label="行号" prop="row_num" width="80" />
                                <el-table-column label="错误信息">
                                    <template #default="{ row }">
                                        <div v-for="(error, idx) in row.errors" :key="idx">
                                            <el-tag type="danger" size="small">{{ error }}</el-tag>
                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column label="数据">
                                    <template #default="{ row }">
                                        <el-popover placement="top" :width="400" trigger="hover">
                                            <template #reference>
                                                <el-button link type="primary" size="small">查看数据</el-button>
                                            </template>
                                            <el-descriptions :column="2" border size="small">
                                                <el-descriptions-item v-for="(value, key) in row.data" :key="key" :label="String(key)">
                                                    {{ value }}
                                                </el-descriptions-item>
                                            </el-descriptions>
                                        </el-popover>
                                    </template>
                                </el-table-column>
                            </el-table>
                            <div class="flex justify-end mt-4">
                                <pagination v-model="errorPager" @change="getErrorReport" />
                            </div>
                        </el-tab-pane>
                        <el-tab-pane label="错误报告">
                            <el-button type="primary" @click="downloadErrorReport">下载错误报告</el-button>
                        </el-tab-pane>
                    </el-tabs>
                </div>

                <div class="flex justify-center mt-4">
                    <el-button @click="handleBack">上一步</el-button>
                    <el-button v-if="validationResult && validationResult.total_errors > 0" type="warning" @click="handleImportWithErrors">
                        跳过错误继续导入
                    </el-button>
                    <el-button v-else type="primary" :loading="importing" :disabled="!validationResult || validationResult.valid_rows <= 0" @click="handleDoImport">
                        开始导入
                    </el-button>
                </div>
            </div>

            <div v-show="currentStep === 4">
                <div class="text-center">
                    <el-progress type="circle" :percentage="progressPercent" :status="progressStatus" :width="200">
                        <template #default="{ percentage }">
                            <div class="text-2xl font-bold">{{ percentage }}%</div>
                            <div class="text-gray-500">导入进度</div>
                        </template>
                    </el-progress>
                </div>

                <div class="flex gap-4 justify-center mt-8">
                    <el-card shadow="never" class="w-[200px]">
                        <div class="text-center">
                            <div class="text-xl font-bold">{{ importResult.total_rows || 0 }}</div>
                            <div class="text-gray-500">总行数</div>
                        </div>
                    </el-card>
                    <el-card shadow="never" class="w-[200px]">
                        <div class="text-center">
                            <div class="text-xl font-bold text-green-500">{{ importResult.imported || 0 }}</div>
                            <div class="text-gray-500">已导入</div>
                        </div>
                    </el-card>
                    <el-card shadow="never" class="w-[200px]">
                        <div class="text-center">
                            <div class="text-xl font-bold text-red-500">{{ importResult.errors || 0 }}</div>
                            <div class="text-gray-500">失败</div>
                        </div>
                    </el-card>
                </div>

                <div v-if="importStatus === 'completed'" class="text-center mt-8">
                    <el-result icon="success" title="导入完成">
                        <template #sub-title>
                            <p>成功导入 {{ importResult.imported }} 条数据</p>
                            <p v-if="importResult.errors > 0">失败 {{ importResult.errors }} 条数据</p>
                        </template>
                        <template #extra>
                            <el-button type="primary" @click="handleReset">继续导入新文件</el-button>
                            <el-button @click="goToHistory">查看导入历史</el-button>
                        </template>
                    </el-result>
                </div>

                <div v-if="importStatus === 'failed'" class="text-center mt-8">
                    <el-result icon="error" title="导入失败">
                        <template #sub-title>
                            <p>{{ importError }}</p>
                        </template>
                        <template #extra>
                            <el-button type="primary" @click="handleRetry">重试</el-button>
                            <el-button @click="handleReset">重新开始</el-button>
                        </template>
                    </el-result>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import {
    importUpload,
    importParse,
    importPreview,
    importValidate,
    importDo,
    importProgress,
    importErrorReport,
    getImportTables,
    getTableFields
} from '@/api/import'

const currentStep = ref(0)
const progressPercent = ref(0)
const progressStatus = ref<'' | 'success' | 'warning' | 'exception'>('')
const importResult = reactive({
    total_rows: 0,
    imported: 0,
    errors: 0
})
const uploadFormRef = ref()
const mappingFormRef = ref()
const uploadRef = ref()
const fileList = ref<any[]>([])
const uploading = ref(false)
const parsing = ref(false)
const validating = ref(false)
const importing = ref(false)
const loading = ref(false)

const uploadForm = reactive({
    name: '',
    target_table: '',
    import_mode: 1
})

const batchInfo = reactive({
    id: 0,
    file_name: '',
    file_path: '',
    total_rows: 0,
    headers: [] as string[]
})

const previewHeaders = ref<string[]>([])
const previewData = ref<any[]>([])
const previewPager = reactive({
    page: 1,
    page_size: 20,
    total: 0
})

const mappingForm = reactive({
    unique_field: '',
    mappings: [] as Array<{
        excel_field: string
        db_field: string
        default_value: string
        required: boolean
        type_enabled: boolean
    }>
})

const tableList = ref<any[]>([])
const tableFields = ref<any[]>([])

const availableFields = computed(() => {
    return tableFields.value.filter(f => !['id', 'create_time', 'update_time', 'delete_time'].includes(f.name))
})

const validationResult = ref<any>(null)
const errorTab = ref('errors')
const errorData = ref<any[]>([])
const errorPager = reactive({
    page: 1,
    page_size: 50,
    total: 0
})

const importStatus = ref('')
const importError = ref('')

const canUpload = computed(() => {
    return uploadForm.target_table && fileList.value.length > 0
})

const handleFileChange = (file: any, files: any[]) => {
    fileList.value = files
}

const handleFileRemove = () => {
    fileList.value = []
}

const handleTableChange = async (tableName: string) => {
    if (tableName) {
        try {
            const res = await getTableFields({ table: tableName })
            tableFields.value = res.data || []
        } catch (error) {
            console.error('获取表字段失败', error)
        }
    }
}

const handleUpload = async () => {
    if (!uploadForm.target_table) {
        ElMessage.warning('请选择目标数据表')
        return
    }

    if (fileList.value.length === 0) {
        ElMessage.warning('请选择要上传的文件')
        return
    }

    uploading.value = true

    try {
        const file = fileList.value[0].raw
        const res: any = await importUpload({
            file,
            name: uploadForm.name || file.name,
            target_table: uploadForm.target_table,
            import_mode: uploadForm.import_mode
        })

        if (res.code === 1) {
            batchInfo.id = res.data.batch_id
            batchInfo.file_name = res.data.file_name
            batchInfo.file_path = res.data.file_path

            await parseFile()
        } else {
            ElMessage.error(res.msg || '上传失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '上传失败')
    } finally {
        uploading.value = false
    }
}

const parseFile = async () => {
    parsing.value = true

    try {
        const res: any = await importParse({ batch_id: batchInfo.id })

        if (res.code === 1) {
            batchInfo.total_rows = res.data.total_rows
            previewHeaders.value = Object.values(res.data.headers) as string[]

            await getPreview()
            currentStep.value = 1
        } else {
            ElMessage.error(res.msg || '解析失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '解析失败')
    } finally {
        parsing.value = false
    }
}

const getPreview = async () => {
    loading.value = true

    try {
        const res: any = await importPreview({
            batch_id: batchInfo.id,
            page: previewPager.page,
            page_size: previewPager.page_size
        })

        if (res.code === 1) {
            previewHeaders.value = Object.values(res.data.headers) as string[]
            previewData.value = res.data.lists
            previewPager.total = res.data.total
        }
    } catch (error) {
        console.error('获取预览数据失败', error)
    } finally {
        loading.value = false
    }
}

const handleNext = () => {
    currentStep.value = 2
    addMapping()
}

const handleBack = () => {
    if (currentStep.value > 0) {
        currentStep.value--
    }
}

const handleExcelFieldChange = (index: number) => {
    // Auto-match based on header name
    const excelField = mappingForm.mappings[index].excel_field
    if (excelField) {
        const matched = availableFields.value.find(f =>
            f.name.toLowerCase() === excelField.toLowerCase() ||
            (f.comment && f.comment.includes(excelField))
        )
        if (matched) {
            mappingForm.mappings[index].db_field = matched.name
        }
    }
}

const addMapping = () => {
    mappingForm.mappings.push({
        excel_field: '',
        db_field: '',
        default_value: '',
        required: false,
        type_enabled: false
    })
}

const removeMapping = (index: number) => {
    mappingForm.mappings.splice(index, 1)
}

const handleValidate = async () => {
    const validMappings = mappingForm.mappings.filter(m => m.excel_field && m.db_field)
    if (validMappings.length === 0) {
        ElMessage.warning('请至少添加一个有效的字段映射')
        return
    }

    validating.value = true
    loading.value = true

    try {
        const fieldMapping: Record<string, any> = {
            unique_field: mappingForm.unique_field
        }
        validMappings.forEach(m => {
            fieldMapping[m.excel_field] = m.db_field
        })

        const validationRules: Record<string, any> = {}
        validMappings.forEach(m => {
            if (m.required || m.type_enabled) {
                validationRules[m.db_field] = {}
                if (m.required) {
                    validationRules[m.db_field].required = true
                }
                if (m.type_enabled) {
                    const field = tableFields.value.find(f => f.name === m.db_field)
                    if (field) {
                        if (field.type.includes('int')) {
                            validationRules[m.db_field].type = 'integer'
                        } else if (field.type.includes('decimal') || field.type.includes('float')) {
                            validationRules[m.db_field].type = 'float'
                        }
                    }
                }
            }
        })

        const offset = 0
        const limit = 1000
        let totalErrors = 0
        let offset_errors = 0

        while (true) {
            const res: any = await importValidate({
                batch_id: batchInfo.id,
                offset,
                limit,
                validation_rules: JSON.stringify(validationRules),
                field_mapping: JSON.stringify(fieldMapping)
            })

            if (res.code === 1) {
                offset_errors += res.data.errors
                if (offset + limit >= batchInfo.total_rows) {
                    totalErrors = res.data.total_errors
                    validationResult.value = {
                        total_errors: totalErrors,
                        valid_rows: res.data.total_validated - totalErrors
                    }
                    break
                }
            } else {
                ElMessage.error(res.msg || '验证失败')
                break
            }
        }

        currentStep.value = 3

        if (totalErrors > 0) {
            await getErrorReport()
        }
    } catch (error: any) {
        ElMessage.error(error.message || '验证失败')
    } finally {
        validating.value = false
        loading.value = false
    }
}

const getErrorReport = async () => {
    loading.value = true

    try {
        const res: any = await importErrorReport({
            batch_id: batchInfo.id,
            page: errorPager.page,
            page_size: errorPager.page_size
        })

        if (res.code === 1) {
            errorData.value = res.data.lists
            errorPager.total = res.data.total
        }
    } catch (error) {
        console.error('获取错误报告失败', error)
    } finally {
        loading.value = false
    }
}

const downloadErrorReport = () => {
    const headers = previewHeaders.value.join(',')
    const rows = errorData.value.map((item: any) => {
        const data = Object.values(item.data).join(',')
        const errors = item.errors.join('; ')
        return `${item.row_num},"${data}","${errors}"`
    })

    const csv = `${headers}\n${rows.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `error_report_${batchInfo.id}.csv`
    link.click()
}

const handleImportWithErrors = () => {
    ElMessageBox.confirm('确认要跳过错误数据继续导入吗？', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        startImport()
    })
}

const handleDoImport = () => {
    ElMessageBox.confirm(`确认要导入 ${validationResult.value.valid_rows} 条有效数据吗？`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        startImport()
    })
}

const startImport = async () => {
    importing.value = true
    importStatus.value = 'importing'
    currentStep.value = 4
    progressPercent.value = 0

    try {
        let totalImported = 0
        let totalErrors = 0

        while (true) {
            const offset = totalImported
            const limit = 100

            const res: any = await importDo({
                batch_id: batchInfo.id,
                offset,
                limit
            })

            if (res.code === 1) {
                totalImported += res.data.imported
                totalErrors += res.data.errors
                importResult.imported = totalImported
                importResult.errors = totalErrors
                importResult.total_rows = batchInfo.total_rows

                const progress = Math.min(100, Math.round((totalImported / batchInfo.total_rows) * 100))
                progressPercent.value = progress

                if (res.data.completed) {
                    importStatus.value = 'completed'
                    break
                }
            } else {
                importStatus.value = 'failed'
                importError.value = res.msg || '导入失败'
                break
            }
        }
    } catch (error: any) {
        importStatus.value = 'failed'
        importError.value = error.message || '导入失败'
    } finally {
        importing.value = false
    }
}

const handleRetry = () => {
    importStatus.value = 'importing'
    startImport()
}

const handleReset = () => {
    currentStep.value = 0
    uploadForm.name = ''
    uploadForm.target_table = ''
    uploadForm.import_mode = 1
    fileList.value = []
    batchInfo.id = 0
    batchInfo.file_name = ''
    batchInfo.file_path = ''
    batchInfo.total_rows = 0
    previewHeaders.value = []
    previewData.value = []
    mappingForm.unique_field = ''
    mappingForm.mappings = []
    validationResult.value = null
    errorData.value = []
    progressPercent.value = 0
    importResult.total_rows = 0
    importResult.imported = 0
    importResult.errors = 0
    importStatus.value = ''
    importError.value = ''
}

const goToHistory = () => {
    // Navigate to import history page
}

onMounted(async () => {
    try {
        const res = await getImportTables()
        tableList.value = res.data || []
    } catch (error) {
        console.error('获取表列表失败', error)
    }
})
</script>

<style lang="scss" scoped>
.import-container {
    padding: 20px;
}

.import-upload {
    :deep(.el-upload-dragger) {
        padding: 40px;
    }
}

.mapping-item {
    background: #fafafa;
}
</style>