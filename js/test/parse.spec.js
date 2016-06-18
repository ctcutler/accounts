const Decimal = require('decimal.js');
import { parseTransaction } from '../src/parse';

const input = `2014/02/14 foo bar
  Assets:Some Account:Sub-Account    $288.10558392
  Income:Some Other Account`;

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

  it('should parse the posting accounts correctly', function () {
    expect(
      parseTransaction(input).postings.map(v => v.name)
    ).toEqual(
      ['Assets:Some Account:Sub-Account', 'Income:Some Other Account']
    );
  });

  it('should parse the posting quantities correctly', function () {
    expect(
      parseTransaction(input).postings.map(v => v.quantity)
    ).toEqual(
      [Decimal(288.10558392), undefined]
    );
  });

});
