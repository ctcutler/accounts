import { data } from './data';
import { balances, toDollars, filterBefore, filterAfter, balanceTransactions,
  convertTransactions, overMonths, overDays, identifyTransactions, runningTotal,
  filterAccount, filterNoOp
} from './analyze';
import { ledger } from './parse';
import { trace } from './util';
const R = require('ramda');
const d3 = require('d3');
const c3 = require('c3');

const React = require('react');
const ReactDOM = require('react-dom');

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

class TransactionList extends React.Component {
  render() {
    var transactionNodes = this.props.transactions.map(trans => {
      return (
        <tr key={trans.id}>
          <td><Transaction data={trans}/></td>
        </tr>
      );
    });
    return <table><tbody>{transactionNodes}</tbody></table>;
  }
}

class Transaction extends React.Component {
  render() {
    const postings = this.props.data.postings.map((posting, i) => {
      return (<tr key={i}>
        <td>{posting.account}</td>
        <td>{posting.amount.commodity}{posting.amount.quantity.toString()}</td>
      </tr>);
    });
    return (<table>
      <tbody>
        <tr>
          <td>{this.props.data.date.toString()}</td>
          <td>{this.props.data.desc}</td>
        </tr>
        {postings}
      </tbody>
    </table>);
  }
}

const main = <div>
  <div id="pieChart"></div>
  <div id="timeSeriesChart"></div>
  <TransactionList transactions={transactions}/>
</div>;

ReactDOM.render(
  main,
  document.getElementById('example')
);

const pieChart = c3.generate({
    bindto: '#pieChart',
    size: {
      height: 700
    },
    data: {
      type: 'pie',
      columns
    }
});
const timeSeriesChart = c3.generate({
    bindto: '#timeSeriesChart',
    data: {
        x: 'x',
        columns: timeSeries
    },
    axis: {
        x: {
            type: 'timeseries',
        }
    }
});
