import sys
from collections import defaultdict

class Account(object):
    name = ''

#class AccountTreeNode(object):
#    children = defaultdict(AccountTreeNode)
#
#    def add_account(self, acct_name):
#        if ':' in acct_name:
#            name, sub_name = acct_name.split(':', 1)
#            self.children[acct_name].add_account(sub_name)
#        else:
#            self.children[acct_name] # so node gets created
#
#    def print(self, depth=0):
#        for name, node in self.children:
#

#1. Expenses: where money goes,
#2. Assets: where money sits,
#3. Income: where money comes from,
#4. Liabilities: money you owe,
#5. Equity: the real value of your property.

def make_accts(blob):
    acct_blobs = (a.strip() for a in blob.split('^') if a)
    accts = set()

    for acct_blob in acct_blobs:
        name = ''
        t = ''

        for line in acct_blob.split('\n'):
            if not line: continue
            if line.startswith('N'):
                name = line[1:]
            elif line in ('TBank', 'TOth A', 'TInvst'):
                t = 'Assets'
            elif line in ('TCCard',):
                t = 'Liabilities'
            elif line.startswith(('B', 'D', 'X', 'R')):
                pass # ignore
            elif line in ('T',):
                pass # ignore
            elif line == 'I':
                t = 'Income'
            elif line == 'E':
                t = 'Expenses'
            else:
                raise Exception(line)

        if t and name:
            accts.add(t+':'+name)

    return accts

def make_acct(blob):
    acct = Account()

    lines = [line.strip() for line in blob.split('\n')]

    acct.name = lines[0][1:]

    for line in lines[1:]:
        if line:
            field = line[0]
            value = line[1:] # strip field and newline

    print 'account {}: {} lines'.format(acct.name, len(lines))
    return acct

def parse(fn):
    ACCOUNT_HEADER = '!Account'
    CLEAR_HEADER = '!Clear:AutoSwitch'
    CAT_HEADER = '!Type:Cat'

    with open(fn) as f:
        file_data = f.read()
        acct_start = file_data.find(ACCOUNT_HEADER)
        clear_start = file_data.find(CLEAR_HEADER)
        cat_start = file_data.find(CAT_HEADER)
        trans_start = file_data.find(ACCOUNT_HEADER, cat_start)

        # accounts
        accts = make_accts(file_data[acct_start+len(ACCOUNT_HEADER):clear_start])

        # categories (which are converted into accounts)
        accts.update(make_accts(file_data[cat_start+len(CAT_HEADER):trans_start]))

        print '\n'.join(sorted(accts))

        # account data
        # FIXME

