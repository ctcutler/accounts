from argparse import ArgumentParser
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
        self.prompt = 'Enter Account [{}]: '.format(choice(self.journal.accounts))

    # CMD methods
    def default(self, line):
        print line
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

    def __init__(self):
        self.postings = []

    def __str__(self):
        return '{} {}\n{}\n'.format(
            self.date, self.desc, '\n'.join(str(p) for p in self.postings)
        )

class Posting(object):
    account = None
    quantity = None

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
        print self.desc_acct_map

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
                    trans.date, trans.desc = line.split(' ', 1)
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


def main():
    """
    * read/parse existing journal file
    * for every line in input file
      * parse line
      * build and print incomplete transaction
      * look up and print suggestion(s)
      * accept user input and update transaction
      * store transaction in journal
    * write new journal file
    """
    arg_parser = ArgumentParser(description='Parse financial data and add to a ledger journal.')
    arg_parser.add_argument('-j', '--journal')
    arg_parser.add_argument('-i', '--input')
    arg_parser.add_argument('-o', '--output')

    args = arg_parser.parse_args()

    cmd = LedgerImportCmd()
    cmd.journal = Journal.parse_file(args.journal)

    cmd.set_suggestion()
    cmd.cmdloop()

if __name__ == "__main__":
    main()
