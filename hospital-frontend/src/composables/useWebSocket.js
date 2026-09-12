import { ref, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'

export function useWebSocket(url) {
  const data = ref(null)
  const isConnected = ref(false)
  let socket = null
  let reconnectTimer = null

  const connect = () => {
    socket = new WebSocket(url)

    socket.onopen = () => {
      isConnected.value = true
      console.log('WebSocket 实时叫号通道连通')
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        data.value = payload

        if (payload.type === 'CALL_PATIENT') {
          ElNotification({
            title: '就诊叫号提醒',
            message: `请患者 ${payload.patientName} 到 ${payload.departmentName} (${payload.doctorName} 诊室) 就诊！`,
            type: 'warning',
            duration: 6000
          })
        }
      } catch (e) {
        console.error('解析推送消息失败', e)
      }
    }

    socket.onclose = () => {
      isConnected.value = false
      reconnectTimer = setTimeout(() => {
        connect()
      }, 5000)
    }

    socket.onerror = () => {
      isConnected.value = false
    }
  }

  const send = (msg) => {
    if (socket && isConnected.value) {
      socket.send(typeof msg === 'object' ? JSON.stringify(msg) : msg)
    }
  }

  onUnmounted(() => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (socket) socket.close()
  })

  connect()

  return { data, isConnected, send }
}
