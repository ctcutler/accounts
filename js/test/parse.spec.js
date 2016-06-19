const Decimal = require('decimal.js');
import { transaction, ledger } from '../src/parse';

const transactionInput = `2014/02/14 foo bar
  Assets:Some Account:Sub-Account    $288.10558392
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
      transaction(transactionInput).postings.map(v => v.name)
    ).toEqual(
      ['Assets:Some Account:Sub-Account', 'Income:Some Other Account']
    );
  });

  it('should parse the posting quantities correctly', function () {
    expect(
      transaction(transactionInput).postings.map(v => v.quantity)
    ).toEqual(
      [Decimal(288.10558392), undefined]
    );
  });

});
