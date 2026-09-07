<template>
  <div class="page">
    <div class="page-header">
      <h2>排班管理</h2>
      <div class="header-actions">
        <input v-model="filterDate" type="date" class="filter-input" />
        <button @click="loadData" class="btn-search">查询</button>
        <button @click="openAddModal" class="btn-primary">新增排班</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>医生</th>
          <th>科室</th>
          <th>日期</th>
          <th>总号源</th>
          <th>已用</th>
          <th>剩余</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in schedules" :key="s.sched_id">
          <td>{{ s.doctor_name }}</td>
          <td>{{ s.dept_name }}</td>
          <td>{{ s.sched_date }}</td>
          <td>{{ s.total_quota }}</td>
          <td>{{ s.used_quota }}</td>
          <td>{{ s.remain_quota }}</td>
          <td>
            <button @click="openEditModal(s)" class="btn-edit">编辑</button>
            <button @click="handleDelete(s.sched_id)" class="btn-danger">删除</button>
          </td>
        </tr>
        <tr v-if="!schedules.length">
          <td colspan="7" class="empty">暂无数据</td>
        </tr>
      </tbody>
    </table>

    <!-- 弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ isEdit ? '编辑排班' : '新增排班' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>医生</label>
            <select v-model="form.doctor_id" required>
              <option v-for="d in doctors" :key="d.doctor_id" :value="d.doctor_id">
                {{ d.doctor_name }} - {{ getDeptName(d.dept_id) }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>日期</label>
            <input v-model="form.sched_date" type="date" required />
          </div>
          <div class="form-group">
            <label>总号源数 (1-200)</label>
            <input v-model.number="form.total_quota" type="number" required min="1" max="200" />
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
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, getDoctors, getDepartments } from '@/api'

const schedules = ref([])
const doctors = ref([])
const departments = ref([])
const loading = ref(false)
const filterDate = ref('')
const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = ref({ doctor_id: '', sched_date: '', total_quota: 20 })

onMounted(async () => {
  doctors.value = await getDoctors()
  departments.value = await getDepartments()
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    schedules.value = filterDate.value ? await getSchedules(filterDate.value) : await getSchedules()
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
  form.value = { doctor_id: doctors.value[0]?.doctor_id || '', sched_date: new Date().toISOString().slice(0, 10), total_quota: 20 }
  isEdit.value = false
  showModal.value = true
}

function openEditModal(s) {
  form.value = { sched_id: s.sched_id, doctor_id: s.doctor_id, sched_date: s.sched_date, total_quota: s.total_quota }
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
      await updateSchedule(form.value.sched_id, { total_quota: form.value.total_quota })
    } else {
      await addSchedule(form.value)
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
  if (!confirm('确定删除该排班？')) return
  try {
    await deleteSchedule(id)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; }
.header-actions { display: flex; gap: 12px; }
.filter-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
.btn-search { background: #ff9800; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
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
.form-group input, .form-group select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
</style>
