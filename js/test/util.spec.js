import { splitN, flattenToPaths } from '../src/util';

describe('flattenToPaths', function () {
  const input = {a: {b1: {c1: 42, c2: 43}}, x: {y: {z: 107}}, emp: {ty: {}}},
    output = {"a:b1:c1": 42, "a:b1:c2": 43, "x:y:z": 107, "emp:ty": {}};

  it('should flatten to paths', function () {
    expect(flattenToPaths(input)).toEqual(output);
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
