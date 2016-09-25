import React from 'react';
const R = require('ramda');
import { filterNoOp, identifyTransactions, filterAccount } from '../analyze';

class ATransactionList extends React.Component {
  render() {
    const txns = R.compose(
      filterNoOp, identifyTransactions, filterAccount(/^Assets/)
    )(this.props.transactions);
    var transactionNodes = txns.map(trans => {
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

export default ATransactionList;
