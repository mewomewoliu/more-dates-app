import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
})

// Attach Clerk token to every request
export function setAuthToken(getToken: () => Promise<string | null>) {
  api.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
}

// ---- Date Plans ----
export const fetchPlans = () => api.get('/plans').then((r) => r.data)
export const createPlan = (data: { title: string }) =>
  api.post('/plans/complete', data).then((r) => r.data)
export const fetchOngoingPlans = () =>
  api.get('/plans?timeframe=upcoming').then((r) => r.data)
export const fetchPastPlans = () =>
  api.get('/plans?timeframe=past').then((r) => r.data)
export const fetchPlan = (id: string) => api.get(`/plans/${id}`).then((r) => r.data)
export const createCompletePlan = (data: {
  title: string
  date?: string
  timeSlot?: string
  location?: { name: string; meta?: string; emoji: string; gradientFrom: string; gradientTo: string }
  activities?: Array<{ name: string; emoji: string; category: string }>
}) => api.post('/plans/complete', data).then((r) => r.data)
export const updatePlan = (
  id: string,
  data: {
    title?: string
    confirmedDate?: string | null
    confirmedTimeSlot?: string
    confirmedLocationId?: string
  }
) => api.patch(`/plans/${id}`, data).then((r) => r.data)
export const deletePlan = (id: string) => api.delete(`/plans/${id}`)
export const joinPlan = (token: string) =>
  api.get(`/plans/join/${token}`).then((r) => r.data)
export const fetchPlanPreview = (token: string) =>
  api.get(`/plans/preview/${token}`).then((r) => r.data)

// ---- User profile ----
export const fetchMe = () => api.get('/users/me').then((r) => r.data)
export const updateMe = (data: { name: string }) =>
  api.patch('/users/me', data).then((r) => r.data)

// ---- Locations ----
export const addLocation = (
  planId: string,
  data: { name: string; meta?: string; emoji?: string; gradientFrom?: string; gradientTo?: string }
) => api.post(`/plans/${planId}/locations`, data).then((r) => r.data)
export const deleteLocation = (planId: string, id: string) =>
  api.delete(`/plans/${planId}/locations/${id}`)

// ---- Activities ----
export const addActivity = (
  planId: string,
  data: { name: string; emoji?: string; category?: string }
) => api.post(`/plans/${planId}/activities`, data).then((r) => r.data)
export const toggleActivity = (planId: string, id: string, checked: boolean) =>
  api.patch(`/plans/${planId}/activities/${id}`, { checked }).then((r) => r.data)
export const deleteActivity = (planId: string, id: string) =>
  api.delete(`/plans/${planId}/activities/${id}`)

// ---- Votes ----
export const castVote = (
  planId: string,
  data: {
    whenOptionId?: string
    locationId?: string
    activityId?: string
    value: 'yes' | 'no' | 'heart'
  }
) => api.post(`/plans/${planId}/votes`, data).then((r) => r.data)

// ---- When options ----
export const addWhenOption = (
  planId: string,
  data: { date?: string; timeSlot?: string }
) => api.post(`/plans/${planId}/when-options`, data).then((r) => r.data)
