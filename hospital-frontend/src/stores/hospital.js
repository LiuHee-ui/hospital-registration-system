import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDepartments, getDoctors } from '@/api'

export const useHospitalStore = defineStore('hospital', () => {
  const departments = ref([])
  const doctors = ref([])
  const loading = ref(false)

  async function fetchDepartments() {
    loading.value = true
    try {
      departments.value = await getDepartments()
    } finally {
      loading.value = false
    }
  }

  async function fetchDoctors(dept_id) {
    loading.value = true
    try {
      doctors.value = await getDoctors(dept_id)
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    await Promise.all([fetchDepartments(), fetchDoctors()])
  }

  return { departments, doctors, loading, fetchDepartments, fetchDoctors, fetchAll }
})
