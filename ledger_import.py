from argparse import ArgumentParser
from cmd import Cmd
import re

from import_model import Journal, Transaction, Posting, AccountRegEx
from input_parsers import NecuParser, UsBankParser

# For tab completion in MacOS X, from:
# https://pewpewthespells.com/blog/osx_readline.html
import readline
readline.parse_and_bind("bind ^I rl_complete")

class LedgerImportCmd(Cmd):
    journal = None
    new_transactions = None
    suggestion = None
    prompt = 'account [/regex/]: '

    def get_account(self, trans):
        possibilities = self.journal.description_map.get(trans.desc, [])
        possibilities.extend(
            regex.account for regex in self.journal.regexes
            if regex.compiled.match(trans.desc)
        )
        already_there = [posting.account for posting in trans.postings]
        for p in reversed(possibilities):
            if p not in already_there:
                return p
        return ''

    def record_transaction(self, trans, acct):
        self.journal.unique_id_map[trans.unique_id] = trans
        self.journal.accounts.add(acct)
        self.journal.add_desc_to_map(trans.desc, acct)
        trans.postings.append(Posting(account=acct))
        self.journal.transactions.append(trans)
        self.journal.unique_id_map[trans.unique_id] = trans

    def process_transactions(self, skip_duplicates=False):
        "Returns True when there are no transactions left to process"
        while self.new_transactions:
            trans = self.new_transactions.pop(0)
            account = self.get_account(trans)

            # duplicate: skip?
            if skip_duplicates and trans.unique_id in self.journal.unique_id_map:
                print('###################')
                print('SKIPPING DUPLICATE: \n{}'.format(trans))
                print('###################')

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
        m = re.match('^(.+)\s*/(.+)/\s*$', line)
        if m:
            account = m.group(1).strip()
            regex = m.group(2)
            desc = trans.desc
            self.journal.regexes.append(AccountRegEx(account, regex))
            if not re.match(regex, desc):
                print('WARNING: regex {} does not match {}'.format(regex, desc))
        else:
            account = line
        self.record_transaction(trans, account)
        return self.process_transactions()

    def emptyline(self):
        print('Please enter an account')

    def completenames(self, text, line, begidx, endidx):
        return [c for c in self.journal.accounts
            if c.lower().startswith(text.lower())]

    def do_EOF(self, line):
        return True


# FIXME: consider split transactions (use case: mortgage, auto loan payments), do this by putting quantity after account

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

    if not cmd.process_transactions(skip_duplicates=True):
        # if process_transactions needs user input, enter command loop
        cmd.cmdloop()

    if not args.output:
        args.output = args.journal
    with open(args.output, 'w') as f:
        f.write(str(cmd.journal))

if __name__ == "__main__":
    main()
