import builtins
from collections import defaultdict
from csv import reader as csv_reader
from datetime import datetime
from decimal import Decimal
from sys import version_info
from unittest import TestCase, main as unittest_main
from unittest.mock import patch, mock_open

from ledger_import import (NecuParser, LedgerImportCmd, Journal, Posting,
    Transaction, UsBankParser)

class TestNecuParser(TestCase):
    def test_make_transaction(self):
        "Creates transaction from NECU CSV line"
        parts = [
            '0056531888 S02',
            '02/26/16',
            '0000000000',
            'FairPoint Communi Bill Pmt W/D',
            '000000068.47',
            'DR'
        ]
        trans = NecuParser.make_transaction(parts)
        self.assertIsNotNone(trans)
        self.assertEqual(trans.date, datetime(2016, 2, 26))
        self.assertEqual(trans.desc, parts[3])
        self.assertEqual(len(trans.postings), 1)
        self.assertEqual(trans.postings[0].account, 'Assets:NECU:Checking')
        self.assertEqual(trans.postings[0].quantity, Decimal('-68.47'))

class TestUsBankParser(TestCase):
    def test_make_transaction(self):
        "Creates transaction from U.S. Bank CSV line"
        parts = [
            '9/17/2010',
            'DEBIT',
            'NFI*WWW.NETFLIX.COM/CC NETFLIX.COM CA',
            '; 05968; ; ; ; ',
            '-17.9200'
        ]
        trans = UsBankParser.make_transaction(parts)
        self.assertIsNotNone(trans)
        self.assertEqual(trans.date, datetime(2010, 9, 17))
        self.assertEqual(trans.desc, parts[2])
        self.assertEqual(len(trans.postings), 1)
        self.assertEqual(trans.postings[0].account, 'Liabilities:Credit Cards:U.S. Bank')
        self.assertEqual(trans.postings[0].quantity, Decimal('-17.92'))

class TestLedgerImportCmd(TestCase):
    def setUp(self):
        self.DESC = 'Description!'

        self.cmd = LedgerImportCmd()
        self.cmd.journal = Journal()
        self.cmd.journal.description_map = {}

        self.trans = Transaction()
        self.trans.desc = self.DESC
        self.trans.postings = [Posting(account=a) for a in ['Foo', 'Bar']]

    def test_get_account_none(self):
        "No possibilities"
        sugg = self.cmd.get_account(self.trans)
        self.assertEqual(sugg, '')

    def test_get_account_all_found(self):
        "All possibilities already in transaction"

        self.cmd.journal.description_map = {self.DESC: ['Foo', 'Bar']}
        sugg = self.cmd.get_account(self.trans)
        self.assertEqual(sugg, '')

    def test_get_account_second_works(self):
        "First possibility already in transaction, but second works"
        self.cmd.journal.description_map[self.DESC] = ['Foo', 'Quux']
        sugg = self.cmd.get_account(self.trans)
        self.assertEqual(sugg, 'Quux')

    def test_get_account_second_match_returned(self):
        "two matches, second one is returned"
        self.cmd.journal.description_map[self.DESC] = ['Quux', 'Bork']
        sugg = self.cmd.get_account(self.trans)
        self.assertEqual(sugg, 'Bork')

class TestJournal(TestCase):
    def test_parse_file(self):
        test_data = """;this is a comment
account Expenses
account Income

;this another comment
2016/02/26 FairPoint Communi Bill Pmt W/D
  ;this a third comment
  Assets:NECU:Checking $ -68.47
  Expenses:Utilities

"""
        with patch.object(builtins, 'open', mock_open(read_data=test_data)):
            journal = Journal.parse_file('this file name is ignored by the mock')

        self.assertEqual(len(journal.accounts), 2)
        self.assertIn('Expenses', journal.accounts)
        self.assertIn('Income', journal.accounts)

        self.assertEqual(len(journal.transactions), 1)
        trans = journal.transactions[0]
        self.assertEqual(trans.date, datetime(2016, 2, 26))
        self.assertEqual(trans.desc, 'FairPoint Communi Bill Pmt W/D')

        self.assertEqual(len(trans.postings), 2)
        posting1, posting2 = trans.postings
        self.assertEqual(posting1.account, 'Assets:NECU:Checking')
        self.assertEqual(posting1.quantity, Decimal('-68.47'))
        self.assertEqual(posting2.account, 'Expenses:Utilities')
        self.assertEqual(posting2.quantity, None)

        expected_most_recent = {Decimal('-68.47'): trans}
        self.assertEqual(journal.most_recent, expected_most_recent)

        expected_desc_map = defaultdict(list)
        expected_desc_map['FairPoint Communi Bill Pmt W/D'].append('Assets:NECU:Checking')
        expected_desc_map['FairPoint Communi Bill Pmt W/D'].append('Expenses:Utilities')
        self.assertEqual(journal.description_map, expected_desc_map)

    def test_already_imported(self):
        date = datetime(2016, 3, 20)
        desc = 'desc desc desc'
        postings = [
            Posting(account='account 1', quantity=Decimal('123.45')),
            Posting(account='account 2', quantity=Decimal('-100.00')),
            Posting(account='account 3', quantity=0)
        ]
        trans = Transaction(date=date, desc=desc, postings=postings)
        journal = Journal([trans], {trans.total: trans})

        # match
        trans = Transaction(date=date, desc=desc, postings=postings)
        self.assertTrue(journal.already_imported(trans))

        # different total
        trans = Transaction(date=datetime(2016, 3, 21), desc=desc, postings=postings[:1])
        self.assertFalse(journal.already_imported(trans))

        # different date
        trans = Transaction(date=datetime(2016, 3, 21), desc=desc, postings=postings)
        self.assertFalse(journal.already_imported(trans))

        # different desc
        trans = Transaction(date=date, desc='foobar', postings=postings)
        self.assertFalse(journal.already_imported(trans))

    def test_is_mirror_trans(self):
        date = datetime(2016, 3, 20)
        desc = 'desc desc desc'
        postings = [
            Posting(account='account 1', quantity=Decimal('123.45')),
            Posting(account='account 2', quantity=Decimal('-100.00')),
            Posting(account='account 3', quantity=0)
        ]
        trans = Transaction(date=date, desc=desc, postings=postings)
        journal = Journal([trans], {trans.total: trans})

        postings = [
            Posting(account=p.account, quantity=Decimal(str(-p.quantity)))
            for p in postings
        ]

        # match
        trans = Transaction(date=datetime(2016, 3, 26), desc=desc, postings=postings[::-1])
        self.assertTrue(journal.is_mirror_trans(trans))

        # time too old
        trans = Transaction(date=datetime(2016, 3, 27), desc=desc, postings=postings[::-1])
        self.assertFalse(journal.is_mirror_trans(trans))

        # postings not reversed
        trans = Transaction(date=datetime(2016, 3, 26), desc=desc, postings=postings)
        self.assertFalse(journal.is_mirror_trans(trans))

class TestTransaction(TestCase):
    def test_total(self):
        date = datetime(2016, 3, 20)
        desc = 'desc desc desc'
        postings = [
            Posting(account='account 1', quantity=Decimal('123.45')),
            Posting(account='account 2', quantity=Decimal('-100.00')),
            Posting(account='account 3', quantity=0)
        ]
        trans = Transaction(date=date, desc=desc, postings=postings)
        self.assertEqual(Decimal('23.45'), trans.total)

if __name__ == '__main__':
    unittest_main()
