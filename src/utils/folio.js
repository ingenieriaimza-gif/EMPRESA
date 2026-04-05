export function generateFolio(counter) {
  const year = new Date().getFullYear()
  const seq = String(counter).padStart(4, '0')
  return `OBR-${year}-${seq}`
}

export function generateEmployeeNumber(counter) {
  const seq = String(counter).padStart(4, '0')
  return `EMP-${seq}`
}
