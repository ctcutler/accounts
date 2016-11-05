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


Reports
 - Total Net Worth Over Time
   - Broken Down By Assets and Liabilities
   - Broken Down By Liquid and Illiquid
 - Income/Expenses
   - Broken Down By Account Over a Time Period

Features
 - Filter by time range
 - Filter by account pattern
 - Drill in from chart to transactions
 - Time range selector
 - Accounts that have changed significantly in a time period

To Dos
 - Track mortgage and car loan as liabilities rather than expenses
 - Identify use cases, design reports around them
 - consider using classes for transactions, postings, quantities, etc.
 - reorganize source directory, to better distinguish between UI and model
 - figure out null/undefined handling
 - move commodity coversion to parsing step
