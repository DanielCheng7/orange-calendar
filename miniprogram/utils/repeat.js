/**
 * Recurring reminder utilities
 */

function shouldAppearOnDate(baseDate, targetDate, repeat) {
  if (repeat === 'none') return baseDate === targetDate
  if (baseDate === targetDate) return true

  const [by, bm, bd] = baseDate.split('-').map(Number)
  const [ty, tm, td] = targetDate.split('-').map(Number)

  if (ty < by || (ty === by && tm < bm) || (ty === by && tm === bm && td < bd)) return false

  const base = new Date(by, bm - 1, bd)
  const target = new Date(ty, tm - 1, td)
  const diffDays = Math.floor((target - base) / (24 * 60 * 60 * 1000))

  switch (repeat) {
    case 'daily':
      return true
    case 'weekly':
      return diffDays % 7 === 0
    case 'monthly':
      return bd === td
    case 'yearly':
      return bm === tm && bd === td
    default:
      return false
  }
}

function getRemindersForDate(reminders, dateStr) {
  return reminders.filter(r => {
    if (!shouldAppearOnDate(r.date, dateStr, r.repeat || 'none')) return false
    return true
  })
}

module.exports = {
  shouldAppearOnDate,
  getRemindersForDate
}
