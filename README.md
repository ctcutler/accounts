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
- Figure out why the net worth chart has no liabilities at all in first 5 months
- Clicking on point in chart shows breakdown for that point (or should I just get tooltip sorting working right?)
- Come up with ways to track progress to 4x by 40, 6x by 50, 8x by 60 goals (that's net worth == N x salary)
- Performance analysis (loading/parsing and initial display especially)
- Review how challenging it would be to import financial data from previous app
- Show all transactions represented by chart (respect time range and account name filters)
- Net worth chart has checkbox that toggles liquid/illiquid asset distinction
- Fix monthly chart axes and tooltips to show month and year not month and day
- write function to normalize time range better rather than hardcoding an R.drop in Net Worth
  and Saving Rate charts (and check if this happens elsewhere) (see FIXMEs)
- move code from saving rate chart to analysis file (see FIXME)
- Use folktale's Maybe or Either to improve null handling
- brainstorm clearer ways to do text parsing functionally. . . composition of functions that
  mimics structure of data
- move commodity conversion to parsing step
- add loading indicator to data file load
