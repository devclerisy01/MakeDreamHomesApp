describe("Home", () => {
	it("loads the home screen with the search bar", () => {
		cy.visit("/");
		cy.get('input[placeholder="Describe what you need"]', {
			timeout: 10000,
		}).should("exist");
	});
});
