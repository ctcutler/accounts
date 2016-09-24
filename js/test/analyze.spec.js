const R = require('ramda');
import { parseDecimal } from '../src/util';
import { balanceMap, mergeAmounts, amount, amounts,
         filterAccount, filterBefore, filterAfter,
         balance, sumQuantities, balanceAmounts, balancePostings,
         balanceTransactions, convertTransactions, overDays, overWeeks,
         overMonths, overYears, identifyTransactions, runningTotal
} from '../src/analyze';

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
            unitPrice: { quantity: parseDecimal(23.45), commodity: '$' }
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

describe('balanceMap', function () {
  const prices = {CTC: { price: parseDecimal(23.45), unit: '$' }};
  const txns = R.compose(
    convertTransactions('$', prices),
    balanceTransactions
  )(transactions);
  it('should return the right credit card balanceMap', function () {
    expect(balanceMap(txns)['Liabilities:Credit Cards:MasterCard'])
      .toEqual(undefined);
  });

  it('should return the right groceries balance', function () {
    expect(balanceMap(txns)['Expenses:Groceries']).toEqual({'$': parseDecimal(34.52)});
  });

  it('should return the right bank account balance', function () {
    expect(balanceMap(txns)['Assets:Bank Account:National Savings Bank'])
      .toEqual({$: parseDecimal(-34.52)});
  });
});

describe('filterAccount', function () {
  it('should filter a balance list by account', function () {
    const balanceList = [['Foo', 1], ['Bar', 2]];
    expect(
      filterAccount(/^F/)(balanceList)
    ).toEqual(
      [['Foo', 1]]
    );
  });
});

describe('filterBefore', function () {
  it('should filter a transactions list by dates before the given one', function () {
    expect(filterBefore(new Date('2014/02/18'))(transactions).length).toEqual(2);
    expect(filterBefore(new Date('2014/02/14'))(transactions).length).toEqual(0);
  });
});

describe('filterAfter', function () {
  it('should filter a transactions list by dates after the given one', function () {
    expect(filterAfter(new Date('2014/02/16'))(transactions).length).toEqual(2);
    expect(filterAfter(new Date('2014/02/19'))(transactions).length).toEqual(0);
  });
});

describe('sumQuantities', function () {
  it('should add quantities and overwrite commodities', function () {
    const amounts = [
      { quantity: parseDecimal(-1.01) , commodity: 'FOO' },
      { quantity: parseDecimal(-1.01) , commodity: '$' },
    ];
    expect(sumQuantities(amounts[0], amounts[1])).toEqual({
      quantity: parseDecimal(-2.02), commodity: '$'
    });
  });
});

const postings = [
  { amount: { quantity: parseDecimal(-1.01) , commodity: 'FOO' }},
  { amount: { quantity: parseDecimal(-1.01) , commodity: '$' }},
  { amount: {}}
];

describe('balanceAmounts', function () {
  it('should return amount to balance ones in postings provided', function () {
    expect(balanceAmounts(postings)).toEqual({
      quantity: parseDecimal(2.02), commodity: '$'
    });
  });
});

describe('balancePostings', function () {
  it('should balance the list of postings', function () {
    expect(balancePostings(postings)[2].amount).toEqual({
      quantity: parseDecimal(2.02), commodity: '$'
    });
  });
});

describe('balanceTransactions', function () {
  it('should balance the list of transactions', function () {
    const result = balanceTransactions(transactions);
    expect(result[0].postings[1].amount).toEqual({
      quantity: parseDecimal(34.52), commodity: '$'
    });
    expect(result[1].postings[1].amount).toEqual({
      quantity: parseDecimal(22.33),
      commodity: 'CTC',
      unitPrice: { quantity: parseDecimal(23.45), commodity: '$' }
    });
    expect(result[2].postings[1].amount).toEqual({
      quantity: parseDecimal(34.52), commodity: '$'
    });
  });
});

describe('convertTransactions', () => {
  it('should convert to $', () => {
    const transactions = [
      {
        postings: [
          {amount: {commodity: '$', quantity: parseDecimal(1.23)}},
          {amount: {commodity: 'FOO', quantity: parseDecimal(2.34)}},
          {amount: {commodity: 'UNKNOWN', quantity: parseDecimal(2.34)}},
        ]
      },
      {
        postings: [
          {amount: {commodity: 'FOO', quantity: parseDecimal(3.45)}},
        ]
      },
    ];
    const prices = {
      'FOO': {
        date: new Date('2016/04/24'),
        unit: '$',
        price: parseDecimal('2')
      },
    };
    const result = convertTransactions('$', prices)(transactions);
    expect(
      result[0].postings[0]
    ).toEqual(
      {amount: {commodity: '$', quantity: parseDecimal(1.23)}}
    );
    expect(
      result[0].postings[1]
    ).toEqual(
      {amount: {commodity: '$', quantity: parseDecimal(4.68)}}
    );
    expect(
      result[0].postings[2]
    ).toEqual(
      {amount: {commodity: '$', quantity: undefined}}
    );
    expect(
      result[1].postings[0]
    ).toEqual(
      {amount: {commodity: '$', quantity: parseDecimal(6.90)}}
    );
  });
});

describe('overDays', () => {
  const transactions = [
    {
      date: new Date('2014/02/14'),
      postings: [
        {
          amount: {quantity: parseDecimal(1.23)},
          account: 'Foo:Bar'
        },
        {
          amount: {quantity: parseDecimal(1.23)},
          account: 'Foo:Quux'
        },
      ]
    },
    {
      date: new Date('2014/02/14'),
      postings: [
        {
          amount: {quantity: parseDecimal(1.23)},
          account: 'Foo:Baz'
        },
      ]
    },
    {
      date: new Date('2014/02/15'),
      postings: [
        {
          amount: {quantity: parseDecimal(1.23)},
          account: 'Foo:Quux'
        },
      ]
    },
  ];
  it('should only return quantities for matching accounts', () => {
    const res = overDays(/^Foo:Baz$/)(transactions);
    expect(res.length).toEqual(1);
    expect(res[0]).toEqual([new Date('2014/02/14'), parseDecimal(1.23)]);
  });
  it('should create a separate bucket for each date', () => {
    const res = overDays(/^Foo:Quux$/)(transactions);
    expect(res.length).toEqual(2);
    expect(res[0]).toEqual([new Date('2014/02/14'), parseDecimal(1.23)]);
    expect(res[1]).toEqual([new Date('2014/02/15'), parseDecimal(1.23)]);
  });
  it('should merge quantities regardless of transaction', () => {
    const res = overDays(/^Foo:.+/)(transactions);
    expect(res.length).toEqual(2);
    expect(res[0]).toEqual([new Date('2014/02/14'), parseDecimal(3.69)]);
    expect(res[1]).toEqual([new Date('2014/02/15'), parseDecimal(1.23)]);
  });
});

describe('overWeeks', () => {
  const transactions = [
    {
      date: new Date('2016/09/09'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
    {
      date: new Date('2016/09/10'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
    {
      date: new Date('2016/09/11'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
  ];
  it('should merge quantities in the same week', () => {
    const res = overWeeks(/^Foo:Bar$/)(transactions);
    expect(res.length).toEqual(2);
    expect(res[0]).toEqual([new Date('2016/09/04'), parseDecimal(2.46)]);
    expect(res[1]).toEqual([new Date('2016/09/11'), parseDecimal(1.23)]);
  });
});

describe('overMonths', () => {
  const transactions = [
    {
      date: new Date('2016/09/09'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
    {
      date: new Date('2016/09/10'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
    {
      date: new Date('2016/10/01'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
  ];
  it('should merge quantities in the same week', () => {
    const res = overMonths(/^Foo:Bar$/)(transactions);
    expect(res.length).toEqual(2);
    expect(res[0]).toEqual([new Date('2016/09/01'), parseDecimal(2.46)]);
    expect(res[1]).toEqual([new Date('2016/10/01'), parseDecimal(1.23)]);
  });
});
describe('overYears', () => {
  const transactions = [
    {
      date: new Date('2016/09/09'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
    {
      date: new Date('2016/09/10'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
    {
      date: new Date('2017/01/01'),
      postings: [{amount: {quantity: parseDecimal(1.23)}, account: 'Foo:Bar'}]
    },
  ];
  it('should merge quantities in the same week', () => {
    const res = overYears(/^Foo:Bar$/)(transactions);
    expect(res.length).toEqual(2);
    expect(res[0]).toEqual([new Date('2016/01/01'), parseDecimal(2.46)]);
    expect(res[1]).toEqual([new Date('2017/01/01'), parseDecimal(1.23)]);
  });
});
describe('identifyTransactions', () => {
  it('should assign a sequential identifier to each transaction', () => {
    expect(identifyTransactions([{}, {}, {}])).toEqual(
      [{id: 1}, {id: 2}, {id: 3}]
    );
  });
});
describe('runningTotal', () => {
  it('should build running total through data points', () => {
    expect(runningTotal([
      ['d', parseDecimal(1)],
      ['d', parseDecimal(1)],
      ['d', parseDecimal(1)]
    ])).toEqual(
      [["d", parseDecimal(1)], ["d", parseDecimal(2)], ["d", parseDecimal(3)]]
    );
  });
});
