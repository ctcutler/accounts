import { parseTransaction } from '../src/parse';

const input = `2014/02/14 foo bar
  Assets:TIAA CREF:403(b)    $288.10558392
  Income:Retirement Contributions`;

describe('parseTransaction', function () {

  it('should parse the date correctly', function () {
    expect(
      parseTransaction(input).date
    ).toEqual(
      new Date('2014/02/14')
    );
  });

  it('should parse the description correctly', function () {
    expect(
      parseTransaction(input).desc
    ).toEqual(
      'foo bar'
    );
  });

});
