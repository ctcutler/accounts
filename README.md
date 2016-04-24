# accounts
Tools for managing ledger-based accounting

Import data from <account>:
```
python3 ./ledger_import.py -j data/accounts.dat -i <account>.csv -t <account>
```

Show all balances:
```
ledger --strict -f data/accounts.dat balance
```

Net worth (commodity prices near top of accounts.dat and house/car equity must be manually updated):
```
ledger --strict -V -f data/accounts.dat balance ^assets ^liabilities
```

Future work:
* Figure out Basic Reports
* Try Budgets
* Write nifty visualizations to learn things
