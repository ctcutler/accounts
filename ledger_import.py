from cmd import Cmd
from random import choice

# For tab completion in MacOS X, from:
# (https://pewpewthespells.com/blog/osx_readline.html)
import readline
readline.parse_and_bind("bind ^I rl_complete")

class LedgerImportCmd(Cmd):
    """
    TODO:
    * suggest account
    """
    COMPLETIONS = [
        'Expenses',
        'Expenses:Watches',
        'Expenses:Watches:Straps',
        'Expenses:Watches:Maintenance',
        'Income',
        'Income:Salary',
        'Income:Salary:A Salary',
        'Income:Salary:C Salary',
        'Liabilities',
        'Assets',
        'Equity',
    ]

    def set_suggestion(self):
        self.prompt = 'Enter Account [{}]: '.format(choice(self.COMPLETIONS))

    def default(self, line):
        print line
        self.set_suggestion()

    def completenames(self, text, line, begidx, endidx):
        return [c for c in self.COMPLETIONS if c.startswith(text)]

    def emptyline(self):
        self.set_suggestion()

    def do_EOF(self, line):
        return True


def main():
    cmd = LedgerImportCmd()
    cmd.set_suggestion()
    cmd.cmdloop()

if __name__ == "__main__":
    main()
