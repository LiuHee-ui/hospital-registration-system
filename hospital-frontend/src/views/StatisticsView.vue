<template>
  <div class="page">
    <h2>数据统计</h2>

    <div v-if="loading" class="loading">加载中...</div>
    <template v-else>
      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-num">{{ stats.total }}</div>
          <div class="stat-label">挂号总数</div>
        </div>
        <div class="stat-card pending">
          <div class="stat-num">{{ stats.pending }}</div>
          <div class="stat-label">待就诊</div>
        </div>
        <div class="stat-card visited">
          <div class="stat-num">{{ stats.visited }}</div>
          <div class="stat-label">已就诊</div>
        </div>
        <div class="stat-card cancelled">
          <div class="stat-num">{{ stats.cancelled }}</div>
          <div class="stat-label">已取消</div>
        </div>
      </div>

      <!-- 科室分布 -->
      <div class="section">
        <h3>科室挂号分布</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>科室编号</th>
              <th>科室名称</th>
              <th>挂号数量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in deptStats" :key="d.dept_id">
              <td>{{ d.dept_id }}</td>
              <td>{{ d.dept_name }}</td>
              <td>{{ d.reg_count }}</td>
            </tr>
            <tr v-if="!deptStats.length">
              <td colspan="3" class="empty">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStatisticsSummary, getStatisticsByDept } from '@/api'

const loading = ref(false)
const stats = ref({ total: 0, pending: 0, visited: 0, cancelled: 0 })
const deptStats = ref([])

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const [summary, byDept] = await Promise.all([
      getStatisticsSummary(),
      getStatisticsByDept(),
    ])
    stats.value = summary
    deptStats.value = byDept
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.page h2 { margin: 0 0 24px; }
.loading { text-align: center; padding: 40px; color: #666; }
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
.stat-card { background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
.stat-num { font-size: 36px; font-weight: bold; color: #1976d2; margin-bottom: 8px; }
.stat-label { font-size: 14px; color: #666; }
.stat-card.pending .stat-num { color: #ff9800; }
.stat-card.visited .stat-num { color: #4caf50; }
.stat-card.cancelled .stat-num { color: #9e9e9e; }
.section { background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 24px; }
.section h3 { margin: 0 0 16px; }
.data-table { width: 100%; }
.data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { background: #f5f5f5; font-weight: 600; }
.data-table tr:last-child td { border-bottom: none; }
.empty { text-align: center; color: #999; }
</style>
