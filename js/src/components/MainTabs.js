import React from 'react';
import {Tabs, Tab} from 'material-ui/Tabs';
const R = require('ramda');

import APieChart from './APieChart';
import ATimeSeriesChart from './ATimeSeriesChart';
import ATransactionList from './ATransactionList';
import DataFile from './DataFile';
import Expenses from './Expenses';
import Income from './Income';
import NetWorth from './NetWorth';
import SavingRate from './SavingRate';

import { balanceTransactions, convertTransactions } from '../analyze';
import { ledger } from '../parse';
import { trace } from '../util';

class MainTabs extends React.Component {
  constructor(props) {
    super(props);
    this.handleFileLoad = this.handleFileLoad.bind(this);
    this.state = this.loadFromStorage();
  }

  loadFromStorage() {
    if (localStorage.ledgerData) {
      const ledgerData = ledger(localStorage.ledgerData);
      const transactions = R.compose(
        convertTransactions('$', ledgerData['commodityPrices']),
        balanceTransactions
      )(ledgerData.transactions);
      return {
        fileName: localStorage.ledgerFileName,
        fileDate: localStorage.ledgerFileDate,
        transactions
      };
    } else {
      return { fileName: "", fileDate: "", transactions: [] };
    }
  }

  handleFileLoad(name, date, data) {
    localStorage.setItem('ledgerFileName', name);
    localStorage.setItem('ledgerFileDate', date);
    localStorage.setItem('ledgerData', data);

    this.setState(this.loadFromStorage());
  }

  render() {
    return <Tabs>
      <Tab label="Net Worth">
        <NetWorth transactions={this.state.transactions}/>
      </Tab>
      <Tab label="Income & Expenses">
        <Income transactions={this.state.transactions}/>
        <Expenses transactions={this.state.transactions}/>
      </Tab>
      <Tab label="Savings Rate">
        <SavingRate transactions={this.state.transactions}/>
      </Tab>
      <Tab label="Data File">
        <DataFile onFileLoad={this.handleFileLoad}
          fileDate={this.state.fileDate}
          fileName={this.state.fileName}/>
      </Tab>
      <Tab label="Demo">
        <p>Demo!</p>
        <APieChart transactions={this.state.transactions}/>
        <ATimeSeriesChart transactions={this.state.transactions}/>
        <ATransactionList transactions={this.state.transactions}/>
      </Tab>
    </Tabs>;
  }
}

export default MainTabs;
