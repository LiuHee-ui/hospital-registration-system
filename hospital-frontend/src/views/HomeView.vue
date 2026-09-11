<template>
  <div>
    <!-- 顶部核心指标统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card stat-blue">
        <div class="stat-label">今日挂号总量</div>
        <div class="stat-value">{{ stats.totalRegistrations }}</div>
      </div>
      <div class="stat-card stat-green">
        <div class="stat-label">已就诊患者</div>
        <div class="stat-value">{{ stats.completedCount }}</div>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-label">待诊患者数</div>
        <div class="stat-value">{{ stats.pendingCount }}</div>
      </div>
      <div class="stat-card stat-red">
        <div class="stat-label">加急/急诊号占比</div>
        <div class="stat-value">{{ stats.urgentRatio }}%</div>
      </div>
    </div>

    <!-- 挂号记录与就诊状态流转管理表 -->
    <div class="card">
      <h3>今日挂号动态与状态管理</h3>
      <table>
        <thead>
          <tr>
            <th>挂号单号</th>
            <th>患者</th>
            <th>挂号科室</th>
            <th>出诊医生</th>
            <th>通道类型</th>
            <th>就诊状态</th>
            <th>状态变更操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in records" :key="item.reg_id">
            <td>#{{ item.reg_id }}</td>
            <td>{{ item.patient_name || '未知' }}</td>
            <td>{{ item.dept_name || '未指定' }}</td>
            <td>{{ item.doctor_name || '未指定' }}</td>
            <td>
              <span :class="item.is_urgent ? 'urgent-text' : 'normal-text'">
                {{ item.is_urgent ? '加急号' : '普通号' }}
              </span>
            </td>
            <td>
              <span :class="getStatusClass(item.visit_status)">{{ item.visit_status || '未就诊' }}</span>
            </td>
            <td>
              <button
                v-if="item.visit_status !== '已就诊'"
                @click="updateStatus(item.reg_id, '已就诊')"
                class="btn-success"
              >
                完成就诊
              </button>
              <button
                v-if="item.visit_status !== '已取消'"
                @click="updateStatus(item.reg_id, '已取消')"
                class="btn-danger"
              >
                取消挂号
              </button>
            </td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="7" class="empty-cell">今日暂无挂号记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '../api/request'

const records = ref([])
const stats = reactive({
  totalRegistrations: 0,
  completedCount: 0,
  pendingCount: 0,
  urgentRatio: 0
})

// 加载控制台数据
const fetchDashboardData = async () => {
  try {
    const res = await request.get('/api/registrations')
    const list = res.data || res || []
    records.value = list

    // 计算统计指标
    const total = list.length
    const completed = list.filter(r => r.visit_status === '已就诊').length
    const pending = list.filter(r => r.visit_status === '未就诊' || !r.visit_status).length
    const urgent = list.filter(r => r.is_urgent).length

    stats.totalRegistrations = total
    stats.completedCount = completed
    stats.pendingCount = pending
    stats.urgentRatio = total > 0 ? ((urgent / total) * 100).toFixed(1) : 0
  } catch (err) {
    console.error('获取控制台数据失败', err)
  }
}

// 修改就诊状态
const updateStatus = async (regId, status) => {
  try {
    await request.patch(`/api/registrations/${regId}/status`, { visit_status: status })
    fetchDashboardData()
  } catch (err) {
    console.error('更新就诊状态失败', err)
    alert('更新状态失败：' + (err.message || '请重试'))
  }
}

const getStatusClass = (status) => {
  if (status === '已就诊') return 'status-done'
  if (status === '已取消') return 'status-cancelled'
  return 'status-pending'
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
}

.stat-blue { background: #e3f2fd; }
.stat-green { background: #e8f5e9; }
.stat-orange { background: #fff3e0; }
.stat-red { background: #ffebee; }

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 10px;
  color: #333;
}

.stat-blue .stat-label { color: #1976d2; }
.stat-green .stat-label { color: #388e3c; }
.stat-orange .stat-label { color: #f57c00; }
.stat-red .stat-label { color: #d32f2f; }

.card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card h3 {
  margin: 0 0 15px;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
  border-color: #eee;
}

thead tr {
  background: #f4f6f9;
}

th, td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 500;
  color: #666;
  font-size: 13px;
}

td {
  font-size: 14px;
  color: #333;
}

.urgent-text {
  color: #d32f2f;
  font-weight: bold;
}

.normal-text {
  color: #666;
}

.status-done {
  color: #28a745;
  font-weight: bold;
}

.status-cancelled {
  color: #6c757d;
  text-decoration: line-through;
}

.status-pending {
  color: #f57c00;
  font-weight: bold;
}

.btn-success {
  padding: 4px 8px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
}

.btn-danger {
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.empty-cell {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>
