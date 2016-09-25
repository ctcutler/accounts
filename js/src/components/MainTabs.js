import React from 'react';
import {Tabs, Tab} from 'material-ui/Tabs';
import APieChart from './APieChart';
import ATimeSeriesChart from './ATimeSeriesChart';
import ATransactionList from './ATransactionList';

import { data } from '../data';
import { balances, toDollars, filterBefore, filterAfter, balanceTransactions,
  convertTransactions, overMonths, overDays, identifyTransactions, runningTotal,
  filterAccount, filterNoOp
} from '../analyze';
import { ledger } from '../parse';
import { trace } from '../util';
const R = require('ramda');
const ledgerData = ledger(data);
const accountRE = /^Assets/;
const transactions = R.compose(
  filterNoOp,
  identifyTransactions,
  convertTransactions('$', ledgerData['commodityPrices']),
  balanceTransactions,
  filterAccount(accountRE),
  filterBefore(new Date('2016/03/01')),
  filterAfter(new Date('2016/01/01')),
  R.prop('transactions')
)(ledgerData);
const columns = R.compose(
  R.map(R.adjust(R.prop('$'), 1)),
  balances(accountRE)
)(transactions);
const timeSeries = R.compose(
  pairs => [R.pluck(0, pairs), R.pluck(1, pairs)],
  R.prepend(['x', 'data1']),
  runningTotal,
  overDays(accountRE)
)(transactions);

const MainTabs = () => (
  <Tabs>
    <Tab label="Net Worth">
      <p>Net Worth!</p>
    </Tab>
    <Tab label="Income & Expenses">
      <p>Income & Expenses!</p>
    </Tab>
    <Tab label="Savings Rate">
      <p>Savings Rate!</p>
    </Tab>
    <Tab label="Demo">
      <p>Demo!</p>
      <APieChart data={columns}/>
      <ATimeSeriesChart data={timeSeries}/>
      <ATransactionList transactions={transactions}/>
    </Tab>
  </Tabs>
);

export default MainTabs;
