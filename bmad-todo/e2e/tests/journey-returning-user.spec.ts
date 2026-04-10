import { test, expect } from '@playwright/test'
import {
  addTodo,
  deleteTodo,
  expectTodoActive,
  expectTodoCompleted,
  expectTodoVisible,
  getTodoItem,
  toggleTodo,
} from '../fixtures/test-helpers'

function uniqueText(base: string) {
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

async function createAndWaitForTodo(page: import('@playwright/test').Page, text: string) {
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/todos') && response.status() === 201,
  )
  await addTodo(page, text)
  await responsePromise
}

test.describe('Journey 2: Returning User — Task Lifecycle', () => {
  test.describe('Complete a task', () => {
    test('clicking a task marks it as completed with visual distinction', async ({ page }) => {
      await page.goto('/')
      const taskText = uniqueText('Complete me')
      await createAndWaitForTodo(page, taskText)

      // Verify active state first
      await expectTodoActive(page, taskText)

      // Click to complete
      const patchPromise = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'PATCH',
      )
      await toggleTodo(page, taskText)
      await patchPromise

      // Verify completed state — strikethrough + italic + dimmed color
      await expectTodoCompleted(page, taskText)
    })

    test('completed state persists after page refresh', async ({ page }) => {
      await page.goto('/')
      const taskText = uniqueText('Persist complete')
      await createAndWaitForTodo(page, taskText)

      const patchPromise = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'PATCH',
      )
      await toggleTodo(page, taskText)
      await patchPromise
      await expectTodoCompleted(page, taskText)

      // Refresh and verify persistence
      await page.reload()
      await expectTodoCompleted(page, taskText)
    })
  })

  test.describe('Uncomplete a task', () => {
    test('clicking a completed task reverts it to active visual state', async ({ page }) => {
      await page.goto('/')
      const taskText = uniqueText('Uncomplete me')
      await createAndWaitForTodo(page, taskText)

      // Complete first
      const patchPromise1 = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'PATCH',
      )
      await toggleTodo(page, taskText)
      await patchPromise1
      await expectTodoCompleted(page, taskText)

      // Uncomplete
      const patchPromise2 = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'PATCH',
      )
      await toggleTodo(page, taskText)
      await patchPromise2

      // Verify back to active state
      await expectTodoActive(page, taskText)
    })

    test('uncompleted (active) state persists after page refresh', async ({ page }) => {
      await page.goto('/')
      const taskText = uniqueText('Persist active')
      await createAndWaitForTodo(page, taskText)

      // Complete then uncomplete
      const patchPromise1 = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'PATCH',
      )
      await toggleTodo(page, taskText)
      await patchPromise1

      const patchPromise2 = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'PATCH',
      )
      await toggleTodo(page, taskText)
      await patchPromise2
      await expectTodoActive(page, taskText)

      // Refresh and verify persistence
      await page.reload()
      await expectTodoActive(page, taskText)
    })
  })

  test.describe('Delete a task', () => {
    test('clicking × removes the task from the list', async ({ page }) => {
      await page.goto('/')
      const taskText = uniqueText('Delete me')
      await createAndWaitForTodo(page, taskText)
      await expectTodoVisible(page, taskText)

      // Delete via × button
      const deletePromise = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'DELETE',
      )
      await deleteTodo(page, taskText)
      await deletePromise

      // Task should be gone
      await expect(page.getByText(taskText)).not.toBeVisible()
    })

    test('deleted task is permanently gone after page refresh', async ({ page }) => {
      await page.goto('/')
      const taskText = uniqueText('Gone forever')
      await createAndWaitForTodo(page, taskText)

      const deletePromise = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'DELETE',
      )
      await deleteTodo(page, taskText)
      await deletePromise
      await expect(page.getByText(taskText)).not.toBeVisible()

      // Refresh and confirm permanent deletion
      await page.reload()
      await expect(page.getByText(taskText)).not.toBeVisible()
    })

    test('deletion is immediate — no confirmation dialog', async ({ page }) => {
      await page.goto('/')
      const taskText = uniqueText('No confirm')
      await createAndWaitForTodo(page, taskText)

      // Click × and verify no dialog appears
      let dialogAppeared = false
      page.on('dialog', () => { dialogAppeared = true })

      const deletePromise = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'DELETE',
      )
      await deleteTodo(page, taskText)
      await deletePromise

      expect(dialogAppeared).toBe(false)
      await expect(page.getByText(taskText)).not.toBeVisible()
    })
  })

  test.describe('Full lifecycle flow', () => {
    test('create, complete, uncomplete, and delete in sequence', async ({ page }) => {
      await page.goto('/')
      const taskText = uniqueText('Full lifecycle')

      // Create
      await createAndWaitForTodo(page, taskText)
      await expectTodoActive(page, taskText)

      // Complete
      const patchPromise1 = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'PATCH',
      )
      await toggleTodo(page, taskText)
      await patchPromise1
      await expectTodoCompleted(page, taskText)

      // Uncomplete
      const patchPromise2 = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'PATCH',
      )
      await toggleTodo(page, taskText)
      await patchPromise2
      await expectTodoActive(page, taskText)

      // Delete
      const deletePromise = page.waitForResponse(
        (response) => response.url().includes('/api/todos/') && response.request().method() === 'DELETE',
      )
      await deleteTodo(page, taskText)
      await deletePromise
      await expect(page.getByText(taskText)).not.toBeVisible()

      // Verify gone after refresh
      await page.reload()
      await expect(page.getByText(taskText)).not.toBeVisible()
    })
  })
})
