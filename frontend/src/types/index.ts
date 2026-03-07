export interface User {
  id: string
  email: string
  name: string
}

export interface Vote {
  id: string
  userId: string
  user: User
  value: 'yes' | 'no' | 'heart'
}

export interface WhenOption {
  id: string
  planId: string
  date?: string
  timeSlot?: 'afternoon' | 'evening' | 'night' | 'allday'
  votes: Vote[]
  createdAt: string
}

export interface Location {
  id: string
  planId: string
  name: string
  meta?: string
  emoji: string
  gradientFrom: string
  gradientTo: string
  addedById: string
  addedBy: User
  votes: Vote[]
  createdAt: string
}

export interface Activity {
  id: string
  planId: string
  name: string
  emoji: string
  category: string
  addedById: string
  addedBy: User
  checked: boolean
  votes: Vote[]
  createdAt: string
}

export interface PlanMember {
  id: string
  planId: string
  userId: string
  user: User
  role: 'owner' | 'member'
  isOnline?: boolean
}

export interface FeedItem {
  id: string
  planId: string
  userId: string
  user: User
  action: string
  details?: Record<string, unknown>
  createdAt: string
}

export interface DatePlan {
  id: string
  title: string
  occasion?: string
  status: 'planning' | 'confirmed'
  confirmedDate?: string
  confirmedTimeSlot?: string
  confirmedLocationId?: string
  confirmedAt?: string
  shareToken: string
  createdById: string
  creator: User
  members: PlanMember[]
  whenOptions: WhenOption[]
  locations: Location[]
  activities: Activity[]
  feedItems: FeedItem[]
  createdAt: string
  updatedAt: string
}

export type TabName = 'overview' | 'when' | 'where' | 'what'
export type MainTab = 'ongoing' | 'create' | 'memories'

export interface PlanDraft {
  title: string
  date: Date | null
  timeSlot: string
  location: {
    name: string
    meta: string
    emoji: string
    gradientFrom: string
    gradientTo: string
  } | null
  activities: Array<{ name: string; emoji: string; category: string }>
}
