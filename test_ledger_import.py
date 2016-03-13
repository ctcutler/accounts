from csv import reader as csv_reader
from datetime import datetime
from decimal import Decimal
from unittest import TestCase, main as unittest_main

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
    def test_get_suggestion(self):
        DESC = 'Description!'
        cmd = LedgerImportCmd()
        cmd.journal = Journal()
        cmd.journal.description_map = {}
        trans = Transaction()
        trans.desc = DESC
        trans.postings = [Posting(account=a) for a in ['Foo', 'Bar']]

        # test with no possibilities
        sugg = cmd.get_suggestion(trans)
        self.assertEqual(sugg, '')

        # test with all possibilities already in transaction
        cmd.journal.description_map = {DESC: ['Foo', 'Bar']}
        sugg = cmd.get_suggestion(trans)
        self.assertEqual(sugg, '')

        # test with first possibility already in transaction, but second works
        cmd.journal.description_map[DESC] = ['Foo', 'Quux']
        sugg = cmd.get_suggestion(trans)
        self.assertEqual(sugg, 'Quux')

        # test with two matches, second one is returned
        cmd.journal.description_map[DESC] = ['Quux', 'Bork']
        sugg = cmd.get_suggestion(trans)
        self.assertEqual(sugg, 'Bork')

    def test_display_next_trans(self):
        pass

    def test_update_trans(self):
        pass

    def test_next_trans(self):
        pass

    def test_default(self):
        pass

    def test_completenames(self):
        pass

    def test_emptyline(self):
        pass

class TestJournal(TestCase):
    pass

if __name__ == '__main__':
    unittest_main()
