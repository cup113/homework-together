import { suite, test, expect } from 'vitest';
import { cn } from '../src/lib/utils';
import { convertSnapPoints } from '../src/lib/snap-points';

suite('utils', () => {
    test('cn', () => {
        expect(cn('a', 'b', 'c')).toBe('a b c');
        expect(cn('text-white', 'bg-blue-500 hover:bg-blue-700')).toBe('text-white bg-blue-500 hover:bg-blue-700');
        expect(cn(undefined, 'text-white')).toBe('text-white');
    });

    const snapPointCases = [
        {
            tag: 'simple',
            cases: [
                { expr: '1', snaps: [100], total: 1 },
                { expr: '3', snaps: [100], total: 3 },
                { expr: '1+3+4+2', snaps: [10, 40, 80, 100], total: 10 },
                { expr: '2+2*4', snaps: [20, 60, 100], total: 10 },
                { expr: '8*8+6*6', snaps: [8, 16, 24, 32, 40, 48, 56, 64, 70, 76, 82, 88, 94, 100], total: 100 },
            ]
        },
        {
            tag: 'approximation / repeated',
            cases: [
                { expr: '6*1+193', snaps: [1, 2, 3, 100], total: 199 },
                { expr: '6*2', snaps: [17, 33, 50, 67, 83, 100], total: 12 },
                { expr: '1+2', snaps: [33, 100], total: 3 },
            ],
        },
        {
            tag: 'parsed expressions',
            cases: [
                { expr: '50,75,100', snaps: [50, 75, 100], total: 100 },
                { expr: '30,40,100', snaps: [30, 40, 100], total: 100 },
            ],
        },
        {
            tag: 'nested expressions',
            cases: [
                { expr: '2 * (1+4)', snaps: [10, 50, 60, 100], total: 10 },
                { expr: '2 *(8+2)', snaps: [40, 50, 90, 100], total: 20 },
                { expr: '(1+1+1)+2', snaps: [20, 40, 60, 100], total: 5 },
                { expr: '2*(1+3 *3)', snaps: [5, 20, 35, 50, 55, 70, 85, 100], total: 20 },
                { expr: '1+3*(3*  (2+3*1)+1)+1', snaps: [2, 6, 8, 10, 12, 16, 18, 20, 22, 26, 28, 30, 32, 34, 38, 40, 42, 44, 48, 50, 52, 54, 58, 60, 62, 64, 66, 70, 72, 74, 76, 80, 82, 84, 86, 90, 92, 94, 96, 98, 100], total: 50 },
            ]
        }
    ]

    snapPointCases.forEach(({ tag, cases }) => {
        cases.forEach(({ expr, snaps, total }, i) => {
            test(`snap point ${tag}-${i + 1}`, () => {
                const result = convertSnapPoints(expr);
                expect(result.snapPoints).equal(snaps.join(","));
                expect(result.total).equal(total);
            });
        });
    });

    const snapPointFailCases: { reason: string, cases: { expr: string, maxSteps?: number }[] }[] = [
        {
            reason: 'too many steps', cases: [
                { expr: '1+2+3+4+5+6+7+8+9+10', maxSteps: 5 },
                { expr: '2000*2', maxSteps: 1000 },
                { expr: '100*(100*1)', maxSteps: 5000 },
            ]
        },
        {
            reason: 'unmatched parentheses', cases: [
                { expr: '1+2+(3+4' },
                { expr: '1+2+(3+4))' },
                { expr: '1+2+3+4(' },
                { expr: '((1+2+3+4)' }
            ]
        },
        {
            reason: 'missing operand', cases: [
                { expr: '1+' },
                { expr: '5*(5*)' },
                { expr: '1*(*3+5)' },
                { expr: '*' }
            ]
        },
        {
            reason: 'invalid characters', cases: [
                { expr: '1-2' },
                { expr: '0x234' },
                { expr: '[123]' },
                { expr: '1/2' },
                { expr: '1.5+2' },
                { expr: '1e2' },
            ]
        }
    ]

    snapPointFailCases.forEach(({ reason, cases }) => {
        cases.forEach(({ expr, maxSteps }, i) => {
            test.fails(`snap point fail: ${reason}-${i + 1}`, () => {
                convertSnapPoints(expr, { maxSteps });
            });
        })
    })

    test('cache', () => {
        // TODO
    });
});
