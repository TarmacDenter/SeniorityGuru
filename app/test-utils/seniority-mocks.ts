/**
 * Resets mock store state to defaults. Call in `beforeEach`.
 *
 * Note: Store creation and vi.mock calls must remain inline in each test file
 * because vitest statically hoists vi.hoisted/vi.mock at transform time —
 * they cannot reference imported functions.
 */
export function resetMockStores(
  mockStore: { entries: unknown[]; lists: unknown[] },
  mockUserStore: { employeeNumber: string | null; retirementAge: number },
) {
  mockStore.entries = []
  mockStore.lists = []
  mockUserStore.employeeNumber = null
  mockUserStore.retirementAge = 65
}
