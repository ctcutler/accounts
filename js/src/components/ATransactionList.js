import React from 'react';


class ATransactionList extends React.Component {
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

export default ATransactionList;
