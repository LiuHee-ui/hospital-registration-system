<template>
  <div class="page">
    <h2>门诊挂号</h2>

    <!-- 步骤指示器 -->
    <div class="steps">
      <div v-for="(step, i) in steps" :key="i" :class="['step', { active: currentStep === i, completed: currentStep > i }]">
        <div class="step-num">{{ currentStep > i ? '✓' : i + 1 }}</div>
        <div class="step-label">{{ step }}</div>
      </div>
    </div>

    <!-- 步骤1：患者登记 -->
    <div v-if="currentStep === 0" class="step-content">
      <h3>步骤1：患者登记</h3>
      <div class="form-card">
        <div class="form-group">
          <label>身份证号 *</label>
          <input v-model="form.id_card" type="text" placeholder="请输入身份证号" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>姓名 *</label>
            <input v-model="form.patient_name" type="text" placeholder="请输入姓名" required />
          </div>
          <div class="form-group">
            <label>性别 *</label>
            <select v-model="form.gender" required>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>出生日期</label>
          <input v-model="form.birth_date" type="date" />
        </div>
        <div class="form-group">
          <label>电话</label>
          <input v-model="form.phone" type="tel" placeholder="请输入电话" />
        </div>
        <div class="form-group">
          <label>病史描述</label>
          <textarea v-model="form.medical_history" rows="2" placeholder="请输入病史描述"></textarea>
        </div>
      </div>
    </div>

    <!-- 步骤2：智能分诊 -->
    <div v-if="currentStep === 1" class="step-content">
      <h3>步骤2：智能推荐科室</h3>
      <div class="form-card">
        <div class="form-group">
          <label>病情描述 *</label>
          <textarea v-model="description" rows="3" placeholder="请简要描述症状，如：发烧、咳嗽、胸闷"></textarea>
        </div>
        <button @click="recommendDeptApi" class="btn-primary" :disabled="!description || recommending">
          {{ recommending ? '推荐中...' : '智能推荐' }}
        </button>
        <div v-if="recommendResults.length" class="recommend-results">
          <h4>推荐科室（点击选择）</h4>
          <div
            v-for="r in recommendResults"
            :key="r.dept_id"
            :class="['recommend-item', { selected: selectedDeptId === r.dept_id }]"
            @click="selectDept(r)"
          >
            <strong>{{ r.dept_name }}</strong>
            <span v-if="r.dept_intro">{{ r.dept_intro }}</span>
            <span class="match-score">匹配度：{{ r.score }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤3：选择医生 -->
    <div v-if="currentStep === 2" class="step-content">
      <h3>步骤3：选择医生</h3>
      <div class="doctors-list">
        <div
          v-for="doc in filteredDoctors"
          :key="doc.doctor_id"
          :class="['doctor-card', { selected: selectedDoctorId === doc.doctor_id }]"
          @click="selectDoctor(doc)"
        >
          <div class="doctor-name">{{ doc.doctor_name }}</div>
          <div class="doctor-info">{{ doc.title }} | {{ getDeptName(doc.dept_id) }}</div>
          <div class="doctor-specialty">{{ doc.specialty || '专长未填写' }}</div>
        </div>
        <div v-if="!filteredDoctors.length" class="empty">该科室暂无医生</div>
      </div>
    </div>

    <!-- 步骤4：确认挂号 -->
    <div v-if="currentStep === 3" class="step-content">
      <h3>步骤4：确认挂号</h3>
      <div class="confirm-card">
        <div class="confirm-item">
          <label>患者：</label>
          <span>{{ form.patient_name }} ({{ form.gender }})</span>
        </div>
        <div class="confirm-item">
          <label>科室：</label>
          <span>{{ getDeptName(selectedDoctor?.dept_id) }}</span>
        </div>
        <div class="confirm-item">
          <label>医生：</label>
          <span>{{ selectedDoctor?.doctor_name }} ({{ selectedDoctor?.title }})</span>
        </div>
        <div class="confirm-item">
          <label>是否加急：</label>
          <label class="checkbox-label">
            <input v-model="form.is_urgent" type="checkbox" /> 加急
          </label>
        </div>
        <div class="confirm-actions">
          <button @click="submitRegistration" class="btn-success" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认挂号' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 成功结果 -->
    <div v-if="successData" class="success-card">
      <div class="success-icon">✓</div>
      <h3>挂号成功！</h3>
      <div class="success-info">
        <p>挂号编号：<strong>{{ successData.reg_id }}</strong></p>
        <p>患者：{{ successData.patient_name }}</p>
        <p>医生：{{ successData.doctor_name }}</p>
        <p>科室：{{ successData.dept_name }}</p>
        <p>时间：{{ successData.reg_time }}</p>
      </div>
      <button @click="resetForm" class="btn-primary">继续挂号</button>
    </div>

    <!-- 底部导航 -->
    <div v-if="!successData" class="step-nav">
      <button v-if="currentStep > 0" @click="currentStep--" class="btn-cancel">上一步</button>
      <button v-if="currentStep < 3 && currentStep !== 1" @click="nextStep" class="btn-primary" :disabled="!canNext">
        下一步
      </button>
      <button v-if="currentStep === 1" @click="nextStep" class="btn-primary" :disabled="!selectedDeptId">
        下一步
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../api/request'

const steps = ['患者登记', '智能分诊', '选择医生', '确认挂号']
const currentStep = ref(0)
const departments = ref([])
const doctors = ref([])
const schedules = ref([])

const form = ref({ patient_name: '', gender: '男', birth_date: '', phone: '', id_card: '', medical_history: '', is_urgent: false })
const description = ref('')
const recommendResults = ref([])
const selectedDeptId = ref('')
const selectedDoctorId = ref('')
const recommending = ref(false)
const submitting = ref(false)
const successData = ref(null)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    const [dRes, docRes, schRes] = await Promise.all([
      request.get('/api/departments'),
      request.get('/api/doctors'),
      request.get('/api/schedules')
    ])
    departments.value = dRes.data || dRes
    doctors.value = docRes.data || docRes
    schedules.value = schRes.data || schRes
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const filteredDoctors = computed(() => {
  if (!selectedDeptId.value) return []
  return doctors.value.filter(d => d.dept_id === selectedDeptId.value)
})

const selectedDoctor = computed(() => doctors.value.find(d => d.doctor_id === selectedDoctorId.value))

const canNext = computed(() => {
  if (currentStep.value === 0) return form.value.patient_name && form.value.gender && form.value.id_card
  if (currentStep.value === 2) return selectedDoctorId.value
  return true
})

function getDeptName(dept_id) {
  return departments.value.find(d => d.dept_id === dept_id)?.dept_name || dept_id
}

async function recommendDeptApi() {
  if (!description.value) return
  recommending.value = true
  try {
    const res = await request.post('/api/recommend-dept', { description: description.value })
    recommendResults.value = res.results || []
  } catch (e) {
    console.error('推荐失败', e)
    alert('推荐失败：' + e.message)
  } finally {
    recommending.value = false
  }
}

function selectDept(r) {
  selectedDeptId.value = r.dept_id
  selectedDoctorId.value = ''
}

function selectDoctor(doc) {
  selectedDoctorId.value = doc.doctor_id
}

function nextStep() {
  if (currentStep.value === 1 && !selectedDeptId.value) {
    alert('请选择科室')
    return
  }
  currentStep.value++
}

function resetForm() {
  currentStep.value = 0
  successData.value = null
  form.value = { patient_name: '', gender: '男', birth_date: '', phone: '', id_card: '', medical_history: '', is_urgent: false }
  description.value = ''
  recommendResults.value = []
  selectedDeptId.value = ''
  selectedDoctorId.value = ''
}

async function submitRegistration() {
  submitting.value = true
  try {
    const reg_id = 'R' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    await request.post('/api/registrations', {
      reg_id,
      patient_id: form.value.patient_id || 'TMP',
      doctor_id: selectedDoctorId.value,
      is_urgent: form.value.is_urgent,
    })
    successData.value = {
      reg_id,
      patient_name: form.value.patient_name,
      doctor_name: selectedDoctor.value?.doctor_name,
      dept_name: getDeptName(selectedDoctor.value?.dept_id),
      reg_time: new Date().toLocaleString(),
    }
  } catch (e) {
    console.error('挂号失败', e)
    alert('挂号失败：' + (e.message || '请重试'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; }
.page h2 { margin: 0 0 24px; }
.steps { display: flex; justify-content: center; margin-bottom: 32px; }
.step { display: flex; align-items: center; gap: 8px; color: #999; }
.step.active { color: #1976d2; }
.step.completed { color: #4caf50; }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: currentColor; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.step-label { font-size: 14px; }
.step:not(:last-child)::after { content: '→'; margin: 0 16px; color: #ccc; }
.step-content { background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
.step-content h3 { margin: 0 0 20px; color: #333; }
.form-card { max-width: 500px; }
.form-group { margin-bottom: 16px; }
.form-row { display: flex; gap: 16px; }
.form-row .form-group { flex: 1; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #333; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.doctors-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.doctor-card { background: #f9f9f9; padding: 16px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
.doctor-card:hover { border-color: #1976d2; }
.doctor-card.selected { border-color: #1976d2; background: #e3f2fd; }
.doctor-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.doctor-info { font-size: 13px; color: #666; margin-bottom: 4px; }
.doctor-specialty { font-size: 12px; color: #999; }
.recommend-results { margin-top: 20px; }
.recommend-results h4 { margin: 0 0 12px; }
.recommend-item { padding: 12px 16px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px; cursor: pointer; border: 2px solid transparent; }
.recommend-item:hover { border-color: #1976d2; }
.recommend-item.selected { border-color: #1976d2; background: #e3f2fd; }
.recommend-item strong { display: block; margin-bottom: 4px; }
.recommend-item span { font-size: 13px; color: #666; }
.match-score { display: block; margin-top: 4px; color: #ff9800; font-weight: 500; }
.confirm-card { max-width: 400px; }
.confirm-item { display: flex; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
.confirm-item label { font-weight: 500; color: #666; min-width: 70px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.confirm-actions { margin-top: 24px; }
.success-card { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
.success-icon { width: 60px; height: 60px; background: #4caf50; color: #fff; border-radius: 50%; font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.success-card h3 { color: #4caf50; margin: 0 0 20px; }
.success-info { text-align: left; max-width: 300px; margin: 0 auto 24px; }
.success-info p { margin: 8px 0; }
.step-nav { display: flex; justify-content: center; gap: 16px; margin-top: 24px; }
.btn-primary { background: #1976d2; color: #fff; border: none; padding: 10px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancel { background: #9e9e9e; color: #fff; border: none; padding: 10px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; }
.btn-success { background: #4caf50; color: #fff; border: none; padding: 12px 32px; border-radius: 4px; cursor: pointer; font-size: 16px; }
.empty { grid-column: 1 / -1; text-align: center; color: #999; padding: 40px; }
</style>
