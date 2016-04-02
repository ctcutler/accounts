from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from hashlib import sha1
import re

class AccountRegEx(object):
    account = None
    compiled = None
    regex = None

    def __init__(self, account, regex):
        self.account = account
        self.regex = regex
        self.compiled = re.compile(regex)

    def __str__(self):
        return '; /{}/ {}'.format(self.regex, self.account)

    @classmethod
    def parse(cls, line):
        _, regex, account = [part.strip() for part in line.split('/', 3)]
        return AccountRegEx(account, regex)

class Posting(object):
    account = None
    quantity = 0

    def __init__(self, account=None, quantity=0):
        self.account = account
        self.quantity = quantity

    def __str__(self):
        s = '  ' + self.account
        if self.quantity:
            s += '    $ %s' % self.quantity
        return s

class Transaction(object):
    date = None
    desc = None
    postings = None

    def __init__(self, date=None, desc=None, postings=None):
        self.date = date
        self.desc = desc
        self.postings = postings if postings is not None else []

    @property
    def unique_id(self):
        """ Some thoughts about hashing transactions:
         * We're trying to guard against duplicates caused by running over the same
           input file multiple times.
         * We don't want to omit actual duplicates in the input file.
         * We want to omit mirror image duplicates, e.g. the lines in the credit
           union and credit card statements recording the payment of the credit card
           bill.
         * Unique key should be based on date and quantity of money moving from
           account to account
         * We're going to maintain a collection of all transactions, even new ones and
           warn the user when a duplicate comes up
        """
        s = sha1()
        s.update(str(self.date).encode('utf-8'))
        pos_total = 0
        neg_total = 0
        for posting in sorted(self.postings, key=lambda p: p.account):
            if posting.quantity > 0:
                pos_total += posting.quantity
            else:
                neg_total += posting.quantity
        s.update(str(max(pos_total, abs(neg_total))).encode('utf-8'))
        return s.hexdigest()

    def __str__(self):
        return '{} {}\n{}\n'.format(
            self.date.strftime('%Y/%m/%d'),
            self.desc,
            '\n'.join(str(p) for p in self.postings)
        )

class Journal(object):
    transactions = None
    accounts = None
    regexes = None
    # unique_id -> Transaction
    unique_id_map = None
    # description -> account name
    description_map = None

    def __init__(self, transactions, unique_id_map, accounts, description_map, regexes):
        self.transactions = transactions
        self.unique_id_map = unique_id_map
        self.accounts = accounts
        self.description_map = description_map
        self.regexes = regexes

    def __str__(self):
        return '{}\n\n{}\n\n{}\n'.format(
            '\n'.join('account '+ a for a in sorted(self.accounts)),
            '\n'.join(str(regex) for regex in self.regexes),
            '\n'.join(str(t) for t in sorted(self.transactions, key=lambda t: t.date))
        )

    @classmethod
    def parse_file(cls, fn):
        transactions = []
        unique_id_map = {}
        accounts = set()
        description_map = defaultdict(list)
        regexes = []

        trans = None

        account_re = re.compile('^account')
        date_desc_re = re.compile('^\d')
        posting_re = re.compile('^\s+\S+')
        regex_comment_re = re.compile('^\s*;.*/.+/')
        comment_re = re.compile('^\s*;')

        with open(fn) as f:
            for line in f.readlines():
                line = line.rstrip()
                if re.match(account_re, line):
                    accounts.add(line.split(' ', 1)[1].strip())
                elif re.match(date_desc_re, line):
                    trans = Transaction()
                    parts = line.split(' ', 1)
                    trans.date = datetime.strptime(parts[0], '%Y/%m/%d')
                    trans.desc = parts[1]
                elif re.match(regex_comment_re, line):
                    regexes.append(AccountRegEx.parse(line))
                elif re.match(comment_re, line):
                    pass # ignore
                elif re.match(posting_re, line):
                    posting = Posting()
                    parts = line.split('$', 1)
                    posting.account = parts[0].strip()
                    if len(parts) == 2:
                        posting.quantity = Decimal(parts[1].strip().replace(',', ''))
                    trans.postings.append(posting)
                elif not line.strip():
                    if trans:
                        transactions.append(trans)
                        if trans.unique_id in unique_id_map:
                            print('WARNING: {} and {} are duplicates'.format(
                                str(trans),
                                str(unique_id_map[trans.unique_id]),
                            ))
                        unique_id_map[trans.unique_id] = trans
                    trans = None
                else:
                    raise Exception('unexpected line: %r' % line)

        for trans in transactions:
            description_map[trans.desc] += [p.account for p in trans.postings]

        return Journal(transactions, unique_id_map, accounts, description_map, regexes)
