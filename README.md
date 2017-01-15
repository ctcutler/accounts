# accounts
Tools for managing ledger-based accounting

Import data from <account>:
```
python3 py/ledger_import.py -j data/accounts.dat -i <account>.csv -t <account>
```

Run unit tests:
```
python3 py/test_ledger_import.py
```

Show all balances:
```
ledger --strict -f data/accounts.dat balance
```

Net worth (commodity prices near top of accounts.dat and house/car equity must be manually updated):
```
ledger --strict -V -f data/accounts.dat balance ^assets ^liabilities
```

JS getting started:
```
. ~/.nvm/nvm.sh
nvm use 5.0
npm install
gulp test
```

Backlog
- use create-react-app to standardize react stuff/tooling
- refactor Expenses/Income charts into instances of a general "multi series over time" chart
  and move the data analysis code to the analysis file. (see FIXMEs)
- Filter all charts by account regex
- Adjust time granularity based on time range
- Add time range control to over time charts
- Clicking on point in net worth chart displays broken down assets and liabilities on that date
- On click, show all income/expenses for selected time point in income/expense charts
- Show all transactions represented by chart (respect time range and account name filters)
- Remove Demo Section
- Net worth chart has checkbox that toggles liquid/illiquid asset distinction
- Performance analysis (loading/parsing and initial display especially)
- play with granularity of savings rate chart to see whether zooming in to days, out to quarters,
  or doing some kind of smoothing/averaging would make it less spiky and more useful
- Fix monthly chart axes and tooltips to show month and year not month and day
- consider not showing incomplete time chunks (months/quarters/years) so that charts don't drop
  to near zero at start and end
- write function to normalize time range better rather than hardcoding an R.drop in Net Worth
  and Saving Rate charts (and check if this happens elsewhere) (see FIXMEs)
- move code from saving rate chart to analysis file (see FIXME)
- Use folktale's Maybe or Either to improve null handling
- brainstorm clearer ways to do text parsing functionally. . . composition of functions that
  mimics structure of data
- move commodity conversion to parsing step
- Fix sorting of items in tooltip to always match stacking in chart
- Make number of layers shown on income and expenses charts adjustable
- add loading indicator to data file load
- Figure out why the net worth chart has no liabilities at all in first 5 months
