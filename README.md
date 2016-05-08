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
