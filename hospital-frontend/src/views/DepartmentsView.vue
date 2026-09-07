<template>
  <div class="page">
    <div class="page-header">
      <h2>科室管理</h2>
      <button @click="openAddModal" class="btn-primary">新增科室</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>科室编号</th>
          <th>科室名称</th>
          <th>科室介绍</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dept in departments" :key="dept.dept_id">
          <td>{{ dept.dept_id }}</td>
          <td>{{ dept.dept_name }}</td>
          <td>{{ dept.dept_intro || '-' }}</td>
          <td>
            <button @click="openEditModal(dept)" class="btn-edit">编辑</button>
            <button @click="handleDelete(dept.dept_id)" class="btn-danger">删除</button>
          </td>
        </tr>
        <tr v-if="!departments.length">
          <td colspan="4" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <!-- 弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ isEdit ? '编辑科室' : '新增科室' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>科室编号</label>
            <input v-model="form.dept_id" type="text" required :disabled="isEdit" />
          </div>
          <div class="form-group">
            <label>科室名称</label>
            <input v-model="form.dept_name" type="text" required />
          </div>
          <div class="form-group">
            <label>科室介绍</label>
            <textarea v-model="form.dept_intro" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">取消</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from '@/api'

const departments = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({ dept_id: '', dept_name: '', dept_intro: '' })

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    departments.value = await getDepartments()
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  form.value = { dept_id: '', dept_name: '', dept_intro: '' }
  isEdit.value = false
  showModal.value = true
}

function openEditModal(dept) {
  form.value = { ...dept }
  isEdit.value = true
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSubmit() {
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateDepartment(form.value.dept_id, form.value)
    } else {
      await addDepartment(form.value)
    }
    closeModal()
    await loadData()
  } catch (e) {
    alert(e.message)
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  if (!confirm('确定删除该科室？')) return
  try {
    await deleteDepartment(id)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}
</script>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; }
.loading { text-align: center; padding: 40px; color: #666; }
.data-table { width: 100%; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { background: #f5f5f5; font-weight: 600; }
.data-table tr:last-child td { border-bottom: none; }
.empty { text-align: center; color: #999; }
.btn-primary { background: #1976d2; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.7; }
.btn-edit { background: #ff9800; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px; }
.btn-danger { background: #f44336; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; }
.btn-cancel { background: #9e9e9e; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
.modal { background: #fff; padding: 24px; border-radius: 8px; width: 400px; }
.modal h3 { margin: 0 0 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
.form-group input, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
</style>
