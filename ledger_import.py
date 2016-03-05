import sys
from cmd import Cmd
from random import choice

# For tab completion in MacOS X, from:
# https://pewpewthespells.com/blog/osx_readline.html
import readline
readline.parse_and_bind("bind ^I rl_complete")

class LedgerImportCmd(Cmd):
    """
    TODO:
    * read transactions from existing .dat file
    * make dict of all known desc -> account pairs
    * read lines from input file
        * look up and suggest account based on desc of every line
    * print new dat file on quit
        * print new all accounts
        * print all transactions
    """
    accounts = []

    def set_suggestion(self):
        self.prompt = 'Enter Account [{}]: '.format(choice(self.accounts))

    def default(self, line):
        print line
        if line not in self.accounts:
            self.accounts.append(line)
        self.set_suggestion()

    def completenames(self, text, line, begidx, endidx):
        return [c for c in self.accounts if c.startswith(text)]

    def emptyline(self):
        self.set_suggestion()

    def do_EOF(self, line):
        return True

def read_accounts(fn):
    with open(fn) as f:
        return [
            line.split(' ', 1)[1].strip()
            for line in f.readlines()
            if line.startswith('account ')
        ]

def main():
    cmd = LedgerImportCmd()
    cmd.accounts = read_accounts(sys.argv[1])
    cmd.set_suggestion()
    cmd.cmdloop()

if __name__ == "__main__":
    main()
