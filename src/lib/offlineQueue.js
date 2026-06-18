import { supabase, supabaseConfigured } from './supabase'

const QUEUE_KEY = 'abp_offline_queue'

/** Read the offline queue from localStorage */
export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

/** Add a job record to the offline queue */
export function enqueue(record) {
  const queue = getQueue()
  const item = { ...record, _queuedAt: Date.now(), _id: crypto.randomUUID() }
  queue.push(item)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  return item
}

/** Remove a successfully-synced item from the queue */
function dequeue(id) {
  const queue = getQueue().filter(item => item._id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

/** Attempt to sync all queued jobs to Supabase */
export async function syncQueue(onProgress) {
  if (!supabaseConfigured || !supabase) return { synced: 0, failed: 0 }
  const queue = getQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of queue) {
    const { _id, _queuedAt, ...record } = item
    try {
      const { error } = await supabase.from('jobs').insert(record)
      if (error) throw error
      dequeue(_id)
      synced++
      onProgress?.({ synced, failed, total: queue.length })
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

/** Save a job — tries Supabase first, falls back to offline queue */
export async function saveJob(record) {
  if (!supabaseConfigured || !supabase || !navigator.onLine) {
    enqueue(record)
    return { saved: 'offline' }
  }

  try {
    const { error } = await supabase.from('jobs').insert(record)
    if (error) throw error
    return { saved: 'online' }
  } catch {
    enqueue(record)
    return { saved: 'offline' }
  }
}

/** Fetch all jobs from Supabase (if configured) merged with local queue */
export async function fetchAllJobs() {
  const localJobs = JSON.parse(localStorage.getItem('abp_local_jobs') || '[]')

  if (!supabaseConfigured || !supabase) {
    return localJobs
  }

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return [...(data || []), ...localJobs]
  } catch {
    return localJobs
  }
}

/** Save job to local storage list (for offline-only mode) */
export function saveJobLocally(record) {
  const jobs = JSON.parse(localStorage.getItem('abp_local_jobs') || '[]')
  const newJob = { ...record, id: crypto.randomUUID(), created_at: new Date().toISOString() }
  jobs.unshift(newJob)
  localStorage.setItem('abp_local_jobs', JSON.stringify(jobs.slice(0, 100)))
  return newJob
}

// Auto-sync when coming back online
window.addEventListener('online', () => {
  syncQueue()
})
