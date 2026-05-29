import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Clean up after each test case
afterEach(() => {
  localStorage.clear();
});
