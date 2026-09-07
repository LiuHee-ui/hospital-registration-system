<template>
  <div class="page">
    <div class="page-header">
      <h2>患者管理</h2>
      <button @click="openAddModal" class="btn-primary">新增患者</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>患者编号</th>
          <th>姓名</th>
          <th>性别</th>
          <th>年龄</th>
          <th>电话</th>
          <th>身份证号</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in patients" :key="p.patient_id">
          <td>{{ p.patient_id }}</td>
          <td>{{ p.patient_name }}</td>
          <td>{{ p.gender }}</td>
          <td>{{ p.age }}</td>
          <td>{{ p.phone }}</td>
          <td>{{ p.id_card || '-' }}</td>
          <td>
            <button @click="openEditModal(p)" class="btn-edit">编辑</button>
            <button @click="handleDelete(p.patient_id)" class="btn-danger">删除</button>
          </td>
        </tr>
        <tr v-if="!patients.length">
          <td colspan="7" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <!-- 弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ isEdit ? '编辑患者' : '新增患者' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>患者编号</label>
            <input v-model="form.patient_id" type="text" required :disabled="isEdit" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>姓名</label>
              <input v-model="form.patient_name" type="text" required />
            </div>
            <div class="form-group">
              <label>性别</label>
              <select v-model="form.gender" required>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>年龄</label>
              <input v-model.number="form.age" type="number" required min="0" />
            </div>
            <div class="form-group">
              <label>电话</label>
              <input v-model="form.phone" type="tel" required />
            </div>
          </div>
          <div class="form-group">
            <label>身份证号</label>
            <input v-model="form.id_card" type="text" />
          </div>
          <div class="form-group">
            <label>病史描述</label>
            <textarea v-model="form.medical_history" rows="2"></textarea>
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
import { getPatients, addPatient, updatePatient, deletePatient } from '@/api'

const patients = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({ patient_id: '', patient_name: '', gender: '男', age: 0, phone: '', id_card: '', medical_history: '' })

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    patients.value = await getPatients()
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  form.value = { patient_id: '', patient_name: '', gender: '男', age: 0, phone: '', id_card: '', medical_history: '' }
  isEdit.value = false
  showModal.value = true
}

function openEditModal(p) {
  form.value = { ...p }
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
      await updatePatient(form.value.patient_id, form.value)
    } else {
      await addPatient(form.value)
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
  if (!confirm('确定删除该患者？')) return
  try {
    await deletePatient(id)
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
