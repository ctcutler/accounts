from collections import defaultdict
from datetime import datetime, timedelta
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
    quantity = None
    commodity = None
    unit_price = None

    def __init__(self, account=None, quantity=None, commodity='$', unit_price=None):
        self.account = account
        self.quantity = quantity
        self.commodity = commodity
        self.unit_price = unit_price

    def __str__(self):
        if self.commodity != '$':
            # account and quantity in commodity with dollars unit price
            return '  {}    {} {} @ ${}'.format(
                self.account, self.quantity, self.commodity, self.unit_price
            )
        elif self.quantity or self.quantity == 0:
            # account and quantity in dollars
            return '  {}    ${}'.format(self.account, self.quantity)
        else:
            # account only
            return '  {}'.format(self.account)

class Transaction(object):
    date = None
    desc = None
    postings = None

    def __init__(self, date=None, desc=None, postings=None):
        self.date = date
        self.desc = desc
        self.postings = postings if postings is not None else []

    @property
    def total(self):
        return sum(p.quantity for p in self.postings if p.quantity)

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
    # description -> account name
    description_map = None
    # most recent transactions with particular total
    by_quantity = None

    ignore_descs = { 'Check W/D' }

    def __init__(self, transactions=None, by_quantity=None, accounts=None, description_map=None, regexes=None):
        self.transactions = transactions or []
        self.by_quantity = by_quantity or defaultdict(list)
        self.accounts = accounts or set()
        self.description_map = description_map or defaultdict(list)
        self.regexes = regexes or []

    def __str__(self):
        return '{}\n\n{}\n\n{}\n'.format(
            '\n'.join('account '+ a for a in sorted(self.accounts)),
            '\n'.join(str(regex) for regex in self.regexes),
            '\n'.join(str(t) for t in sorted(self.transactions, key=lambda t: t.date))
        )

    def add_desc_to_map(self, desc, acct):
        if desc not in self.ignore_descs:
            self.description_map[desc].append(acct)

    def already_imported(self, trans):
        matching_quantity = self.by_quantity.get(trans.total, [])
        return len([
            mq for mq in matching_quantity
            if mq.date == trans.date and mq.desc == trans.desc
        ]) > 0

    def is_mirror_trans(self, trans):
        matching_quantity = self.by_quantity.get(-trans.total, [])

        for mq in matching_quantity:
            threshold = timedelta(days=7)
            mq_accounts = [p.account for p in mq.postings]
            trans_accounts = [p.account for p in trans.postings]

            # mirror transactions occur when:
            # - there is more than one account involved
            # - it is within the date threshold
            # - it has the same account postings in reverse order
            if len(set(mq_accounts)) > 1 and \
                mq.date + threshold > trans.date and \
                mq_accounts == trans_accounts[::-1]:
                return True

        return False

    @classmethod
    def parse_file(cls, fn):
        transactions = []
        by_quantity = defaultdict(list)
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
                    parts = [p.strip(' $') for p in line.split()]

                    # ACCT  QUANTITY COMMODITY @ $UNIT_PRICE'
                    if '@' in line:
                        # account might have spaces in it
                        posting.account = ' '.join(parts[:-4])
                        posting.quantity = Decimal(parts[-4])
                        posting.commodity = parts[-3]
                        posting.unit_price = Decimal(parts[-1])

                    # ACCT $QUANTITY
                    elif '$' in line:
                        # account might have spaces in it
                        posting.account = ' '.join(parts[:-1])
                        posting.quantity = Decimal(parts[-1])

                    #  ACCT
                    else:
                        # account might have spaces in it
                        posting.account = ' '.join(parts)

                    trans.postings.append(posting)
                elif not line.strip():
                    if trans:
                        transactions.append(trans)
                        by_quantity[trans.total].append(trans)
                    trans = None
                else:
                    raise Exception('unexpected line: %r' % line)

        for trans in transactions:
            if trans.desc not in Journal.ignore_descs:
                description_map[trans.desc] += [p.account for p in trans.postings]

        return Journal(transactions, by_quantity, accounts, description_map, regexes)
