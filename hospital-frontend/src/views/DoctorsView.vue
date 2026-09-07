<template>
  <div class="page">
    <div class="page-header">
      <h2>医生管理</h2>
      <div class="header-actions">
        <select v-model="filterDept" @change="loadData" class="filter-select">
          <option value="">全部科室</option>
          <option v-for="d in departments" :key="d.dept_id" :value="d.dept_id">{{ d.dept_name }}</option>
        </select>
        <button @click="openAddModal" class="btn-primary">新增医生</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>医生编号</th>
          <th>姓名</th>
          <th>性别</th>
          <th>职称</th>
          <th>科室</th>
          <th>专长</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in doctors" :key="doc.doctor_id">
          <td>{{ doc.doctor_id }}</td>
          <td>{{ doc.doctor_name }}</td>
          <td>{{ doc.gender }}</td>
          <td>{{ doc.title }}</td>
          <td>{{ getDeptName(doc.dept_id) }}</td>
          <td>{{ doc.specialty || '-' }}</td>
          <td>
            <button @click="openEditModal(doc)" class="btn-edit">编辑</button>
            <button @click="handleDelete(doc.doctor_id)" class="btn-danger">删除</button>
          </td>
        </tr>
        <tr v-if="!doctors.length">
          <td colspan="7" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <!-- 弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ isEdit ? '编辑医生' : '新增医生' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>医生编号</label>
            <input v-model="form.doctor_id" type="text" required :disabled="isEdit" />
          </div>
          <div class="form-group">
            <label>姓名</label>
            <input v-model="form.doctor_name" type="text" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>性别</label>
              <select v-model="form.gender" required>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div class="form-group">
              <label>职称</label>
              <select v-model="form.title" required>
                <option value="主任医师">主任医师</option>
                <option value="副主任医师">副主任医师</option>
                <option value="主治医师">主治医师</option>
                <option value="住院医师">住院医师</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>科室</label>
            <select v-model="form.dept_id" required>
              <option v-for="d in departments" :key="d.dept_id" :value="d.dept_id">{{ d.dept_name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>专长</label>
            <input v-model="form.specialty" type="text" />
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
import { ref, onMounted, computed } from 'vue'
import { getDoctors, addDoctor, updateDoctor, deleteDoctor, getDepartments } from '@/api'

const doctors = ref([])
const departments = ref([])
const loading = ref(false)
const filterDept = ref('')
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({ doctor_id: '', doctor_name: '', gender: '男', title: '主治医师', dept_id: '', specialty: '' })

onMounted(async () => {
  departments.value = await getDepartments()
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    doctors.value = filterDept.value ? await getDoctors(filterDept.value) : await getDoctors()
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

function getDeptName(dept_id) {
  return departments.value.find(d => d.dept_id === dept_id)?.dept_name || dept_id
}

function openAddModal() {
  form.value = { doctor_id: '', doctor_name: '', gender: '男', title: '主治医师', dept_id: departments.value[0]?.dept_id || '', specialty: '' }
  isEdit.value = false
  showModal.value = true
}

function openEditModal(doc) {
  form.value = { ...doc }
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
      await updateDoctor(form.value.doctor_id, form.value)
    } else {
      await addDoctor(form.value)
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
  if (!confirm('确定删除该医生？')) return
  try {
    await deleteDoctor(id)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; }
.header-actions { display: flex; gap: 12px; }
.filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
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
.modal { background: #fff; padding: 24px; border-radius: 8px; width: 480px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin: 0 0 20px; }
.form-group { margin-bottom: 16px; }
.form-row { display: flex; gap: 16px; }
.form-row .form-group { flex: 1; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
</style>
