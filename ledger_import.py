from argparse import ArgumentParser
from datetime import datetime
from decimal import Decimal
from cmd import Cmd
import csv

from import_model import Journal, Transaction, Posting

# For tab completion in MacOS X, from:
# https://pewpewthespells.com/blog/osx_readline.html
import readline
readline.parse_and_bind("bind ^I rl_complete")

class LedgerImportCmd(Cmd):
    journal = None
    new_transactions = None
    suggestion = None
    DUPLICATE = 'SKIP DUPLICATE'
    prompt = 'Enter Account: '

    def get_account(self, trans):
        possibilities = self.journal.description_map.get(trans.desc, [])
        already_there = [posting.account for posting in trans.postings]
        for p in reversed(possibilities):
            if p not in already_there:
                return p
        return ''

    def record_transaction(self, trans, acct):
        """Pulls first transaction off the queue, updates the unique id map,
           updates everything with then new transaction details, and updates
           the unique id map again with the updated transaction."""
        self.journal.unique_id_map[trans.unique_id] = trans
        self.journal.accounts.add(acct)
        self.journal.description_map[trans.desc].append(acct)
        trans.postings.append(Posting(account=acct))
        self.journal.transactions.append(trans)
        self.journal.unique_id_map[trans.unique_id] = trans

    def process_transactions(self):
        "Returns True when there are no transactions left to process"
        while self.new_transactions:
            trans = self.new_transactions.pop(0)
            account = self.get_account(trans)

            # duplicate: skip
            if trans.unique_id in self.journal.unique_id_map:
                print('SKIPPING DUPLICATE: {}'.format(trans))

            # matching transaction: update
            elif account:
                self.record_transaction(trans, account)
                print(trans)

            # need user input: break
            else:
                print(trans)
                self.new_transactions.insert(0, trans)
                return False

        return True

    # CMD methods
    def default(self, line):
        trans = self.new_transactions.pop(0)
        self.record_transaction(trans, line)
        return self.process_transactions()

    def emptyline(self):
        print('Please enter an account')

    def completenames(self, text, line, begidx, endidx):
        return [c for c in self.journal.accounts if c.startswith(text)]

    def do_EOF(self, line):
        return True


# FIXME: regular expressions: enter /^Foo\n$/ Expenses:Foo:Bar, store in comments
# FIXME: consider split transactions (use case: mortgage, auto loan payments), do this by putting quantity after account

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
                for parts in reversed(list(csv.reader(f)))
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
    input_parsers = {
        'necu': NecuParser,
        'usbank': UsBankParser
    }
    arg_parser = ArgumentParser(
        description='Parse financial data and add to a ledger journal.'
    )
    arg_parser.add_argument('-j', '--journal', required=True)
    arg_parser.add_argument('-i', '--input', required=True)
    arg_parser.add_argument('-o', '--output')
    arg_parser.add_argument('-t', '--input-type', choices=input_parsers.keys(), required=True)

    args = arg_parser.parse_args()

    cmd = LedgerImportCmd()
    cmd.journal = Journal.parse_file(args.journal)
    cmd.new_transactions = input_parsers[args.input_type].parse_file(args.input)

    if not cmd.process_transactions():
        # if process_transactions needs user input, enter command loop
        cmd.cmdloop()

    if not args.output:
        args.output = args.journal
    with open(args.output, 'w') as f:
        f.write(str(cmd.journal))

if __name__ == "__main__":
    main()
