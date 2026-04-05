import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { expensesRepo } from '../db/repositories/index.js'

export function useExpenses(filters = {}) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      let data

      if (filters.projectId) {
        data = await expensesRepo.getByProject(filters.projectId)
      } else {
        data = await expensesRepo.getAll()
      }

      if (filters.category) {
        data = data.filter((e) => e.category === filters.category)
      }
      if (filters.startDate && filters.endDate) {
        data = data.filter((e) => e.date >= filters.startDate && e.date <= filters.endDate)
      }

      data.sort((a, b) => b.date.localeCompare(a.date))
      setExpenses(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.projectId, filters.category, filters.startDate, filters.endDate])

  useEffect(() => { load() }, [load])

  const totalByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  const addExpense = useCallback(async (formData) => {
    const expense = {
      id: uuidv4(),
      ...formData,
      amount: parseFloat(formData.amount),
      createdAt: Date.now(),
    }
    await expensesRepo.create(expense)
    await load()
    return expense
  }, [load])

  const deleteExpense = useCallback(async (id) => {
    await expensesRepo.delete(id)
    await load()
  }, [load])

  return { expenses, loading, error, totalByCategory, grandTotal, addExpense, deleteExpense, reload: load }
}
