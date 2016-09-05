import { splitN, flattenToPaths, parseDecimal, multDecimal, decimalIsZero,
  mapAssoc
  } from '../src/util';

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

describe('decimalIsZero', function () {
  it('should return true for 0', () => {
    expect(decimalIsZero(parseDecimal(0))).toBe(true);
  });
  it('should return false for 1', () => {
    expect(decimalIsZero(parseDecimal(1))).toBe(false);
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

describe('mapAssoc', () => {
  it('handles obj', () => {
    expect(
      mapAssoc(['a'], x => '#', {a: 1})
    ).toEqual(
      {a: '#'}
    );
  });

  it('handles list', () => {
    expect(
      mapAssoc([], x => '#', [1, 2])
    ).toEqual(
      ['#', '#']
    );
  });

  it('handles list, list', () => {
    expect(
      mapAssoc([], x => '#', [[1, 2], [1, 2]])
    ).toEqual(
      [['#', '#'], ['#', '#']]
    );
  });

  it('handles obj, obj', () => {
    expect(
      mapAssoc(['a', 'b'], x => '#', {a: {b: 1}})
    ).toEqual(
      {a: {b: '#'}}
    );
  });

  it('handles list, obj', () => {
    expect(
      mapAssoc(['a'], x => '#', [{a: 1}, {a: 2}])
    ).toEqual(
      [{a: '#'}, {a: '#'}]
    );
  });

  it('handles obj, list', () => {
    expect(
      mapAssoc(['a'], x => '#', {a: [1, 2]})
    ).toEqual(
      {a: ['#', '#']}
    );
  });

  it('handles obj, obj, list', () => {
    expect(
      mapAssoc(['a', 'b'], x => '#', {a: {b: [1, 2]}})
    ).toEqual(
      {a: {b: ['#', '#']}}
    );
  });

  it('handles list, list, obj', () => {
    expect(
      mapAssoc(['a'], x => '#', [[{a: 1}, {a: 2}], [{a: 1}, {a: 2}]])
    ).toEqual(
      [[{a: '#'}, {a: '#'}], [{a: '#'}, {a: '#'}]]
    );
  });

  it('handles list, obj, list', () => {
    expect(
      mapAssoc(['a'], x => '#', [{a: [1, 2]}, {a: [1, 2]}])
    ).toEqual(
      [{a: ['#', '#']}, {a: ['#', '#']}]
    );
  });

  it('handles obj, list, obj', () => {
    expect(
      mapAssoc(['a', 'b'], x => '#', {a: [{b: 1}, {b: 2}]})
    ).toEqual(
      {a: [{b: '#'}, {b: '#'}]}
    );
  });

  it('handles list, obj, obj', () => {
    expect(
      mapAssoc(['a', 'b'], x => '#', [{a: {b: 1}}, {a: {b: 1}}])
    ).toEqual(
      [{a: {b: '#'}}, {a: {b: '#'}}]
    );
  });

  it('handles obj, list, list', () => {
    expect(
      mapAssoc(['a'], x => '#', {a: [[1, 2], [1, 2]]})
    ).toEqual(
      {a: [['#', '#'], ['#', '#']]}
    );
  });
});
