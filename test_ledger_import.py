import builtins
from collections import defaultdict
from csv import reader as csv_reader
from datetime import datetime
from decimal import Decimal
from sys import version_info
from unittest import TestCase, main as unittest_main
from unittest.mock import patch, mock_open

from ledger_import import LedgerImportCmd, Journal, Posting, Transaction
from input_parsers import (NecuParser, UsBankParser, AllyParser, WellsFargoParser,
    BpasParser, TiaaCrefParser, AmmVanguardParser)

class TestNecuParser(TestCase):
    def test_make_transactions(self):
        "Creates transaction from NECU CSV line"
        parts = [
            '0056531888 S02',
            '02/26/16',
            '0000000000',
            'FairPoint Communi Bill Pmt W/D',
            '000000068.47',
            'DR'
        ]
        trans = NecuParser.make_transactions(parts)[0]
        self.assertIsNotNone(trans)
        self.assertEqual(trans.date, datetime(2016, 2, 26))
        self.assertEqual(trans.desc, parts[3])
        self.assertEqual(len(trans.postings), 1)
        self.assertEqual(trans.postings[0].account, 'Assets:NECU:Checking')
        self.assertEqual(trans.postings[0].quantity, Decimal('-68.47'))

class TestUsBankParser(TestCase):
    def test_make_transactions(self):
        "Creates transaction from U.S. Bank CSV line"
        parts = [
            '9/17/2010',
            'DEBIT',
            'NFI*WWW.NETFLIX.COM/CC NETFLIX.COM CA',
            '; 05968; ; ; ; ',
            '-17.9200'
        ]
        trans = UsBankParser.make_transactions(parts)[0]
        self.assertIsNotNone(trans)
        self.assertEqual(trans.date, datetime(2010, 9, 17))
        self.assertEqual(trans.desc, parts[2])
        self.assertEqual(len(trans.postings), 1)
        self.assertEqual(trans.postings[0].account, 'Liabilities:Credit Cards:U.S. Bank')
        self.assertEqual(trans.postings[0].quantity, Decimal('-17.92'))

class TestAllyParser(TestCase):
    def test_make_transactions(self):
        "Creates transaction from Ally CSV line"
        parts = [
            '2016-04-16',
            '12:34:10',
            '-82',
            'Withdrawal',
            'Bantam Market 793 Bantam Rd B Bantam',
            'CT',
            'US'
        ]
        trans = AllyParser.make_transactions(parts)[0]
        self.assertIsNotNone(trans)
        self.assertEqual(trans.date, datetime(2016, 4, 16))
        self.assertEqual(trans.desc, parts[4])
        self.assertEqual(len(trans.postings), 1)
        self.assertEqual(trans.postings[0].account, 'Assets:Ally Bank:Savings')
        self.assertEqual(trans.postings[0].quantity, Decimal('-82'))

class TestTiaaCrefParser(TestCase):
    def test_make_transactions(self):
        "Creates transaction from TIAA CREF line"
        parts = [
            '4/8/2016',
            '380737G1 GR1001 102136',
            'Buy',
            'CREF Equity Index R3',
            '162.4489',
            '2.4237',
            '393.73',
            'Contribution'
        ]
        transactions = TiaaCrefParser.make_transactions(parts)
        self.assertEqual(len(transactions), 2)
        trans1 = transactions[0]
        trans2 = transactions[1]

        self.assertEqual(trans1.date, datetime(2016, 4, 8))
        self.assertEqual(trans1.desc, 'Cash from Contribution')
        self.assertEqual(len(trans1.postings), 2)
        self.assertEqual(trans1.postings[0].account, 'Assets:TIAA CREF:403(b)')
        self.assertEqual(trans1.postings[0].quantity, Decimal('393.72739893'))
        self.assertEqual(trans1.postings[1].account, 'Income:Retirement Contributions')

        self.assertEqual(trans2.date, datetime(2016, 4, 8))
        self.assertEqual(trans2.desc, 'Buy QCEQIX with cash from Contribution')
        self.assertEqual(len(trans2.postings), 2)
        self.assertEqual(trans2.postings[0].account, 'Assets:TIAA CREF:403(b)')
        self.assertEqual(trans2.postings[0].quantity, Decimal(parts[5]))
        self.assertEqual(trans2.postings[0].commodity, 'QCEQIX')
        self.assertEqual(trans2.postings[0].unit_price, Decimal('162.4489'))
        self.assertEqual(trans2.postings[1].account, 'Assets:TIAA CREF:403(b)')

class TestAmmVanguardParser(TestCase):
    def test_make_transactions(self):
        "Creates transaction from AMM Vanguard line"
        parts = [
            '88037141475',
            '10/31/2014',
            '10/31/2014',
            'Distribution',
            'INCOME DIVIDEND',
            'Total Bond Mkt Index Inv',
            '10.86',
            '1.012',
            '10.99',
            '10.99',
        ]
        transactions = AmmVanguardParser.make_transactions(parts)
        self.assertEqual(len(transactions), 2)
        trans1 = transactions[0]
        trans2 = transactions[1]

        self.assertEqual(trans1.date, datetime(2014, 10, 31))
        self.assertEqual(trans1.desc, 'Cash from Distribution')
        self.assertEqual(len(trans1.postings), 2)
        self.assertEqual(trans1.postings[0].account, 'Assets:Vanguard:AMM Roth IRA')
        self.assertEqual(trans1.postings[0].quantity, Decimal('10.99032'))
        self.assertEqual(trans1.postings[1].account, 'Income:Dividends')

        self.assertEqual(trans2.date, datetime(2014, 10, 31))
        self.assertEqual(trans2.desc, 'Buy VBMFX with cash from Distribution')
        self.assertEqual(len(trans2.postings), 2)
        self.assertEqual(trans2.postings[0].account, 'Assets:Vanguard:AMM Roth IRA')
        self.assertEqual(trans2.postings[0].quantity, Decimal(parts[7]))
        self.assertEqual(trans2.postings[0].commodity, 'VBMFX')
        self.assertEqual(trans2.postings[0].unit_price, Decimal('10.86'))
        self.assertEqual(trans2.postings[1].account, 'Assets:Vanguard:AMM Roth IRA')

class TestWellsFargoParser(TestCase):
    def test_make_transactions(self):
        "Creates transaction from Wells Fargo line"
        parts = [
            '20160408',
            'Metropolitan West Total Return Bond I',
            'Asset Fees',
            '-$6.28',
            '-0.5783',
            '$10.8600'
        ]
        transactions = WellsFargoParser.make_transactions(parts)
        self.assertEqual(len(transactions), 2)
        trans1 = transactions[0]
        trans2 = transactions[1]

        self.assertEqual(trans1.date, datetime(2016, 4, 8))
        self.assertEqual(trans1.desc, 'Sell MWTRX for fees')
        self.assertEqual(len(trans1.postings), 2)
        self.assertEqual(trans1.postings[0].account, 'Assets:Wells Fargo:401(k)')
        self.assertEqual(trans1.postings[0].quantity, Decimal(parts[4]))
        self.assertEqual(trans1.postings[0].commodity, 'MWTRX')
        self.assertEqual(trans1.postings[0].unit_price, Decimal('10.8600'))
        self.assertEqual(trans1.postings[1].account, 'Assets:Wells Fargo:401(k)')

        self.assertEqual(trans2.date, datetime(2016, 4, 8))
        self.assertEqual(trans2.desc, 'Pay fees')
        self.assertEqual(len(trans2.postings), 2)
        self.assertEqual(trans2.postings[0].account, 'Assets:Wells Fargo:401(k)')
        self.assertEqual(trans2.postings[0].quantity, Decimal('-6.28033800'))
        self.assertEqual(trans2.postings[1].account, 'Expenses:Retirement Account Fees')

class TestBpasParser(TestCase):
    def test_make_transactions(self):
        "Creates transaction from Wells Fargo line"
        parts = '04/14/2016  VANGUARD 500 INDEX ADMIRAL SER  Contribution  N/A EMPLOYEE PRETAX 1.5475    $192.28   $297.56'.split()
        transactions = BpasParser.make_transactions(parts)
        self.assertEqual(len(transactions), 2)
        trans1 = transactions[0]
        trans2 = transactions[1]

        self.assertEqual(trans1.date, datetime(2016, 4, 14))
        self.assertEqual(trans1.desc, 'Cash from Contribution')
        self.assertEqual(len(trans1.postings), 2)
        self.assertEqual(trans1.postings[0].account, 'Assets:BPAS:401(k)')
        self.assertEqual(trans1.postings[0].quantity, Decimal('297.553300'))
        self.assertEqual(trans1.postings[1].account, 'Income:Retirement Contributions')

        self.assertEqual(trans2.date, datetime(2016, 4, 14))
        self.assertEqual(trans2.desc, 'Buy VFIAX with cash from Contribution')
        self.assertEqual(len(trans2.postings), 2)
        self.assertEqual(trans2.postings[0].account, 'Assets:BPAS:401(k)')
        self.assertEqual(trans2.postings[0].quantity, Decimal(parts[10]))
        self.assertEqual(trans2.postings[0].commodity, 'VFIAX')
        self.assertEqual(trans2.postings[0].unit_price, Decimal('192.28'))
        self.assertEqual(trans2.postings[1].account, 'Assets:BPAS:401(k)')

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
  Assets:NECU:Checking $-68.47
  Expenses:Utilities

2016/04/08 Asset Fees
  Assets:Wells Fargo:401(k)  -0.0210 VFIAX @ $188.9800
  Assets:Wells Fargo:401(k)

"""
        with patch.object(builtins, 'open', mock_open(read_data=test_data)):
            journal = Journal.parse_file('this file name is ignored by the mock')

        self.assertEqual(len(journal.accounts), 2)
        self.assertIn('Expenses', journal.accounts)
        self.assertIn('Income', journal.accounts)

        self.assertEqual(len(journal.transactions), 2)

        trans1 = journal.transactions[0]
        self.assertEqual(trans1.date, datetime(2016, 2, 26))
        self.assertEqual(trans1.desc, 'FairPoint Communi Bill Pmt W/D')
        self.assertEqual(len(trans1.postings), 2)
        posting1, posting2 = trans1.postings
        self.assertEqual(posting1.account, 'Assets:NECU:Checking')
        self.assertEqual(posting1.quantity, Decimal('-68.47'))
        self.assertEqual(posting2.account, 'Expenses:Utilities')
        self.assertEqual(posting2.quantity, None)

        trans2 = journal.transactions[1]
        self.assertEqual(trans2.date, datetime(2016, 4, 8))
        self.assertEqual(trans2.desc, 'Asset Fees')
        self.assertEqual(len(trans2.postings), 2)
        posting1, posting2 = trans2.postings
        self.assertEqual(posting1.account, 'Assets:Wells Fargo:401(k)')
        self.assertEqual(posting1.quantity, Decimal('-0.0210'))
        self.assertEqual(posting1.commodity, 'VFIAX')
        self.assertEqual(posting1.unit_price, Decimal('188.9800'))
        self.assertEqual(posting2.account, 'Assets:Wells Fargo:401(k)')
        self.assertEqual(posting2.quantity, None)

        self.assertEqual(
            journal.by_quantity[Decimal('-68.47')],
            [trans1]
        )
        self.assertEqual(
            journal.by_quantity[Decimal('-0.0210')],
            [trans2]
        )
        self.assertEqual(len(journal.by_quantity), 2)

        expected_desc_map = defaultdict(list)
        expected_desc_map['FairPoint Communi Bill Pmt W/D'].append('Assets:NECU:Checking')
        expected_desc_map['FairPoint Communi Bill Pmt W/D'].append('Expenses:Utilities')
        expected_desc_map['Asset Fees'].append('Assets:Wells Fargo:401(k)')
        expected_desc_map['Asset Fees'].append('Assets:Wells Fargo:401(k)')
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
        by_quantity = defaultdict(list)
        by_quantity[trans.total].append(trans)
        journal = Journal([trans], by_quantity)

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
        by_quantity = defaultdict(list)
        by_quantity[trans.total].append(trans)
        journal = Journal([trans], by_quantity)

        postings = [
            Posting(account=p.account, quantity=Decimal(str(-p.quantity)))
            for p in postings
        ]

        # match
        trans = Transaction(date=datetime(2016, 4, 2), desc=desc, postings=postings[::-1])
        self.assertTrue(journal.is_mirror_trans(trans))

        # time too old
        trans = Transaction(date=datetime(2016, 4, 3), desc=desc, postings=postings[::-1])
        self.assertFalse(journal.is_mirror_trans(trans))

        # postings not reversed
        trans = Transaction(date=datetime(2016, 4, 2), desc=desc, postings=postings)
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
