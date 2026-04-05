export function toISODate(date = new Date()) {
  return date.toISOString().split('T')[0]
}

export function formatDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function formatDateTime(isoDate, time) {
  return `${formatDate(isoDate)} ${time || ''}`
}

export function getWeekRange(referenceDate = new Date()) {
  const d = new Date(referenceDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(d.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: toISODate(monday),
    end: toISODate(sunday),
  }
}

export function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  return { start, end }
}

export function isDateInRange(date, start, end) {
  return date >= start && date <= end
}

export function addDays(isoDate, days) {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function diffDays(start, end) {
  const a = new Date(start)
  const b = new Date(end)
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

export function getWeeksInMonth(year, month) {
  const { start, end } = getMonthRange(year, month)
  const weeks = []
  let current = start
  while (current <= end) {
    const weekEnd = addDays(current, 6)
    weeks.push({
      start: current,
      end: weekEnd > end ? end : weekEnd,
    })
    current = addDays(current, 7)
  }
  return weeks
}

export function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(toISODate(d))
  }
  return days
}

export function parseTime(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function calcHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return { totalHours: 0, regularHours: 0, overtimeHours: 0 }
  const inMins = parseTime(checkIn)
  const outMins = parseTime(checkOut)
  const totalMins = outMins - inMins
  if (totalMins <= 0) return { totalHours: 0, regularHours: 0, overtimeHours: 0 }
  const totalHours = Math.round((totalMins / 60) * 100) / 100
  const regularHours = Math.min(totalHours, 8)
  const overtimeHours = Math.max(0, totalHours - 8)
  return { totalHours, regularHours, overtimeHours }
}

export function monthName(month) {
  const names = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return names[month - 1] || ''
}
