import { test, expect } from '@playwright/test'
import { assertNoCriticalOrSeriousViolations } from '../fixtures/a11y'
import {
  addTodo,
  createAndWaitForTodo,
  deleteTodo,
  expectTodoActive,
  expectTodoVisible,
  toggleTodo,
  uniqueText,
} from '../fixtures/test-helpers'

test.afterEach(async ({ page }) => {
  await assertNoCriticalOrSeriousViolations(page)
})

test.describe('Journey 3: Error & Edge Case Handling', () => {
  test('pressing Enter with empty input does not send POST /api/todos', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('What needs doing?')
    await expect(input).toBeFocused()

    let postCount = 0
    page.on('request', (req) => {
      if (req.url().includes('/api/todos') && req.method() === 'POST') postCount += 1
    })

    await input.press('Enter')

    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
    expect(postCount).toBe(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('whitespace-only input does not send POST /api/todos', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('What needs doing?')
    await expect(input).toBeFocused()

    let postCount = 0
    page.on('request', (req) => {
      if (req.url().includes('/api/todos') && req.method() === 'POST') postCount += 1
    })

    await input.fill('   ')
    await input.press('Enter')

    await expect(input).toHaveValue('   ')
    expect(postCount).toBe(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('failed create rolls back and shows error notification', async ({ page }) => {
    await page.route('**/api/todos', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Service unavailable' }),
        })
        return
      }
      await route.continue()
    })

    await page.goto('/')
    const taskText = uniqueText('Will fail create')
    await addTodo(page, taskText)

    await expect(page.getByRole('alert')).toContainText('Task not saved — try again')
    await expect(page.getByText(taskText)).not.toBeVisible()
  })

  test('failed toggle rolls back and shows error notification', async ({ page }) => {
    await page.goto('/')
    const taskText = uniqueText('Toggle fail')
    await createAndWaitForTodo(page, taskText)
    await expectTodoActive(page, taskText)

    await page.route('**/api/todos/**', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Service unavailable' }),
        })
        return
      }
      await route.continue()
    })

    await toggleTodo(page, taskText)

    await expect(page.getByRole('alert')).toContainText('Update failed — try again')
    await expectTodoActive(page, taskText)
  })

  test('failed delete rolls back and shows error notification', async ({ page }) => {
    await page.goto('/')
    const taskText = uniqueText('Delete fail')
    await createAndWaitForTodo(page, taskText)

    await page.route('**/api/todos/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Service unavailable' }),
        })
        return
      }
      await route.continue()
    })

    const deletePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/todos/') && response.request().method() === 'DELETE',
    )
    await deleteTodo(page, taskText)
    await deletePromise

    await expect(page.getByRole('alert')).toContainText('Couldn\'t delete — try again')
    await expectTodoVisible(page, taskText)
    await expectTodoActive(page, taskText)
  })

  test('empty state: add task hides empty copy and shows the task', async ({ page }) => {
    // Fulfill [] only for GETs that run before any POST /api/todos. A counter (e.g. first 2 GETs)
    // breaks when StrictMode issues one initial GET: the refetch after create would be GET #2 and
    // would still get [], wiping the new task from the list.
    let postToTodosSeen = false
    await page.route('**/api/todos', async (route) => {
      const req = route.request()
      const pathname = new URL(req.url()).pathname
      if (pathname === '/api/todos' && req.method() === 'POST') {
        postToTodosSeen = true
        await route.continue()
        return
      }
      if (pathname === '/api/todos' && req.method() === 'GET' && !postToTodosSeen) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Nothing here yet' })).toBeVisible()

    const taskText = uniqueText('From empty')
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/todos') && response.status() === 201,
    )
    await addTodo(page, taskText)
    await responsePromise

    await expect(page.getByText('Nothing here yet')).not.toBeVisible()
    await expectTodoVisible(page, taskText)
  })

  test('initial load shows Loading while GET /api/todos is delayed', async ({ page }) => {
    await page.route('**/api/todos', async (route) => {
      if (route.request().method() === 'GET' && new URL(route.request().url()).pathname === '/api/todos') {
        await new Promise((r) => setTimeout(r, 800))
      }
      await route.continue()
    })

    await page.goto('/')

    await expect(page.getByText('Loading...')).toBeVisible()
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 15000 })
  })
})
