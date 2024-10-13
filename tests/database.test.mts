import { DBService } from '../services/database.mjs';
import { suite, test, expect } from 'vitest';
import { Sha256 } from '@aws-crypto/sha256-js';

class DBTest extends DBService {
    public sanitize(str: string): string {
        return super.sanitize(str);
    }
}

suite("Database", async () => {
    const db = new DBTest();

    test("Should create a new instance of DBService", async () => {
        expect(db).toBeInstanceOf(DBService);
    })

    test("Sanitize input", async () => {
        const DATA = [
            ["test", "test"],
            ["test'", "test'"],
            ["test\"", "test"],
            ["drop table users", "drop table users"],
            ["\" or 1=1 --", " or 1=1 --"],
            ["\\\"", ""],
        ]
        DATA.forEach(([input, expected]) => {
            expect(db.sanitize(input)).toBe(expected);
        });
    })

    const passwordHash = new Sha256('test');
    const password = [...passwordHash.digestSync()].map(byte => byte.toString(16).padStart(2, '0')).join('');

    const incorrectPasswordHash = new Sha256('incorrect');
    const incorrectPassword = [...incorrectPasswordHash.digestSync()].map(byte => byte.toString(16).padStart(2, '0')).join('');

    const user = await db.register('test', password);

    test("Should register a new user", async () => {
        expect(user.name).toBe('test');
    });

    test.fails('Should fail with existing username', async () => {
        await db.register('test', password);
    });
    test.fails('Should fail with incorrect password', async () => {
        await db.authWithPassword('test', incorrectPassword);
    });

    const authResult = await db.authWithPassword('test', password);

    test("Should authenticate with correct password", async () => {
        expect(authResult.token).toBeTypeOf('string');
    });

    const authResult2 = await db.authWithToken(authResult.token);

    test("Should authenticate with token", async () => {
        expect(authResult2.record.name).toBe('test');
        expect(authResult2.token).toBeTypeOf('string');
    });

    test("Should remove user", async () => {
        expect(await db.removeUser(user.id)).toBe(true);
    });
    test.fails('Should fail with incorrect token', async () => {
        await db.authWithToken(authResult2.token + "123");
    });
})
