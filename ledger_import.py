import csv
from argparse import ArgumentParser
from datetime import datetime
from cmd import Cmd
from collections import defaultdict
from decimal import Decimal
from hashlib import sha1
from random import choice
import re

# For tab completion in MacOS X, from:
# https://pewpewthespells.com/blog/osx_readline.html
import readline
readline.parse_and_bind("bind ^I rl_complete")

class LedgerImportCmd(Cmd):
    journal = None
    new_transactions = None
    suggestion = None
    DUPLICATE = 'SKIP DUPLICATE'

    def get_suggestion(self, trans):
        possibilities = self.journal.description_map.get(trans.desc, [])
        already_there = [posting.account for posting in trans.postings]
        for p in reversed(possibilities):
            if p not in already_there:
                return p
        return ''

    def display_next_trans(self):
        if self.new_transactions:
            trans = self.new_transactions[0]
            print('\n' + ('-' * 40))
            print(str(trans))
            unique_id = trans.unique_id
            if unique_id in self.journal.unique_id_map:
                print('POTENTIAL DUPLICATE OF: \n{}'.format(
                    self.journal.unique_id_map[unique_id]
                ))
                self.suggestion = self.DUPLICATE
            else:
                self.suggestion = self.get_suggestion(trans)
            self.prompt = 'Enter Account [{}]: '.format(self.suggestion)
        else:
            print('Done!')
            self.prompt = 'Control-D to exit:'

    def update_trans(self, acct):
        """Pulls first transaction off the queue, updates the unique id map,
           updates everything with then new transaction details, and updates
           the unique id map again with the updated transaction."""
        trans = self.new_transactions[0]
        self.journal.unique_id_map[trans.unique_id] = trans
        self.journal.accounts.add(acct)
        self.journal.description_map[trans.desc].append(acct)
        trans.postings.append(Posting(account=acct))
        self.journal.transactions.append(trans)
        self.journal.unique_id_map[trans.unique_id] = trans

    def next_trans(self):
        self.new_transactions.pop(0)
        self.display_next_trans()

    # CMD methods
    def default(self, line):
        self.update_trans(line)
        self.next_trans()

    def completenames(self, text, line, begidx, endidx):
        return [c for c in self.journal.accounts if c.startswith(text)]

    def emptyline(self):
        if self.suggestion:
            if self.suggestion != self.DUPLICATE:
                self.update_trans(self.suggestion)
            self.next_trans()
        else:
            print('Please enter an account')

    def do_EOF(self, line):
        return True

class Posting(object):
    account = None
    quantity = 0

    def __init__(self, account=None, quantity=0):
        self.account = account
        self.quantity = quantity

    def __str__(self):
        s = '  ' + self.account
        if self.quantity:
            s += ' $ %s' % self.quantity
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
         * Unique key should be based on date, quantity of money moving from
           account to account, and concatenation of all accounts.
         * We're going to maintain a collection of all transactions, even new ones and
           warn the user when a duplicate comes up
        """
        s = sha1()
        s.update(str(self.date).encode('utf-8'))
        pos_total = 0
        neg_total = 0
        for posting in sorted(self.postings, key=lambda p: p.account):
            s.update(posting.account.encode('utf-8'))
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
    # unique_id -> Transaction
    unique_id_map = None
    # description -> account name
    description_map = None

    def __init__(self):
        self.transactions = []
        self.unique_id_map = {}
        self.accounts = set()
        self.description_map = defaultdict(list)

    def __str__(self):
        return '{}\n\n{}\n'.format(
            '\n'.join('account '+ a for a in sorted(self.accounts)),
            '\n'.join(str(t) for t in self.transactions)
        )

    def build_description_map(self):
        for trans in self.transactions:
            self.description_map[trans.desc] += [p.account for p in trans.postings]

    @classmethod
    def parse_file(cls, fn):
        journal = Journal()
        trans = None
        account_re = re.compile('^account')
        date_desc_re = re.compile('^\d')
        posting_re = re.compile('^\s+\S+')
        comment_re = re.compile('^\s*;')

        with open(fn) as f:
            for line in f.readlines():
                line = line.rstrip()
                if re.match(account_re, line):
                    journal.accounts.add(line.split(' ', 1)[1].strip())
                elif re.match(date_desc_re, line):
                    trans = Transaction()
                    parts = line.split(' ', 1)
                    trans.date = datetime.strptime(parts[0], '%Y/%m/%d')
                    trans.desc = parts[1]
                elif re.match(comment_re, line):
                    pass # ignore for now
                elif re.match(posting_re, line):
                    posting = Posting()
                    parts = line.split('$', 1)
                    posting.account = parts[0].strip()
                    if len(parts) == 2:
                        posting.quantity = Decimal(parts[1].strip().replace(',', ''))
                    trans.postings.append(posting)
                elif not line.strip():
                    if trans:
                        journal.transactions.append(trans)
                        if trans.unique_id in journal.unique_id_map:
                            print('WARNING: {} and {} are duplicates'.format(
                                str(trans),
                                str(journal.unique_id_map[trans.unique_id]),
                            ))
                        journal.unique_id_map[trans.unique_id] = trans
                    trans = None
                else:
                    raise Exception('unexpected line: %r' % line)

        journal.build_description_map()

        return journal

# FIXME: don't forget about regular expressions

class NecuParser(object):
    @classmethod
    def make_transaction(cls, parts):
        desc = parts[3].strip('"')
        date = datetime.strptime(parts[1], '%m/%d/%y')
        quantity = Decimal(parts[4])
        if parts[5] == 'DR':
            quantity *= -1
        posting = Posting(account='Assets:NECU:Checking', quantity=quantity)
        return Transaction(date=date, desc=desc, postings=[posting])

    @classmethod
    def parse_file(cls, fn):
        with open(fn) as f:
            return [
                cls.make_transaction(parts)
                for parts in csv.reader(f)
                if parts[0] != 'Account Designator'
            ]

class UsBankParser(object):
    pass

def main():
    """
    * read/parse existing journal file
    * read/parse input file, building list of new transactions
    * pass new transactions to cmd instance and enter loop
    * when loop exists, write new journal file, to output file
    """
    arg_parser = ArgumentParser(
        description='Parse financial data and add to a ledger journal.'
    )
    arg_parser.add_argument('-j', '--journal')
    arg_parser.add_argument('-i', '--input')
    arg_parser.add_argument('-o', '--output')
    arg_parser.add_argument(
        '--necu', dest='input_parser', action='store_const', const=NecuParser,
        help='input file comes from NECU'
    )
    arg_parser.add_argument(
        '--usbank', dest='input_parser', action='store_const', const=UsBankParser,
        help='input file comes from U.S. Bank'
    )

    args = arg_parser.parse_args()

    cmd = LedgerImportCmd()
    cmd.journal = Journal.parse_file(args.journal)
    cmd.new_transactions = args.input_parser.parse_file(args.input)

    cmd.display_next_trans()
    cmd.cmdloop()

    if not args.output:
        args.output = args.journal + datetime.now().strftime('.%Y-%m-%d')
    with open(args.output, 'w') as f:
        f.write(str(cmd.journal))

if __name__ == "__main__":
    main()
