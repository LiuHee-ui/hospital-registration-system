<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span style="font-weight: bold; font-size: 16px;">科室目录管理</span>
      </div>
    </template>

    <!-- 顶部新增表单 -->
    <el-form :inline="true" @submit.prevent="handleAdd" style="margin-bottom: 20px;">
      <el-form-item label="科室编号">
        <el-input v-model="addForm.dept_id" placeholder="请输入科室编号" clearable style="width: 160px;" />
      </el-form-item>
      <el-form-item label="科室名称">
        <el-input v-model="addForm.dept_name" placeholder="请输入科室名称" clearable style="width: 200px;" />
      </el-form-item>
      <el-form-item label="科室简介">
        <el-input v-model="addForm.dept_intro" placeholder="请输入科室简介" clearable style="width: 240px;" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :disabled="!addForm.dept_id || !addForm.dept_name">添加科室</el-button>
      </el-form-item>
    </el-form>

    <!-- 高级数据表格 -->
    <el-table :data="departments" stripe border style="width: 100%">
      <el-table-column prop="dept_id" label="科室编号" width="140" align="center" />
      <el-table-column prop="dept_name" label="科室名称" min-width="200" />
      <el-table-column prop="dept_intro" label="科室简介" min-width="300" show-overflow-tooltip />
      <el-table-column label="操作" width="180" align="center">
        <template #default="scope">
          <el-button type="primary" link @click="openEditModal(scope.row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(scope.row.dept_id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEditDialog" :title="isEdit ? '编辑科室' : '新增科室'" width="460px" @close="closeEditModal">
      <el-form :model="form" label-width="90px">
        <el-form-item label="科室编号">
          <el-input v-model="form.dept_id" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="科室名称">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item label="科室简介">
          <el-input v-model="form.dept_intro" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEditModal">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../api/request'

const departments = ref([])
const showEditDialog = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({ dept_id: '', dept_name: '', dept_intro: '' })
const addForm = reactive({ dept_id: '', dept_name: '', dept_intro: '' })

const fetchDepartments = async () => {
  try {
    const res = await request.get('/api/departments')
    departments.value = res.data || res
  } catch (err) {
    console.error('获取科室失败', err)
  }
}

const handleAdd = async () => {
  if (!addForm.dept_id || !addForm.dept_name) {
    ElMessage.warning('科室编号和名称为必填项')
    return
  }
  try {
    await request.post('/api/departments', { ...addForm })
    addForm.dept_id = ''
    addForm.dept_name = ''
    addForm.dept_intro = ''
    ElMessage.success('添加科室成功！')
    fetchDepartments()
  } catch (err) {
    console.error('添加科室失败', err)
  }
}

const openEditModal = (dept) => {
  form.value = { ...dept }
  isEdit.value = true
  showEditDialog.value = true
}

const closeEditModal = () => {
  showEditDialog.value = false
  isEdit.value = false
  form.value = { dept_id: '', dept_name: '', dept_intro: '' }
}

const handleSubmit = async () => {
  if (!form.value.dept_name) {
    ElMessage.warning('科室名称为必填项')
    return
  }
  submitting.value = true
  try {
    await request.put(`/api/departments/${form.value.dept_id}`, {
      dept_name: form.value.dept_name,
      dept_intro: form.value.dept_intro
    })
    ElMessage.success('更新科室成功！')
    closeEditModal()
    fetchDepartments()
  } catch (err) {
    console.error('更新科室失败', err)
  } finally {
    submitting.value = false
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除该科室吗？', '操作确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete(`/api/departments/${id}`)
      ElMessage.success('删除成功！')
      fetchDepartments()
    } catch (err) {
      console.error('删除科室失败', err)
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
