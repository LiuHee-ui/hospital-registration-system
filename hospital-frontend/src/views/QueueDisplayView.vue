<template>
  <div class="queue-board" style="background: #0f172a; color: #fff; min-height: 100vh; padding: 30px;">
    <header style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 15px; margin-bottom: 30px;">
      <h1 style="font-size: 28px; color: #38bdf8;">门诊大厅实时叫号看板</h1>
      <div>
        <el-tag :type="isConnected ? 'success' : 'danger'">
          {{ isConnected ? '实时网络连接正常' : '网络已断开 (重连中...)' }}
        </el-tag>
      </div>
    </header>

    <el-row :gutter="20">
      <el-col :span="8" v-for="item in currentCalls" :key="item.deptId">
        <el-card shadow="always" body-style="background-color: #1e293b; color: #fff; text-align: center;">
          <h2 style="color: #94a3b8; font-size: 20px;">{{ item.deptName }}</h2>
          <div style="font-size: 42px; font-weight: bold; color: #f59e0b; margin: 20px 0;">
            {{ item.currentPatient || '等待叫号' }}
          </div>
          <div style="color: #cbd5e1;">出诊医生：{{ item.doctorName }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useWebSocket } from '../composables/useWebSocket'

const currentCalls = ref([
  { deptId: 1, deptName: '内科', currentPatient: '张三', doctorName: '李医生' },
  { deptId: 2, deptName: '外科', currentPatient: '李四', doctorName: '王医生' },
  { deptId: 3, deptName: '儿科', currentPatient: '王五', doctorName: '赵医生' }
])

const { data, isConnected } = useWebSocket('ws://localhost:8080/ws/queue')

watch(data, (newVal) => {
  if (newVal && newVal.type === 'QUEUE_UPDATE') {
    const target = currentCalls.value.find(c => c.deptId === newVal.deptId)
    if (target) {
      target.currentPatient = newVal.patientName
      target.doctorName = newVal.doctorName
    }
  }
})
</script>
