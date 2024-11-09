import { suite, test, expect } from 'vitest';

import { startServer } from '../app.mjs';

suite('main', () => {
    test('Run server', async () => {
        const server = startServer('production');
        expect(await new Promise((resolve) => {
            setTimeout(() => {
                server.close();
                resolve(true);
            }, 2000);
        })).toBe(true);
    });
});
