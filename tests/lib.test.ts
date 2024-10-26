import { suite, test, expect } from 'vitest';
import { cn } from '../src/lib/utils';
import { convertSnapPoints } from '../src/lib/snap-points';

suite('utils', () => {
    test('cn', () => {
        expect(cn('a', 'b', 'c')).toBe('a b c');
        expect(cn('text-white', 'bg-blue-500 hover:bg-blue-700')).toBe('text-white bg-blue-500 hover:bg-blue-700');
        expect(cn(undefined, 'text-white')).toBe('text-white');
    });

    test('snap point', () => {
        const data = [
            { expr: '1', result: [100] },
            { expr: '3', result: [100] },
            { expr: '1+2', result: [33, 100] },
            { expr: '1+3+4+2', result: [10, 40, 80, 100] },
            { expr: '1*6', result: [17, 33, 50, 67, 83, 100] },
            { expr: '4*2+2', result: [40, 80, 100] },
            { expr: '8*8+6*6', result: [8, 16, 24, 32, 40, 48, 56, 64, 70, 76, 82, 88, 94, 100] },
            { expr: '50,75,100', result: [50, 75, 100] },
            { expr: '1*6+193', result: [1, 2, 3, 100] },
            // TODO nested expressions
        ]

        data.forEach(({ expr, result }) => {
            expect(convertSnapPoints(expr)).equal(result.join(","));
        });
    });

    test.fails('snap point with too many steps', () => {
        convertSnapPoints('2*2000', { maxSteps: 1000 });
        // TODO invalid expression error
    });
});
