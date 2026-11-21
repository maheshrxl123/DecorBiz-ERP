import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/test/core-logic.test.ts',
      'src/test/procurement.test.ts',
      'src/test/returns.test.ts',
    ],
  },
});
