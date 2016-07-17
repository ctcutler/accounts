const R = require('ramda');
import { parseDecimal } from '../src/util';
import { balance, balancePostings, mergeAmounts, amount, amounts,
         balancedAmount, emptyKey } from '../src/analyze';

const transactions = [
  {
    desc: 'grocery store!',
    date: new Date('2014/02/14'),
    postings: [
      {
        account: 'Liabilities:Credit Cards:MasterCard',
        amount: { quantity: parseDecimal(-34.52) , commodity: '$' }
      },
      {
        account: 'Expenses:Groceries',
        amount: {}
      }
    ]
  },
  {
    desc: 'buy stock',
    date: new Date('2014/02/17'),
    postings: [
      {
        account: 'Assets:Brokerage Account',
        amount: {
            quantity: parseDecimal(-22.33),
            commodity: 'CTC',
            unitPrice: { quantity: 23.45, commodity: '$' }
        }
      },
      {
        account: 'Assets:Brokerage Account',
        amount: {}
      }
    ]
  },
  {
    desc: 'pay credit card bill',
    date: new Date('2014/02/19'),
    postings: [
      {
        account: 'Assets:Bank Account:National Savings Bank',
        amount: { quantity: parseDecimal(-34.52) , commodity: '$' }
      },
      {
        account: 'Liabilities:Credit Cards:MasterCard',
        amount: {}
      }
    ]
  }
];

describe('amount', function() {
  it('should return a commodity -> quantity object', () => {
    const input = {amount: { quantity: parseDecimal(-34.52), commodity: '$' }};
    expect(amount(input)['$']).toEqual(parseDecimal(-34.52));
  });

  it('should return a completely empty object', () => {
    const input = {amount: {}};
    expect(R.isEmpty(amount(input))).toBe(true);
  });

  it('should handle unitPrice', () => {
    const input = {
        amount: {
            quantity: parseDecimal(-22.33),
            commodity: 'CTC',
            unitPrice: { quantity: parseDecimal(23.45), commodity: '$' }
        }
    };
    expect(amount(input)['CTC']).toEqual(parseDecimal(-22.33));
    expect(amount(input)['$']).toEqual(parseDecimal(523.6385));
  });
});

const accountMapping = {
  'Account 1:Subaccount 1': {'$': parseDecimal(-34.52)},
  'Account 2': {'$': parseDecimal(-1.23)},
  'Account 3': {'FOOBAR': parseDecimal(-123.45)},
  'Account 4': {}
};

describe('emptyKey', function () {
  it('should return the key that corresponds to an empty object', function () {
    expect(emptyKey(accountMapping)).toEqual('Account 4');
  });
});

describe('balancedAmount', function () {
  it('should return the balanced amount', function () {
    expect(
      balancedAmount(accountMapping)
    ).toEqual(
      {'$': parseDecimal(35.75), 'FOOBAR': parseDecimal(123.45)}
    );
  });
});

describe('balancePostings', function () {
  it('should balance postings', function () {
    const balanced = balancePostings(accountMapping);
    expect(balanced['Account 4']['$']).toEqual(parseDecimal(35.75));
    expect(balanced['Account 4']['FOOBAR']).toEqual(parseDecimal(123.45));
  });
});

describe('mergeAmounts', function () {
  it('should properly merge different commodities', function () {
    const merged = mergeAmounts(
      {'FOOBAR': parseDecimal(11.11)},
      {'BAZBUZ': parseDecimal(11.11)}
    );
    expect(merged.FOOBAR).toEqual(parseDecimal(11.11));
    expect(merged.BAZBUZ).toEqual(parseDecimal(11.11));
  });
  it('should properly merge the same commodity', function () {
    const merged = mergeAmounts(
      {'FOOBAR': parseDecimal(11.11)},
      {'FOOBAR': parseDecimal(11.11)}
    );
    expect(merged.FOOBAR).toEqual(parseDecimal(22.22));
  });
});

describe('balance', function () {
  it('should return the right credit card balance', function () {
    expect(balance(transactions)['Liabilities:Credit Cards:MasterCard'])
      .toEqual({$: parseDecimal(0.00)});
  });

  it('should return the right groceries balance', function () {
    expect(balance(transactions)['Expenses:Groceries']).toEqual({'$': parseDecimal(34.52)});
  });

  it('should return the right bank account balance', function () {
    expect(balance(transactions)['Assets:Bank Account:National Savings Bank'])
      .toEqual({$: parseDecimal(-34.52)});
  });

  it('should return the right brokerage account balance', function () {
    expect(balance(transactions)['Assets:Brokerage Account'])
      .toEqual({CTC: parseDecimal(-22.33), $: parseDecimal(523.6385)});
  });
});
