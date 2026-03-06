import { type Page } from '@playwright/test'

export async function addTodo(page: Page, text: string) {
  const input = page.getByPlaceholder('What needs doing?')
  await input.fill(text)
  await input.press('Enter')
}
