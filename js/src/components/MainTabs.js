import React from 'react';
import {Tabs, Tab} from 'material-ui/Tabs';
import APieChart from './APieChart';
import ATimeSeriesChart from './ATimeSeriesChart';
import ATransactionList from './ATransactionList';
import Income from './Income';
import SavingRate from './SavingRate';
import NetWorth from './NetWorth';

import { data } from '../data';
import { balanceTransactions, convertTransactions } from '../analyze';
import { ledger } from '../parse';
import { trace } from '../util';
const R = require('ramda');
const ledgerData = ledger(data);
const transactions = R.compose(
  convertTransactions('$', ledgerData['commodityPrices']),
  balanceTransactions
)(ledgerData.transactions);

const MainTabs = () => (
  <Tabs>
    <Tab label="Net Worth">
      <NetWorth transactions={transactions}/>
    </Tab>
    <Tab label="Income & Expenses">
      <Income transactions={transactions}/>
    </Tab>
    <Tab label="Savings Rate">
      <SavingRate transactions={transactions}/>
    </Tab>
    <Tab label="Demo">
      <p>Demo!</p>
      <APieChart transactions={transactions}/>
      <ATimeSeriesChart transactions={transactions}/>
      <ATransactionList transactions={transactions}/>
    </Tab>
  </Tabs>
);

export default MainTabs;
