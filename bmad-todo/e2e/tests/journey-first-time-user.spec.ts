import { test, expect } from '@playwright/test'
import { addTodo, expectTodoVisible, uniqueText } from '../fixtures/test-helpers'

test.describe('Journey 1: First-Time User', () => {
  test('input is auto-focused on page load', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('What needs doing?')
    await expect(input).toBeFocused()
  })

  test('can create a task and see it in the list', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('What needs doing?')
    const taskText = uniqueText('Buy groceries')

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/todos') && response.status() === 201,
    )
    await addTodo(page, taskText)
    await responsePromise

    // Task appears in the list
    await expect(page.getByText(taskText)).toBeVisible()

    // Input is cleared and retains focus
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
  })

  test('task displays creation timestamp metadata', async ({ page }) => {
    await page.goto('/')
    const taskText = uniqueText('Timestamped')

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/todos') && response.status() === 201,
    )
    await addTodo(page, taskText)
    await responsePromise

    // Find the specific todo item containing our text
    const todoItem = page.getByRole('checkbox').filter({ hasText: taskText })
    await expect(todoItem).toBeVisible()
    // Timestamp metadata should be present (formatted date like "Mar 7, 2026")
    await expect(todoItem).toContainText(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
  })

  test('task persists after page refresh', async ({ page }) => {
    await page.goto('/')
    const taskText = uniqueText('Persistent')

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/todos') && response.status() === 201,
    )
    await addTodo(page, taskText)
    await responsePromise

    await page.reload()

    await expect(page.getByText(taskText)).toBeVisible()
  })
})

test.describe('Persistence: Multiple Tasks', () => {
  test('multiple tasks persist in creation order after reload', async ({ page }) => {
    await page.goto('/')
    const suffix = `${Date.now()}`
    const taskA = `OrderA-${suffix}`
    const taskB = `OrderB-${suffix}`
    const taskC = `OrderC-${suffix}`

    for (const text of [taskA, taskB, taskC]) {
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/todos') && response.status() === 201,
      )
      await addTodo(page, text)
      await responsePromise
    }

    // All visible
    await expectTodoVisible(page, taskA)
    await expectTodoVisible(page, taskB)
    await expectTodoVisible(page, taskC)

    // Verify order
    const items = page.getByRole('list', { name: 'Task list' }).getByRole('checkbox')
    const texts = await items.allTextContents()
    const aIdx = texts.findIndex((t) => t.includes(taskA))
    const bIdx = texts.findIndex((t) => t.includes(taskB))
    const cIdx = texts.findIndex((t) => t.includes(taskC))
    expect(aIdx).toBeLessThan(bIdx)
    expect(bIdx).toBeLessThan(cIdx)

    // Reload and verify persistence
    await page.reload()

    await expectTodoVisible(page, taskA)
    await expectTodoVisible(page, taskB)
    await expectTodoVisible(page, taskC)

    // Verify order is preserved after reload
    const reloadedTexts = await page
      .getByRole('list', { name: 'Task list' })
      .getByRole('checkbox')
      .allTextContents()
    const aIdx2 = reloadedTexts.findIndex((t) => t.includes(taskA))
    const bIdx2 = reloadedTexts.findIndex((t) => t.includes(taskB))
    const cIdx2 = reloadedTexts.findIndex((t) => t.includes(taskC))
    expect(aIdx2).toBeLessThan(bIdx2)
    expect(bIdx2).toBeLessThan(cIdx2)
  })

  test('tasks persist after closing and reopening page context', async ({ browser, baseURL }) => {
    const suffix = `${Date.now()}`
    const taskA = `CtxA-${suffix}`
    const taskB = `CtxB-${suffix}`
    const taskC = `CtxC-${suffix}`

    const context1 = await browser.newContext({ baseURL })
    const page1 = await context1.newPage()
    await page1.goto('/')

    for (const text of [taskA, taskB, taskC]) {
      const responsePromise = page1.waitForResponse(
        (response) => response.url().includes('/api/todos') && response.status() === 201,
      )
      await addTodo(page1, text)
      await responsePromise
    }

    await context1.close()

    // Open fresh context (simulates closing and reopening browser tab)
    const context2 = await browser.newContext({ baseURL })
    const page2 = await context2.newPage()
    await page2.goto('/')

    await expectTodoVisible(page2, taskA)
    await expectTodoVisible(page2, taskB)
    await expectTodoVisible(page2, taskC)

    await context2.close()
  })
})

test.describe('Input Validation', () => {
  test('pressing Enter with empty input does nothing', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('What needs doing?')
    await expect(input).toBeFocused()

    let postFired = false
    page.on('request', (req) => {
      if (req.url().includes('/api/todos') && req.method() === 'POST') postFired = true
    })

    await input.press('Enter')

    // Input should still be empty and focused — no change occurred
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
    expect(postFired).toBe(false)
  })

  test('pressing Enter with whitespace-only input does nothing', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('What needs doing?')
    await expect(input).toBeFocused()

    let postFired = false
    page.on('request', (req) => {
      if (req.url().includes('/api/todos') && req.method() === 'POST') postFired = true
    })

    await input.fill('   ')
    await input.press('Enter')

    // Input should still contain whitespace — not submitted
    await expect(input).toHaveValue('   ')
    expect(postFired).toBe(false)
  })

  test('text is trimmed — leading/trailing spaces removed', async ({ page }) => {
    await page.goto('/')
    const trimmedText = uniqueText('Trimmed')

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/todos') && response.status() === 201,
    )
    await addTodo(page, `  ${trimmedText}  `)
    await responsePromise

    // The task should appear with trimmed text
    await expect(page.getByText(trimmedText)).toBeVisible()
  })
})
