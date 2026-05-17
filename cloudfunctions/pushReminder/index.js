const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Calculate 5 minutes from now as the push target time
  const pushAt = new Date(today.getTime() + 5 * 60 * 1000)
  const targetTime = `${String(pushAt.getHours()).padStart(2, '0')}:${String(pushAt.getMinutes()).padStart(2, '0')}`
  const targetDateStr = `${pushAt.getFullYear()}-${String(pushAt.getMonth() + 1).padStart(2, '0')}-${String(pushAt.getDate()).padStart(2, '0')}`

  try {
    const res = await db.collection('reminders').get()
    const reminders = res.data

    const toPush = reminders.filter(r => {
      if (!r.time) return false
      // Match reminders whose time is exactly 5 minutes from now
      if (r.time !== targetTime) return false
      if (r.repeat === 'none') return r.date === targetDateStr
      const [by, bm, bd] = r.date.split('-').map(Number)
      const base = new Date(by, bm - 1, bd)
      const target = new Date(pushAt.getFullYear(), pushAt.getMonth(), pushAt.getDate())
      const diffDays = Math.floor((target - base) / (24 * 60 * 60 * 1000))
      if (diffDays < 0) return false
      if (r.repeat === 'daily') return true
      if (r.repeat === 'weekly') return diffDays % 7 === 0
      if (r.repeat === 'monthly') return parseInt(r.date.split('-')[2]) === pushAt.getDate()
      if (r.repeat === 'yearly') return r.date.slice(5) === targetDateStr.slice(5)
      return false
    })

    const results = []
    for (const reminder of toPush) {
      try {
        await cloud.openapi.subscribeMessage.send({
          touser: reminder._openid,
          templateId: 'RBiILR2OaTtTfo-nIvFohCLRVxahCgbgxM7lZuxQubE',
          data: {
            thing1: { value: reminder.title },
            time2: { value: reminder.time }
          },
          page: `pages/day/day?date=${targetDateStr}`
        })
        results.push({ id: reminder._id, status: 'sent' })
      } catch (err) {
        results.push({ id: reminder._id, status: 'failed', error: err.message })
      }
    }

    return {
      total: toPush.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    }
  } catch (err) {
    console.error('Push reminder failed:', err)
    return { error: err.message }
  }
}
