jest.setTimeout(10000);

// Mock console.error to keep test output clean
console.error = jest.fn();

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
