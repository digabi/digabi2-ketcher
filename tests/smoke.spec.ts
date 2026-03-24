import { test, expect } from '@playwright/test'

test('ketcher editor loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Ketcher')
  await expect(page.getByTestId('ketcher-canvas')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('top-toolbar').nth(1)).toBeVisible()
})
