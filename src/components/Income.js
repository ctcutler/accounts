import React from 'react';
import AccountsOverTime from './AccountsOverTime';

class Income extends React.Component {
  render() {
    return (
      <AccountsOverTime
        transactions={this.props.transactions}
        chartId="incomeChart"
        accountRE={/^Income/}
        limit={10}
        invert={true}/>
    );
  }
}

export default Income;
