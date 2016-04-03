# accounts
Tools for managing ledger-based accounting

Import NECU data:
`python3 ./ledger_import.py -j accounts.dat -i necu.csv -t necu`

Show all balances:
ledger -f accounts.dat balance

Future work:
* Figure out Basic Reports
* Try Budgets
* Write nifty visualizations to learn things
