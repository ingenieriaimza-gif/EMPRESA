export function exportToCsv(filename, rows, columns) {
  const header = columns.map((c) => `"${c.label}"`).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = c.accessor ? c.accessor(row) : row[c.key] ?? ''
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(',')
    )
    .join('\n')
  const csv = `\uFEFF${header}\n${body}` // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
