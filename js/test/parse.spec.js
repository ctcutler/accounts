const R = require('ramda');
import { transaction, ledger } from '../src/parse';
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
    expect(
      transaction(transactionInput).postings.map(R.path(['amount', 'quantity']))
    ).toEqual(
      [288.10558392, 123.45, -0.0070, undefined]
    );
  });

  it('should parse the posting commodities correctly', function () {
    expect(
      transaction(transactionInput).postings.map(R.path(['amount', 'commodity']))
    ).toEqual(
      ['$', 'ABCD', 'VEXAX', undefined]
    );
  });

  it('should parse the posting unit prices correctly', function () {
    expect(
      transaction(transactionInput).postings.map(R.path(['amount', 'unitPrice']))
    ).toEqual(
      [undefined, undefined, { commodity: '$', quantity: 62.21 }, undefined]
    );
  });

});
