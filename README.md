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

Future work:
* Figure out Basic Reports
* Try Budgets
* Write nifty visualizations to learn things

JS stuff:
```
. ~/.nvm/nvm.sh
nvm use 5.0
npm install
gulp test
```

* `gulp test` runs the karma server
* karma (karma.conf.js) runs browserify to bundle the javascript to be run in the web browser
* browserify passes the javascript through babelify to convert it from ES2015 to ES5 before bundling

References:
* http://busypeoples.github.io/post/testing-workflow-with-es6/
* https://github.com/Nikku/karma-browserify
* https://github.com/babel/babelify
* https://github.com/karma-runner/gulp-karma

See http://jpsierens.com/tutorial-gulp-javascript-2015-react/ for ideas about how to get ES6/React going
(which conveniently uses browserify and babelify).

Reports
 - Total Net Worth Over Time
   - Broken Down By Assets and Liabilities
   - Broken Down By Liquid and Illiquid
 - Income/Expenses
   - Broken Down By Account Over a Time Period
   - Over Time

Features
 - Filter by time range
 - Filter by account pattern
 - Upload data file
 - View reports
 - Drill in from chart to transactions
 - Time range selector
 - Commodity prices
   - Read from data file
   - Fetch
 - Accounts that have changed significantly in a time period

To Dos
 - consider using classes for transactions, postings, quantities, etc.
 - reorganize source directory, to better distinguish between UI and model
 - figure out null/undefined handling
 - move commodity coversion to parsing step
