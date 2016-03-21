import builtins
from collections import defaultdict
from csv import reader as csv_reader
from datetime import datetime
from decimal import Decimal
from sys import version_info
from unittest import TestCase, main as unittest_main
from unittest.mock import patch, mock_open

from ledger_import import NecuParser, LedgerImportCmd, Journal, Posting, Transaction

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
    pass

class TestLedgerImportCmd(TestCase):
    def setUp(self):
        self.DESC = 'Description!'

        self.cmd = LedgerImportCmd()
        self.cmd.journal = Journal()
        self.cmd.journal.description_map = {}

        self.trans = Transaction()
        self.trans.desc = self.DESC
        self.trans.postings = [Posting(account=a) for a in ['Foo', 'Bar']]

    def test_get_suggestion_none(self):
        "No possibilities"
        sugg = self.cmd.get_suggestion(self.trans)
        self.assertEqual(sugg, '')

    def test_get_suggestion_all_found(self):
        "All possibilities already in transaction"

        self.cmd.journal.description_map = {self.DESC: ['Foo', 'Bar']}
        sugg = self.cmd.get_suggestion(self.trans)
        self.assertEqual(sugg, '')

    def test_get_suggestion_second_works(self):
        "First possibility already in transaction, but second works"
        self.cmd.journal.description_map[self.DESC] = ['Foo', 'Quux']
        sugg = self.cmd.get_suggestion(self.trans)
        self.assertEqual(sugg, 'Quux')

    def test_get_suggestion_second_match_returned(self):
        "two matches, second one is returned"
        self.cmd.journal.description_map[self.DESC] = ['Quux', 'Bork']
        sugg = self.cmd.get_suggestion(self.trans)
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
        self.assertEqual(posting2.quantity, 0)

        expected_id_map = {'4ab2f241a94310c822a70f447bfe16ed3762cfb1': trans}
        self.assertEqual(journal.unique_id_map, expected_id_map)

        expected_desc_map = defaultdict(list)
        expected_desc_map['FairPoint Communi Bill Pmt W/D'].append('Assets:NECU:Checking')
        expected_desc_map['FairPoint Communi Bill Pmt W/D'].append('Expenses:Utilities')
        self.assertEqual(journal.description_map, expected_desc_map)

class TestTransaction(TestCase):
    def setUp(self):
        self.date = datetime(2016, 3, 20)
        self.desc = 'desc desc desc'
        self.postings = [
            Posting(account='account 1', quantity=Decimal('123.45')),
            Posting(account='account 2', quantity=0)
        ]
        self.trans1 = Transaction(date=self.date, desc=self.desc, postings=self.postings)

    def test_unique_id_same(self):
        "everything is the same, ids are same"
        trans2 = Transaction(date=self.date, desc=self.desc, postings=self.postings)
        self.assertEqual(self.trans1.unique_id, trans2.unique_id)

    def test_unique_id_different_dates(self):
        "dates are different, ids are different"
        trans2 = Transaction(
            date=datetime(2016, 3, 20, 1), desc=self.desc, postings=self.postings
        )
        self.assertNotEqual(self.trans1.unique_id, trans2.unique_id)

    def test_unique_id_different_descs(self):
        "descs are different, ids are same"
        trans2 = Transaction(date=self.date, desc='different', postings=self.postings)
        self.assertEqual(self.trans1.unique_id, trans2.unique_id)

    def test_unique_id_reversed_postings(self):
        "posting order reversed, ids are same"
        trans2 = Transaction(
            date=self.date, desc='different', postings=reversed(self.postings)
        )
        self.assertEqual(self.trans1.unique_id, trans2.unique_id)

    def test_unique_id_reversed_postings(self):
        "posting amounts are different, ids are different"
        postings2 = [
            Posting(account='account 1', quantity=Decimal('234.56')),
            Posting(account='account 2', quantity=0)
        ]
        trans2 = Transaction(date=self.date, desc='different', postings=postings2)
        self.assertNotEqual(self.trans1.unique_id, trans2.unique_id)

    def test_unique_id_opposite_amounts(self):
        "posting amounts are opposites, ids are same"
        postings2 = [
            Posting(account='account 1', quantity=Decimal('-123.45')),
            Posting(account='account 2', quantity=0)
        ]
        trans2 = Transaction(date=self.date, desc='different', postings=postings2)
        self.assertEqual(self.trans1.unique_id, trans2.unique_id)

if __name__ == '__main__':
    unittest_main()
