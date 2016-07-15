const R = require('ramda');
import { postings, transaction, ledger } from '../src/parse';
const transactionInput = `2014/02/14 foo bar
  Assets:Some Account:Sub-Account    $288.10558392
  Assets:Some Account:Other Sub-Account   123.45 ABCD
  Assets:Some Account:Another Sub-Account   -0.0070 VEXAX @ $62.2100
  Income:Some Other Account`;

const transactionsInput = `account Liabilities:Credit Cards:Foo Card
account Liabilities:Credit Cards:Foo Card 2

commodity $

P 2016/04/24 00:00:00 MWTRX $10.82
P 2016/04/24 00:00:00 QCEQIX $166.4876

; /HOMEDEPOT/ Expenses:Hardware Stores
; /SWEETGREEN/ Expenses:Restaurants

2014/02/14 foo bar
  Assets:Some Account:Sub-Account    $288.10558392
  Income:Some Other Account

2014/02/14 foo bar
  Assets:Some Account:Sub-Account    $288.10558392
  Income:Some Other Account

2014/02/14 foo bar
  Assets:Some Account:Sub-Account    $288.10558392
  Income:Some Other Account`;

describe('postings', function () {
  it('should parse amount-less postings', function () {
    const input = `2014/01/02 Initial Balances
  Assets:80 Madbury Road    $107000.00
  Equity:Initial Balances`;
    expect(postings(input)[1].amount).toEqual({});
  });
});

describe('ledger', function () {
  it('should parse the right number of transactions', function () {
    expect(
      ledger(transactionsInput).transactions.length
    ).toEqual(3);
  });
});

describe('transaction', function () {

  it('should parse the date correctly', function () {
    expect(
      transaction(transactionInput).date
    ).toEqual(
      new Date('2014/02/14')
    );
  });

  it('should parse the description correctly', function () {
    expect(
      transaction(transactionInput).desc
    ).toEqual(
      'foo bar'
    );
  });

  it('should parse the posting accounts correctly', function () {
    expect(
      transaction(transactionInput).postings.map(v => v.account)
    ).toEqual(
      [
        'Assets:Some Account:Sub-Account',
        'Assets:Some Account:Other Sub-Account',
        'Assets:Some Account:Another Sub-Account',
        'Income:Some Other Account'
      ]
    );
  });

  it('should parse the posting quantities correctly', function () {
    const trans = transaction(transactionInput);
    const [q1, q2, q3, q4] = trans.postings.map(R.path(['amount', 'quantity']));
    expect(q1.equals(288.10558392)).toBe(true);
    expect(q2.equals(123.45)).toBe(true);
    expect(q3.equals(-0.0070)).toBe(true);
    expect(q4).toBe(undefined);
  });

  it('should parse the posting commodities correctly', function () {
    expect(
      transaction(transactionInput).postings.map(R.path(['amount', 'commodity']))
    ).toEqual(
      ['$', 'ABCD', 'VEXAX', undefined]
    );
  });

  it('should parse the posting unit prices correctly', function () {
    const trans = transaction(transactionInput);
    const [up1, up2, up3, up4] = trans.postings.map(R.path(['amount', 'unitPrice']));
    expect(up1).toBe(undefined);
    expect(up2).toBe(undefined);
    expect(up3.commodity).toBe('$');
    expect(up3.quantity.equals(62.21)).toBe(true);
    expect(up4).toBe(undefined);
  });

});
