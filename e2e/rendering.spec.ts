import { expect, test } from '@playwright/test';

test.describe('Kanban Board - Basic Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render the Kanban board successfully', async ({ page }) => {
    // Check if the Board container is present
    const board = await page.locator('div[data-testid="board"]');
    await expect(board).toBeVisible();
  });

  test('should render all the lists properly', async ({ page }) => {
    // Check if the List elements are present
    const lists = await page.locator('div[data-testid^="list-"]');
    await expect(lists).toHaveCount(2);
  });

  test('list should have an "Add Task" button on desktop', async ({ page }) => {
    test.skip(!test.info().project.name.includes('Desktop'));

    const lists = page.locator('div[data-testid^="list-"]');
    const listCount = await lists.count();

    const addTaskButtons = page.locator(
      'button[data-testid="add-task-button"]',
    );
    const visibleAddTaskButtons = await addTaskButtons
      .filter({ has: page.locator(':visible') })
      .count();

    await expect(visibleAddTaskButtons).toBe(listCount);

    for (let i = 0; i < listCount; i++) {
      const addTaskButton = lists
        .nth(i)
        .locator('button[data-testid="add-task-button"]');
      await expect(addTaskButton).toBeVisible();
    }
  });

  test('list should have an "Add Task" button on mobile', async ({ page }) => {
    test.skip(!test.info().project.name.includes('Mobile'));

    const addTaskButtons = page.locator(
      'button[data-testid="add-task-button"]',
    );
    const visibleAddTaskButtons = await addTaskButtons
      .filter({ has: page.locator(':visible') })
      .count();

    await expect(visibleAddTaskButtons).toBe(1);
  });

  test('should display "Add List" button on desktop', async ({ page }) => {
    test.skip(!test.info().project.name.includes('Desktop'));

    // Wait for portal to load
    await page.waitForSelector('button[data-testid="add-list-button"]:visible');

    const addListButton = await page.locator(
      'button[data-testid="add-list-button"]:visible',
    );
    await expect(addListButton).toBeVisible();
    await expect(addListButton).toBeEnabled();
  });

  test('should display "Add List" button on mobile', async ({ page }) => {
    test.skip(!test.info().project.name.includes('Mobile'));

    // Click to open sidebar
    const sidebarButton = await page.locator(
      'button[aria-label="Open navigation"]',
    );
    await sidebarButton.click();

    // Wait for portal to load
    await page.waitForSelector('button[data-testid="add-list-button"]:visible');

    const addListButton = await page.locator(
      'button[data-testid="add-list-button"]:visible',
    );
    await expect(addListButton).toBeVisible();
    await expect(addListButton).toBeEnabled();
  });

  test('should create a new list when the "Add List" button is clicked', async ({
    page,
  }) => {
    const viewport = await page.viewportSize();
    const isMobile = viewport && viewport.width < 1024;

    const lists = await page.locator('div[data-testid^="list-"]');
    const initialCount = await lists.count();

    if (isMobile) {
      // Click to open sidebar
      const sidebarButton = await page.locator(
        'button[aria-label="Open navigation"]',
      );
      await sidebarButton.click();

      // Wait for portal to load
      await page.waitForSelector(
        'button[data-testid="add-list-button"]:visible',
      );
    } else {
      // Wait for portal to load
      await page.waitForSelector(
        'button[data-testid="add-list-button"]:visible',
      );
    }

    const addListButton = await page.locator(
      'button[data-testid="add-list-button"]:visible',
    );
    await addListButton.click();
    await expect(lists).toHaveCount(initialCount + 1);

    if (isMobile) {
      // Click to close sidebar
      const closeSidebarButton = await page.locator(
        'button[aria-label="Close navigation"]',
      );
      await closeSidebarButton.click();
    }
  });

  test('should allow the creation of multiple lists on desktop', async ({
    page,
  }) => {
    test.skip(!test.info().project.name.includes('Desktop'));

    const lists = await page.locator('div[data-testid^="list-"]');
    const initialCount = await lists.count();

    // Wait for portal to load
    await page.waitForSelector('button[data-testid="add-list-button"]:visible');

    const addListButton = await page.locator(
      'button[data-testid="add-list-button"]:visible',
    );
    await addListButton.click();
    await addListButton.click();
    await addListButton.click();

    const listIds = await page
      .locator('div[data-testid^="list-"]')
      .evaluateAll((elements) =>
        elements.map((el) => el.getAttribute('data-testid')),
      );
    const uniqueListIds = Array.from(new Set(listIds));
    expect(uniqueListIds.length).toEqual(initialCount + 3);

    await expect(lists).toHaveCount(initialCount + 3);
  });

  test('should allow the creation of multiple lists on mobile', async ({
    page,
  }) => {
    test.skip(!test.info().project.name.includes('Mobile'));

    const lists = await page.locator('div[data-testid^="list-"]');
    const initialCount = await lists.count();

    // Click to open sidebar
    const sidebarButton = await page.locator(
      'button[aria-label="Open navigation"]',
    );
    await sidebarButton.click();

    // Wait for portal to load
    await page.waitForSelector('button[data-testid="add-list-button"]:visible');

    const addListButton = await page.locator(
      'button[data-testid="add-list-button"]:visible',
    );
    await addListButton.click();
    await addListButton.click();
    await addListButton.click();

    const listIds = await page
      .locator('div[data-testid^="list-"]')
      .evaluateAll((elements) =>
        elements.map((el) => el.getAttribute('data-testid')),
      );
    const uniqueListIds = Array.from(new Set(listIds));
    expect(uniqueListIds.length).toEqual(initialCount + 3);

    await expect(lists).toHaveCount(initialCount + 3);
  });

  test('should create a new list with an editable name input on desktop', async ({
    page,
  }) => {
    test.skip(!test.info().project.name.includes('Desktop'));

    // Wait for portal to load
    await page.waitForSelector('button[data-testid="add-list-button"]:visible');

    const addListButton = await page.locator(
      'button[data-testid="add-list-button"]:visible',
    );
    await addListButton.click();

    const listNameInput = await page.locator('input[data-testid="list-input"]');
    await expect(listNameInput).toBeVisible();
    await listNameInput.fill('My New List');
    await listNameInput.press('Enter');

    const listName = await page.locator('h1[data-testid="list-name"]').last();
    await expect(listName).toHaveText('My New List');
  });

  // test('should create a new list without an editable name input on mobile', async ({
  //   page,
  // }) => {
  //   test.skip(!test.info().project.name.includes('Mobile'));

  //   // Click to open sidebar
  //   const sidebarButton = await page.locator(
  //     'button[aria-label="Open navigation"]',
  //   );
  //   await sidebarButton.click();

  //   // Wait for portal to load
  //   await page.waitForSelector('button[data-testid="add-list-button"]:visible');

  //   const addListButton = await page.locator(
  //     'button[data-testid="add-list-button"]:visible',
  //   );
  //   await addListButton.click();

  //   const listNameInput = await page.locator('input[data-testid="list-input"]');
  //   await expect(listNameInput).toBeVisible();
  //   await listNameInput.fill('My New List');
  //   await listNameInput.press('Enter');

  //   const listName = await page.locator('h1[data-testid="list-name"]').last();
  //   await expect(listName).toHaveText('New list');
  // });

  test('should create a new task when clicking "Add Task" in a list', async ({
    page,
  }) => {
    const tasks = await page.locator('li[data-testid^="task-"]');
    const initialCount = await tasks.count();

    const addTaskButton = await page
      .locator('button[data-testid="add-task-button"]')
      .first();
    await addTaskButton.click();

    await expect(tasks).toHaveCount(initialCount + 1);
  });

  test('should make the new task input editable', async ({ page }) => {
    const addTaskButton = await page
      .locator('button[data-testid="add-task-button"]')
      .first();
    await addTaskButton.click();

    const taskInput = await page.locator('input[data-testid="task-input"]');
    await expect(taskInput).toBeVisible();
    await taskInput.fill('Buy Milk');
    await taskInput.press('Enter');

    const taskText = await page.locator('div[data-testid="task-text"]').first();
    await expect(taskText).toHaveText('Buy Milk');
  });

  test('should save the task name when clicking outside the task input', async ({
    page,
  }) => {
    const addTaskButton = await page
      .locator('button[data-testid="add-task-button"]')
      .first();
    await addTaskButton.click();

    const taskInput = await page.locator('input[data-testid="task-input"]');
    await taskInput.fill('Walk the Dog');

    // Click outside the input
    await page.click('body');

    // Ensure the task title is now rendered as plain text
    const taskText = await page.locator('div[data-testid="task-text"]').first();
    await expect(taskText).toHaveText('Walk the Dog');
  });
});
