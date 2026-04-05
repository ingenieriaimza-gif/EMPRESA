import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { projectsRepo } from '../db/repositories/index.js'
import { generateFolio } from '../utils/folio.js'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await projectsRepo.getAll()
      data.sort((a, b) => b.createdAt - a.createdAt)
      setProjects(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createProject = useCallback(async (formData) => {
    const counter = await projectsRepo.getNextFolioNumber()
    const folio = generateFolio(counter)
    const project = {
      id: uuidv4(),
      folio,
      ...formData,
      createdAt: Date.now(),
    }
    await projectsRepo.create(project)
    await load()
    return project
  }, [load])

  const updateProject = useCallback(async (project) => {
    await projectsRepo.update(project)
    await load()
  }, [load])

  const deleteProject = useCallback(async (id) => {
    await projectsRepo.delete(id)
    await load()
  }, [load])

  return { projects, loading, error, createProject, updateProject, deleteProject, reload: load }
}
