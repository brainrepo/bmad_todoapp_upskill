export interface TodoRow {
  id: number
  text: string
  completed: number
  created_at: string
}

export interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}
