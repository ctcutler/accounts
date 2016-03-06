import csv
from argparse import ArgumentParser
from datetime import datetime
from cmd import Cmd
from collections import defaultdict
from decimal import Decimal
from random import choice
import re

# For tab completion in MacOS X, from:
# https://pewpewthespells.com/blog/osx_readline.html
import readline
readline.parse_and_bind("bind ^I rl_complete")

class LedgerImportCmd(Cmd):
    journal = None

    def set_suggestion(self):
        """
        FIXME:
        * for every line in input file
          * parse line
          * build and print incomplete transaction
          * look up and print suggestion(s)
          * accept user input and update transaction
          * store transaction in journal
        """
        self.prompt = 'Enter Account [{}]: '.format(choice(self.journal.accounts))

    # CMD methods
    def default(self, line):
        if line not in self.journal.accounts:
            self.journal.accounts.append(line)
        self.set_suggestion()

    def completenames(self, text, line, begidx, endidx):
        return [c for c in self.journal.accounts if c.startswith(text)]

    def emptyline(self):
        self.set_suggestion()

    def do_EOF(self, line):
        return True

class Transaction(object):
    date = None
    desc = None
    postings = None

    def __init__(self, date=None, desc=None, postings=None):
        self.date = date
        self.desc = desc
        self.postings = postings if postings is not None else []

    def __str__(self):
        return '{} {}\n{}\n'.format(
            self.date.strftime('%Y/%m/%d'),
            self.desc,
            '\n'.join(str(p) for p in self.postings)
        )

class Posting(object):
    account = None
    quantity = None

    def __init__(self, account=None, quantity=None):
        self.account = account
        self.quantity = quantity

    def __str__(self):
        s = '  ' + self.account
        if self.quantity is not None:
            s += ' $ %s' % self.quantity
        return s

class Journal(object):
    transactions = None
    accounts = None
    desc_acct_map = None

    def __init__(self):
        self.transactions = []
        self.accounts = []
        self.desc_acct_map = defaultdict(set)

    def __str__(self):
        return '{}\n\n{}\n'.format(
            '\n'.join('account '+ a for a in self.accounts),
            '\n'.join(str(t) for t in self.transactions)
        )

    def build_desc_acct_map(self):
        for trans in self.transactions:
            self.desc_acct_map[trans.desc].update(p.account for p in trans.postings)

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
                    journal.accounts.append(line.split(' ', 1)[1].strip())
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
                    trans = None
                else:
                    raise Exception('unexpected line: %r' % line)

        journal.build_desc_acct_map()

        return journal

# FIXME: don't forget about testing transaction uniqueness
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

    cmd.set_suggestion()
    cmd.cmdloop()

    if not args.output:
        args.output = args.journal + datetime.now().strftime('.%Y-%m-%d')
    with open(args.output, 'w') as f:
        f.write(str(cmd.journal))

if __name__ == "__main__":
    main()
