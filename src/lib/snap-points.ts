export type SnapPointsConfig = {
  maxSteps: number;
}

const defaultConfig: SnapPointsConfig = {
  maxSteps: 1000,
}

// class Frame {
//   public arr: number[];
//   public lastOp: '+' | '*' | null;

//   constructor() {
//     this.arr = [];
//     this.lastOp = null;
//   }
// }

export function convertSnapPoints(expression: string, config?: Partial<SnapPointsConfig>) {
  // Example: 3*2+1 -> [3, 3, 1]
  const { maxSteps }  = {...defaultConfig, ...config };

  if (expression.includes(',')) {
    return expression; // already in snap points format
  }

  const units = expression.replace(/\s/g, '').split('+');
  const points = new Array<number>();
  const add_point = (num: number) => {
    if (points.length >= maxSteps) {
      throw new Error(`Too many steps in expression: ${expression}`);
    }
    points.push(num);
  }

  for (const unit of units) {
    const splitted = unit.split('*');
    const num = parseInt(splitted[0]);
    if (splitted.length === 2) {
      const times = parseInt(splitted[1]);
      for (let i = 0; i < times; i++) {
        add_point(num);
      }
    } else {
      add_point(num);
    }
  }

  let acc = 0;
  const result = new Array<number>();
  const appeared = new Set<string>();
  points.forEach(point => {
    acc += point;
    result.push(acc);
  });

  return result.map(point => (point / acc * 100).toFixed(0)).filter(point => {
    if (appeared.has(point)) {
      return false;
    }
    appeared.add(point);
    return true;
  }).join(',');
}
