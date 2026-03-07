import { type Page, expect } from '@playwright/test'

export async function addTodo(page: Page, text: string) {
  const input = page.getByPlaceholder('What needs doing?')
  await input.fill(text)
  await input.press('Enter')
}

export async function getTodoCount(page: Page): Promise<number> {
  const todoList = page.getByRole('list', { name: 'Task list' })
  return todoList.getByRole('checkbox').count().catch(() => 0)
}

export async function getTodoTextAtPosition(page: Page, position: number): Promise<string> {
  const items = page.getByRole('list', { name: 'Task list' }).getByRole('checkbox')
  const item = items.nth(position)
  return item.textContent() as Promise<string>
}

export async function expectTodoVisible(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible()
}
