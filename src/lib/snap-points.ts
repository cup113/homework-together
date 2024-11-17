import { compile } from 'moo';
import { invariant } from 'es-toolkit/util';

export type SnapPointsConfig = {
  maxSteps: number;
}

const defaultConfig: SnapPointsConfig = {
  maxSteps: 1000,
}

const lexer = compile({
  space: /[ \t]+/,
  number: /0|[1-9][0-9]*/,
  leftParen: '(',
  rightParen: ')',
  operator: ['+', '*'],
});

class Frame {
  public arr: number[];
  public lastOp: '+' | '*' | null;

  constructor() {
    this.arr = [];
    this.lastOp = null;
  }

  public pushNumbers(arr: number[], increase: (num: number) => void) {
    if (this.lastOp === null) {
      increase(arr.length);
      this.arr.push(...arr);
    } else {
      switch (this.lastOp) {
        case '+':
          increase(arr.length);
          this.arr.push(...arr);
          break;
        case '*': {
          const last = this.arr.pop();
          invariant(last !== undefined, 'Invalid expression: missing operand before * operator')
          increase(arr.length * last - 1);
          for (let i = 0; i < last; i++) {
            this.arr.push(...arr);
          }
          break;
        }
      }
      this.lastOp = null;
    }
  }

  public pushOperator(op: '+' | '*') {
    invariant(this.lastOp === null, 'Invalid expression: multiple operators in a row');
    this.lastOp = op;
  }

  public pop() {
    if (this.lastOp !== null) {
      throw new Error('Invalid expression: missing operand after operator ' + this.lastOp);
    }
    return this.arr;
  }
}

export function convertSnapPoints(expression: string, config?: Partial<SnapPointsConfig>) {
  const isParsed = expression.includes(',');
  if (isParsed) {
    return {
      snapPoints: expression,
      total: 100,
    }
  }

  const { maxSteps }  = {...defaultConfig, ...config };
  const frames = [new Frame()];
  let stepCount = 0;
  const increase = (num: number) => {
    stepCount += num;
    if (stepCount > maxSteps) {
      throw new Error(`Too many steps in expression: ${expression} (${stepCount} > ${maxSteps})`);
    }
  }

  lexer.reset(expression);
  while (true) {
    const token = lexer.next();
    if (token === undefined) {
      break;
    }
    switch (token.type) {
      case 'number':
        frames[frames.length - 1].pushNumbers([parseInt(token.text)], increase);
        break;
      case 'operator':
        frames[frames.length - 1].pushOperator(token.text as '+' | '*');
        break;
      case 'leftParen':
        frames.push(new Frame());
        break;
      case 'rightParen': {
        const lastFrame = frames.pop();
        invariant(lastFrame !== undefined, 'Fatal: frame stack must not be empty');
        invariant(frames.length > 0, 'Invalid expression: missing left parenthesis');
        frames[frames.length - 1].pushNumbers(lastFrame.pop(), increase);
        break;
      }
    }
  }

  invariant(frames.length === 1, 'Invalid expression: missing right parenthesis');
  const points = frames[0].pop();

  let acc = 0;
  const result = new Array<number>();
  const appeared = new Set<string>();
  points.forEach(point => {
    acc += point;
    result.push(acc);
  });

  const snapPoints = result.map(point => (point / acc * 100).toFixed(0)).filter(point => {
    if (appeared.has(point)) {
      return false;
    }
    appeared.add(point);
    return true;
  }).join(',');

  return {
    snapPoints,
    total: acc,
  }
}
