import { splitN } from '../src/util';

describe('splitN', function () {
  const input = 'foo bar baz',
    splitOn = ' ';

  it('should split on the split character', function () {
    expect(
      splitN(splitOn)(2)(input).join(splitOn)
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
