import { expect, test } from '@playwright/test';

const PAGE_PATH = '/logistica';

test.describe('Logística – Panel principal', () => {
  test('muestra listado, filtra y actualiza detalle', async ({ page }) => {
    await page.goto(PAGE_PATH);

    const table = page.getByRole('table', { name: 'Listado de operaciones logísticas' });
    await expect(table).toBeVisible();

    await expect(page.locator('#summary-active')).not.toHaveText('0');
    await expect(page.locator('#summary-transfers')).not.toHaveText('0');

    await page.getByRole('button', { name: 'Filtros' }).click();
    await page.getByLabel('Búsqueda rápida').fill('FT-LOG-000347');
    await page.getByRole('button', { name: 'Aplicar filtros' }).click();

    const filteredRow = table.getByRole('row').filter({ hasText: '#FT-LOG-000347' });
    await expect(filteredRow).toHaveCount(1);

    await page.getByRole('button', { name: 'Filtros' }).click();
    await page.getByRole('button', { name: 'Limpiar filtros' }).click();
    await page.getByRole('button', { name: 'Cerrar filtros' }).click();

    const totalRows = await table.getByRole('row').count();
    expect(totalRows).toBeGreaterThan(2);

    const pendingRow = table.getByRole('row').filter({ hasText: 'Pendiente' }).first();
    await pendingRow.waitFor();
    await pendingRow.getByRole('button', { name: /Ver detalle/ }).click();

    await expect(page.locator('#operation-detail-panel')).toHaveClass(/open/);
    const detailId = await page.locator('#detail-operation-id').textContent();
    expect(detailId).toBeTruthy();

    const completeButton = page.getByRole('button', { name: 'Marcar como completada' });
    if (await completeButton.isEnabled()) {
      await completeButton.click();
      await expect(page.locator('#detail-status')).toContainText('Completado');
    }

    await page.getByRole('button', { name: 'Cerrar detalle' }).click();
    await expect(page.locator('#operation-detail-panel')).not.toHaveClass(/open/);
  });
});
