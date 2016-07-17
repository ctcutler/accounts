import { splitN, flattenToPaths, parseDecimal, multDecimal } from '../src/util';

describe('flattenToPaths', function () {
  const input = {a: {b1: {c1: 42, c2: 43}}, x: {y: {z: 107}}, emp: {ty: {}}},
    output = {"a:b1:c1": 42, "a:b1:c2": 43, "x:y:z": 107, "emp:ty": {}};

  it('should flatten to paths', function () {
    expect(flattenToPaths(input)).toEqual(output);
  });
});

describe('parseDecimal', function () {
  it('should work with -1', () => {
    parseDecimal(-1);
  });

  it('should handle undefined safely', () => {
    expect(multDecimal(parseDecimal('23.45'), undefined)).toBe(undefined);
  });
});

describe('multDecimal', function () {
  it('should multiply two decimals without floating point innaccuracies', () => {
    expect(
      multDecimal(
        parseDecimal('23.45'), parseDecimal('22.33')
      ).equals(
        parseDecimal('523.6385')
      )
    ).toBe(true);
  });

  it('should handle undefined safely', () => {
    expect(multDecimal(parseDecimal('23.45'), undefined)).toBe(undefined);
  });
});

describe('splitN', function () {
  const input = 'foo bar baz',
    splitOn = / /;

  it('should split on the split character', function () {
    expect(
      splitN(splitOn)(2)(input).join(' ')
    ).toEqual(
      input
    );
  });

  it('should split no more than N times', function () {
    const maxSplits = 1
    expect(
      splitN(splitOn)(maxSplits)(input).length
    ).toEqual(
      maxSplits+1
    );
  });

  it('can split fewer than N times', function () {
    const maxSplits = 47
    expect(
      splitN(splitOn)(maxSplits)(input).length
    ).toBeLessThan(
      maxSplits
    );
  });
});
