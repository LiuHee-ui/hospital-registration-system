<template>
  <div style="padding: 20px; text-align: center;">
    <h1>医院门诊挂号管理系统 - 首页/控制台</h1>
    <p v-if="userInfo.username">当前用户：{{ userInfo.username }}</p>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const userInfo = userStore.userInfo
</script>
