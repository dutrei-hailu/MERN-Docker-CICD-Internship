describe('Web site availability', () => {

  const TEST_NAME = 'Employee1';

  beforeEach(() => {
    // Use desktop viewport so the sidebar is visible
    cy.viewport(1440, 900);

    // Mock all API calls before visiting the page
    cy.intercept('GET', '**/record', {
      statusCode: 200,
      body: [],
    }).as('getRecords');

    cy.intercept('GET', '**/record/*', {
      statusCode: 200,
      body: { id: '1', name: 'Test', position: 'Test', level: 'Senior' },
    }).as('getRecord');

    cy.intercept('POST', '**/record', {
      statusCode: 201,
      body: { id: '1', name: TEST_NAME, position: 'Position1', level: 'Intern' },
    }).as('createRecord');

    cy.intercept('DELETE', '**/record/*', {
      statusCode: 200,
      body: { success: true },
    }).as('deleteRecord');
  });

  it('Sanity - homepage loads', () => {
    cy.visit('/', { failOnStatusCode: false, timeout: 30000 });

    // Wait for the app to render and verify the dashboard heading
    cy.get('h1', { timeout: 15000 }).should('contain.text', 'Dashboard');
    cy.contains('Employee Management', { timeout: 15000 }).should('be.visible');
  });

  it('Test Adding Employee listings', () => {
    cy.visit('/create', { failOnStatusCode: false, timeout: 30000 });

    // Wait for page to load
    cy.get('input[name="name"]', { timeout: 15000 }).should('exist');

    cy.get('#name').clear().type(TEST_NAME);
    cy.get('#position').clear().type('Position1');
    cy.get('#level').select('Intern');

    cy.contains('button', 'Add Employee', { timeout: 10000 }).click();
    cy.wait('@createRecord');

    // The app shows a success message after saving the employee
    cy.contains('Employee added successfully.', { timeout: 10000 }).should('be.visible');
  });

});