import "@testing-library/jest-dom/extend-expect";

// jsdom lacks matchMedia, which Ionic reads on mount — provide a no-op shim.
window.matchMedia =
	window.matchMedia ||
	function () {
		return {
			matches: false,
			addListener: function () {},
			removeListener: function () {},
		};
	};
