/**
 * Date utilities for calendar
 */

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getToday() {
  const d = new Date()
  return formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

function buildMonthGrid(year, month) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = getToday()
  const grid = []

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const date = formatDate(prevYear, prevMonth, day)
    grid.push({ date, day, isCurrentMonth: false, isToday: date === today })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = formatDate(year, month, d)
    grid.push({ date, day: d, isCurrentMonth: true, isToday: date === today })
  }

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const remaining = 42 - grid.length
  for (let d = 1; d <= remaining; d++) {
    const date = formatDate(nextYear, nextMonth, d)
    grid.push({ date, day: d, isCurrentMonth: false, isToday: date === today })
  }

  return grid
}

function getWeekDayLabels() {
  return ['日', '一', '二', '三', '四', '五', '六']
}

function getDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const dow = new Date(y, m - 1, d).getDay()
  return `${y}年${m}月${d}日 周${weekDays[dow]}`
}

function compareDate(d1, d2) {
  if (d1 < d2) return -1
  if (d1 > d2) return 1
  return 0
}

module.exports = {
  formatDate,
  getToday,
  getDaysInMonth,
  getFirstDayOfMonth,
  buildMonthGrid,
  getWeekDayLabels,
  getDateDisplay,
  compareDate
}
