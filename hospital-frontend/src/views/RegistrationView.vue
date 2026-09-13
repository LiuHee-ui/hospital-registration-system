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

    <!-- 步骤3：选择医生和时段 -->
    <div v-if="currentStep === 2" class="step-content">
      <h3>步骤3：选择医生与时段</h3>

      <!-- 医生卡片 -->
      <div class="doctors-list">
        <div
          v-for="doc in filteredSchedules"
          :key="doc.doctor_id"
          :class="['doctor-card', { selected: selectedDoctorId === doc.doctor_id, 'no-quota': doc.remain_quota <= 0 && !form.is_urgent }]"
          @click="selectDoctor(doc)"
        >
          <div class="doctor-name">{{ doc.doctor_name }}</div>
          <div class="doctor-info">{{ doc.title }} | {{ getDeptName(doc.dept_id) }}</div>
          <div class="doctor-specialty">{{ doc.specialty || '专长未填写' }}</div>
          <div :class="['doctor-quota', { 'quota-zero': doc.remain_quota <= 0 }]">
            剩余号源: {{ doc.remain_quota }}
            <span v-if="doc.remain_quota <= 0 && !form.is_urgent">（号满，可勾选加急）</span>
          </div>
          <div v-if="doc.slots && doc.slots.length" class="has-slots">
            含分时段预约
          </div>
        </div>
        <div v-if="!filteredSchedules.length" class="empty">该科室暂无医生</div>
      </div>

      <!-- 时段选择（选择医生后显示） -->
      <div v-if="selectedDoctorId && availableSlots.length" class="slot-section">
        <h4>选择就诊时段</h4>
        <div class="slot-grid">
          <div
            v-for="slot in availableSlots"
            :key="slot.slot_id"
            :class="['slot-card', { selected: selectedSlotId === slot.slot_id, 'slot-full': slot.remain_quota <= 0 }]"
            @click="selectSlot(slot)"
          >
            <div class="slot-label">{{ slot.slot_label }}</div>
            <div :class="['slot-remain', { low: slot.remain_quota <= 0 }]">
              {{ slot.remain_quota > 0 ? `剩余 ${slot.remain_quota}` : '已满' }}
            </div>
          </div>
        </div>
        <div v-if="!availableSlots.find(s => s.remain_quota > 0)" class="slot-warning">
          该医生所有时段均已约满，请勾选"加急"或选择其他医生
        </div>
      </div>

      <div v-if="selectedDoctorId && !availableSlots.length && !loadingSlots" class="slot-warning">
        该医生暂未设置分时段，请勾选"加急"模式继续挂号
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
          <span>{{ getDeptName(selectedSchedule?.dept_id) }}</span>
        </div>
        <div class="confirm-item">
          <label>医生：</label>
          <span>{{ selectedSchedule?.doctor_name }} ({{ selectedSchedule?.title }})</span>
        </div>
        <div v-if="selectedSlot" class="confirm-item">
          <label>就诊时段：</label>
          <span class="slot-badge">{{ selectedSlot.slot_label }}</span>
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

    <!-- 成功结果 / 打印凭证对话框 -->
    <el-dialog v-model="showTicket" title="挂号成功 - 打印凭证" width="450px" center destroy-on-close>
      <div id="print-receipt" class="ticket-box" style="padding: 20px; border: 1px dashed #475569; border-radius: 8px;">
        <h3 style="text-align: center; margin-bottom: 15px;">门诊挂号凭证</h3>
        <el-divider />
        <p><strong>挂号单号：</strong>#{{ successData?.reg_id }}</p>
        <p><strong>就诊患者：</strong>{{ successData?.patient_name }}</p>
        <p><strong>就诊科室：</strong>{{ successData?.dept_name }}</p>
        <p><strong>出诊医生：</strong>{{ successData?.doctor_name }}</p>
        <p v-if="successData?.slot_label"><strong>就诊时段：</strong>{{ successData.slot_label }}</p>
        <p><strong>就诊序号：</strong><span style="font-size: 20px; color: #409EFF; font-weight: bold;">{{ successData?.queueNum || '—'}} 号</span></p>
        <p><strong>挂号时间：</strong>{{ successData?.reg_time }}</p>
        <el-divider />
        <p style="text-align: center; font-size: 12px; color: #94a3b8;">请凭此单据前往对应诊室候诊</p>
      </div>
      <template #footer>
        <el-button v-print="'#print-receipt'" type="primary" icon="Printer">直接打印挂号单</el-button>
        <el-button @click="handleCloseTicket">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 继续挂号按钮 -->
    <div v-if="successData" class="success-card">
      <div class="success-icon">✓</div>
      <h3>挂号成功！</h3>
      <div class="success-info">
        <p>挂号编号：<strong>{{ successData.reg_id }}</strong></p>
        <p>患者：{{ successData.patient_name }}</p>
        <p>医生：{{ successData.doctor_name }}</p>
        <p>科室：{{ successData.dept_name }}</p>
        <p v-if="successData.slot_label">时段：{{ successData.slot_label }}</p>
        <p>时间：{{ successData.reg_time }}</p>
      </div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button @click="handlePrintTicket" class="btn-primary">打印凭证</button>
        <button @click="resetForm" class="btn-secondary">继续挂号</button>
      </div>
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
const filteredSchedules = ref([]) // 含时段数据的排班

const form = ref({ patient_name: '', gender: '男', birth_date: '', phone: '', id_card: '', medical_history: '', is_urgent: false })
const description = ref('')
const recommendResults = ref([])
const selectedDeptId = ref('')
const selectedDoctorId = ref('')
const selectedSlotId = ref('')
const recommending = ref(false)
const submitting = ref(false)
const loadingSlots = ref(false)
const successData = ref(null)
const showTicket = ref(false)
const currentPatientId = ref('')

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    const [dRes] = await Promise.all([
      request.get('/api/departments')
    ])
    departments.value = dRes.data || dRes
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

async function loadSchedulesWithSlots() {
  if (!selectedDeptId.value) return
  loadingSlots.value = true
  try {
    const res = await request.get('/api/schedules-with-slots')
    const all = Array.isArray(res) ? res : (res.data || [])
    const today = new Date().toISOString().slice(0, 10)
    filteredSchedules.value = all.filter(s => s.dept_id === selectedDeptId.value && s.sched_date === today)
  } catch (e) {
    console.error('加载排班失败', e)
  } finally {
    loadingSlots.value = false
  }
}

const selectedSchedule = computed(() =>
  filteredSchedules.value.find(s => s.doctor_id === selectedDoctorId.value)
)

const availableSlots = computed(() =>
  selectedSchedule.value?.slots || []
)

const selectedSlot = computed(() =>
  availableSlots.value.find(s => s.slot_id === selectedSlotId.value)
)

const canNext = computed(() => {
  if (currentStep.value === 0) return form.value.patient_name && form.value.gender && form.value.id_card
  if (currentStep.value === 2) {
    if (!selectedDoctorId.value) return false
    // 无时段医生允许加急通过，有时段必须选或加急
    if (availableSlots.value.length === 0) return form.value.is_urgent
    if (!selectedSlotId.value && !form.value.is_urgent) return false
    return true
  }
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
    alert('推荐失败：' + e.message)
  } finally {
    recommending.value = false
  }
}

function selectDept(r) {
  selectedDeptId.value = r.dept_id
  selectedDoctorId.value = ''
  selectedSlotId.value = ''
  loadSchedulesWithSlots()
}

function selectDoctor(doc) {
  if (doc.remain_quota <= 0 && !form.value.is_urgent) {
    alert('当前医生号源已满，请勾选"加急"后再试！')
    return
  }
  selectedDoctorId.value = doc.doctor_id
  selectedSlotId.value = ''
}

function selectSlot(slot) {
  if (slot.remain_quota <= 0) {
    alert('该时段已满，请选择其他时段！')
    return
  }
  selectedSlotId.value = slot.slot_id
}

async function nextStep() {
  if (currentStep.value === 1 && !selectedDeptId.value) {
    alert('请选择科室')
    return
  }
  if (currentStep.value === 0) {
    try {
      const res = await request.post('/api/patients/find-or-create', {
        patient_name: form.value.patient_name,
        gender: form.value.gender,
        birth_date: form.value.birth_date,
        phone: form.value.phone,
        id_card: form.value.id_card,
        medical_history: form.value.medical_history,
      })
      currentPatientId.value = res.patient.patient_id
    } catch (e) {
      alert('患者信息创建失败：' + (e.message || '请重试'))
      return
    }
  }
  currentStep.value++
}

function resetForm() {
  currentStep.value = 0
  successData.value = null
  showTicket.value = false
  form.value = { patient_name: '', gender: '男', birth_date: '', phone: '', id_card: '', medical_history: '', is_urgent: false }
  description.value = ''
  recommendResults.value = []
  selectedDeptId.value = ''
  selectedDoctorId.value = ''
  selectedSlotId.value = ''
  currentPatientId.value = ''
  filteredSchedules.value = []
}

function handlePrintTicket() {
  showTicket.value = true
}

function handleCloseTicket() {
  showTicket.value = false
}

async function submitRegistration() {
  submitting.value = true
  try {
    const today = new Date().toISOString().slice(0, 10)
    const reg_id = 'R' + today.replace(/-/g, '') + String(Math.floor(Math.random() * 10000)).padStart(4, '0')

    await request.post('/api/registrations', {
      reg_id,
      patient_id: currentPatientId.value,
      doctor_id: selectedDoctorId.value,
      is_urgent: form.value.is_urgent,
      slot_id: selectedSlotId.value || null,
    })

    successData.value = {
      reg_id,
      patient_name: form.value.patient_name,
      doctor_name: selectedSchedule.value?.doctor_name,
      dept_name: getDeptName(selectedSchedule.value?.dept_id),
      slot_label: selectedSlot.value?.slot_label || null,
      reg_time: new Date().toLocaleString(),
    }
    showTicket.value = true
  } catch (e) {
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
.doctor-quota { font-size: 13px; margin-top: 6px; color: #4caf50; font-weight: 500; }
.doctor-quota.quota-zero { color: #f44336; }
.doctor-card.no-quota { opacity: 0.7; cursor: not-allowed; }
.doctor-card.no-quota:hover { border-color: #ddd; }
.has-slots { font-size: 11px; color: #4caf50; margin-top: 4px; font-weight: 500; }
.recommend-results { margin-top: 20px; }
.recommend-results h4 { margin: 0 0 12px; }
.recommend-item { padding: 12px 16px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px; cursor: pointer; border: 2px solid transparent; }
.recommend-item:hover { border-color: #1976d2; }
.recommend-item.selected { border-color: #1976d2; background: #e3f2fd; }
.recommend-item strong { display: block; margin-bottom: 4px; }
.recommend-item span { font-size: 13px; color: #666; }
.match-score { display: block; margin-top: 4px; color: #ff9800; font-weight: 500; }

/* 时段选择 */
.slot-section { margin-top: 24px; border-top: 1px solid #eee; padding-top: 20px; }
.slot-section h4 { margin: 0 0 12px; color: #333; }
.slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
.slot-card { background: #f5f5f5; border: 2px solid transparent; border-radius: 6px; padding: 12px; cursor: pointer; text-align: center; transition: all 0.2s; }
.slot-card:hover { border-color: #1976d2; }
.slot-card.selected { border-color: #1976d2; background: #e3f2fd; }
.slot-card.slot-full { opacity: 0.5; cursor: not-allowed; }
.slot-label { font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #333; }
.slot-remain { font-size: 12px; color: #4caf50; }
.slot-remain.low { color: #f44336; }
.slot-warning { background: #fff3e0; border: 1px solid #ffb74d; border-radius: 6px; padding: 10px 16px; color: #e65100; font-size: 13px; margin-top: 16px; }

.confirm-card { max-width: 400px; }
.confirm-item { display: flex; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
.confirm-item label { font-weight: 500; color: #666; min-width: 70px; }
.slot-badge { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
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
.btn-secondary { background: #9e9e9e; color: #fff; border: none; padding: 10px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; }
.empty { grid-column: 1 / -1; text-align: center; color: #999; padding: 40px; }
</style>
