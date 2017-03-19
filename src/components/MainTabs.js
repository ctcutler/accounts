import React from 'react';
import {Tabs, Tab} from 'material-ui/Tabs';
const R = require('ramda');

import DataFile from './DataFile';
import ByAccount from './ByAccount';
import NetWorth from './NetWorth';
import SavingRate from './SavingRate';
import Explorer from './Explorer';

import { balanceTransactions, convertTransactions } from '../lib/analyze';
import { ledger } from '../lib/parse';

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
      <Tab label="By Account">
        <ByAccount transactions={this.state.transactions}/>
      </Tab>
      <Tab label="Saving Rate">
        <SavingRate transactions={this.state.transactions}/>
      </Tab>
      <Tab label="Explorer">
        <Explorer transactions={this.state.transactions}/>
      </Tab>
      <Tab label="Data File">
        <DataFile onFileLoad={this.handleFileLoad}
          fileDate={this.state.fileDate}
          fileName={this.state.fileName}/>
      </Tab>
    </Tabs>;
  }
}

export default MainTabs;
