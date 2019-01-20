import csv
from datetime import datetime
from decimal import Decimal
import re

from import_model import Posting, Transaction

class Parser(object):
    first_header_fields = {}
    field_counts = None
    header_offset = 0
    delimiter = ','

    @classmethod
    def reorder(cls, items):
        # noop
        return items

    @classmethod
    def parse_file(cls, fn):
        with open(fn) as f:
            reader = csv.reader(f, delimiter=cls.delimiter)
            transactions = []
            for parts in cls.reorder(list(reader)[cls.header_offset:]):
                if parts and\
                   parts[0] not in cls.first_header_fields and\
                   (cls.field_counts is None or len(parts) in cls.field_counts):
                    transactions.extend(cls.make_transactions(parts))
            return transactions

class NecuParser(Parser):
    first_header_fields = {'Account Designator'}
    account = 'Assets:NECU:Checking'

    @classmethod
    def reorder(cls, items):
        return reversed(items)

    @classmethod
    def make_transactions(cls, parts):
        desc = parts[3].strip('"')
        date = datetime.strptime(parts[1], '%m/%d/%y')
        quantity = Decimal(parts[4])
        if parts[5] == 'DR':
            quantity *= -1
        posting = Posting(account=cls.account, quantity=quantity)
        return [Transaction(date=date, desc=desc, postings=[posting])]

class NecuSilverLiningParser(NecuParser):
    account = 'Assets:NECU:Silver Lining'

class UsBankParser(Parser):
    first_header_fields = {'Date'}

    @classmethod
    def trunc(cls, n):
        "remove two extra zeroes after decimal place"
        m = re.match('(-?\d+.\d{2})(\d+)', n)
        return m.group(1) if m and m.group(2) == '00' else n

    @classmethod
    def make_transactions(cls, parts):
        desc = parts[2].strip('"')
        date = datetime.strptime(parts[0], '%m/%d/%Y')
        quantity = Decimal(cls.trunc(parts[4]))
        posting = Posting(account='Liabilities:Credit Cards:U.S. Bank', quantity=quantity)
        return [Transaction(date=date, desc=desc, postings=[posting])]

class AllyParser(Parser):
    first_header_fields = {'Date'}

    @classmethod
    def reorder(cls, items):
        return reversed(items)

    @classmethod
    def make_transactions(cls, parts):
        desc = parts[4].strip('"')
        date = datetime.strptime(parts[0], '%Y-%m-%d')
        quantity = Decimal(parts[2])
        posting = Posting(account=cls.account, quantity=quantity)
        return [Transaction(date=date, desc=desc, postings=[posting])]

class AllyMoneyMarketParser(AllyParser):
    account = 'Assets:Ally Bank:Money Market'

class AllyOnlineSavingsParser(AllyParser):
    account = 'Assets:Ally Bank:Online Savings'

class AllyCD1Parser(AllyParser):
    account = 'Assets:Ally Bank:CD 1'

class AllyCD2Parser(AllyParser):
    account = 'Assets:Ally Bank:CD 2'

class AllyCD3Parser(AllyParser):
    account = 'Assets:Ally Bank:CD 3'

class AllyCD4Parser(AllyParser):
    account = 'Assets:Ally Bank:CD 4'

class AllyCD5Parser(AllyParser):
    account = 'Assets:Ally Bank:CD 5'

funds = {
    'Metropolitan West Total Return Bond I': 'MWTRX',
    'Vanguard 500 Index Admiral': 'VFIAX',
    'Vanguard 500 Idx/Signal': 'VIFSX',
    'Vanguard Extended Market Idx Adm': 'VEXAX',
    'VANGUARD 500 INDEX ADMIRAL SER': 'VFIAX',
    'VANGUARD TOTAL BD INDX ADMIRAL': 'VBTLX',
    'VANGUARD TTL INTL STK INDEX': 'VTIAX',
    'VANG TARGET RET 2045': 'VTIVX',
    'TIAA-CREF Lifecycle 2045 Fund - Institutional Class': 'TTFIX',
    'CREF Equity Index R3': 'QCEQIX',
    'CREF Equity Index R1': 'QCEQRX',
    'Total Bond Mkt Index Inv': 'VBMFX',
    'Total Stock Mkt Idx Adm': 'VTSAX',
    'Tot Intl Stock Ix Admiral': 'VTIAX',
    'Extended Mkt Index Adm': 'VEXAX',
    'Target Retirement 2045': 'VTIVX',
    'VANGUARD TARGET RETIREMENT 2045 INVESTOR CL': 'VTIVX',
}
class WellsFargoParser(Parser):
    first_header_fields = {'Date', 'common.account_download_csv.xsl'}
    account = 'Assets:Wells Fargo:401(k)'
    other_accounts = {
        'Asset Fees': 'Expenses:Retirement Account Fees',
        'Distribution fee': 'Expenses:Retirement Account Fees',
        'Contributions': 'Income:Retirement Contributions',
        'Earnings': 'Income:Dividends',
        'Plan miscellaneous fee': 'Expenses:Retirement Account Fees',
        'Transfers': account,
        'In-Service Payout': 'Assets:Vanguard:CTC IRA',
    }

    previous_transfer = None

    @classmethod
    def reorder(cls, items):
        return reversed(items)

    @classmethod
    def make_transactions(cls, parts):
        trans_type = parts[2]
        date = datetime.strptime(parts[0], '%Y%m%d')
        quantity = Decimal(parts[4])
        unit_price = Decimal(parts[5].lstrip('$'))
        total = quantity * unit_price

        commodity = funds.get(parts[1])
        if not commodity:
            raise Exception('Unknown fund: '+parts[1])

        other_account = cls.other_accounts.get(trans_type)
        if not other_account:
            raise Exception('Unexpected transaction type: '+trans_type)

        if trans_type in {'Earnings', 'Contributions'}:
            cash_desc = 'Cash from {}'.format(trans_type)
            trans_desc = 'Buy {} with cash from {}'.format(commodity, trans_type)
            cash_trans_index = 0
        elif trans_type == 'Transfers':
            cash_trans_index = None
            if quantity < 0:
                trans_desc = 'Transfer out of {}'.format(commodity)
            else:
                trans_desc = 'Transfer into {}'.format(commodity)

            # assume that transfers come in pairs and make their totals
            # match up exactly by tweaking the unit price of the second one
            # (because Wells Fargo's math/rounding is not to be trusted)
            if cls.previous_transfer is None:
                cls.previous_transfer = total
            else:
                total = -cls.previous_transfer
                unit_price = total / quantity
                cls.previous_transfer = None
        elif trans_type == 'In-Service Payout':
            cash_desc = 'Close account'
            trans_desc = 'Sell {} to close account'.format(commodity)
            cash_trans_index = 1
        else:
            cash_desc = 'Pay fees'
            trans_desc = 'Sell {} for fees'.format(commodity)
            cash_trans_index = 1

        transactions = [
            Transaction(
                date, trans_desc,
                [
                    Posting(cls.account, quantity, commodity, unit_price),
                    Posting(cls.account),
                ]
            )
        ]


        if cash_trans_index is not None:
            transactions.insert(
                cash_trans_index,
                Transaction(
                    date, cash_desc,
                    [
                        Posting(cls.account, total),
                        Posting(other_account),
                    ]
                )
            )

        return transactions

class BpasParser(Parser):
    delimiter = ' '
    account = 'Assets:BPAS:401(k)'
    other_accounts = {
        'Contribution': 'Income:Retirement Contributions',
        'Dividends': 'Income:Dividends',
        'Fees': 'Expenses:Retirement Account Fees',
        'OtherFees': 'Expenses:Retirement Account Fees',
        'Termination': 'Assets:Vanguard:CTC IRA',
    }

    @classmethod
    def reorder(cls, items):
        return sorted(
            items,
            key=lambda x: datetime.strptime(x[0], '%m/%d/%Y')
        )

    @classmethod
    def make_transactions(cls, parts):
        # 04/14/2016  VANGUARD 500 INDEX ADMIRAL SER  Contribution  N/A EMPLOYEE PRETAX 1.5475    $192.28   $297.56
        parts = [part for part in parts if part]
        trans_type = parts[-7]
        date = datetime.strptime(parts[0], '%m/%d/%Y')
        unit_price = Decimal(parts[-2].lstrip('$'))
        total = Decimal(parts[-1].replace('$', '').replace(',', ''))
        if parts[-3] == 'NaN':
            quantity = (total / unit_price).quantize(Decimal('.0001'))
        else:
            quantity = Decimal(parts[-3])
        total = quantity * unit_price
        raw_commodity = ' '.join(parts[1:-7])
        commodity = funds.get(raw_commodity)
        if not commodity:
            raise Exception('Unknown fund: '+raw_commodity)

        other_account = cls.other_accounts.get(trans_type)
        if not other_account:
            raise Exception('Unexpected transaction type: '+trans_type)

        if trans_type == 'Termination':
            cash_desc = 'Terminate account'
            trans_desc = 'Sell {} as part of termination'.format(commodity)
            # BPAS doesn't display terminations as negative
            total = -total
            quantity = -quantity
        elif trans_type in ('Fees', 'OtherFees'):
            cash_desc = 'Pay fees'
            trans_desc = 'Sell {} for fees'.format(commodity)
            # BPAS doesn't display fees as negative
            total = -total
            quantity = -quantity
        else:
            cash_desc = 'Cash from {}'.format(trans_type)
            trans_desc = 'Buy {} with cash from {}'.format(commodity, trans_type)

        return [
            Transaction(
                date, cash_desc,
                [
                    Posting(cls.account, total),
                    Posting(other_account),
                ]
            ),
            Transaction(
                date, trans_desc,
                [
                    Posting(cls.account, quantity, commodity, unit_price),
                    Posting(cls.account),
                ]
            )
        ]

class TiaaCrefParser(Parser):
    account = 'Assets:TIAA CREF:403(b)'
    first_header_fields = {'Date'}
    other_accounts = {
        'Dividends': 'Income:Dividends',
        'Long-term capital gains': 'Income:Long Term Capital Gains',
        'Short-term capital gains': 'Income:Short Term Capital Gains',
        'Contribution': 'Income:Retirement Contributions',
        'Transfer': account,
        'Plan Servicing Credit': 'Expenses:Retirement Account Fees',
    }

    @classmethod
    def reorder(cls, items):
        return reversed(items)

    @classmethod
    def make_transactions(cls, parts):
        # 4/8/2016,380737G1 GR1001 102136,Buy,CREF Equity Index R3,162.4489,2.4237,393.73,Contribution
        trans_type = parts[7]
        date = datetime.strptime(parts[0], '%m/%d/%Y')
        quantity = Decimal(parts[5])
        unit_price = Decimal(parts[4])
        total = quantity * unit_price

        commodity = funds.get(parts[3])
        if not commodity:
            raise Exception('Unknown fund: '+parts[3])

        other_account = cls.other_accounts.get(trans_type)
        if not other_account:
            raise Exception('Unexpected transaction type: '+trans_type)

        if trans_type == 'Transfer':
            cash_trans_index = None
            if quantity < 0:
                trans_desc = 'Transfer out of {}'.format(commodity)
            else:
                trans_desc = 'Transfer into {}'.format(commodity)
        else:
            cash_desc = 'Cash from {}'.format(trans_type)
            trans_desc = 'Buy {} with cash from {}'.format(commodity, trans_type)
            cash_trans_index = 0

        transactions = [
            Transaction(
                date, trans_desc,
                [
                    Posting(cls.account, quantity, commodity, unit_price),
                    Posting(cls.account),
                ]
            )
        ]


        if cash_trans_index is not None:
            transactions.insert(
                cash_trans_index,
                Transaction(
                    date, cash_desc,
                    [
                        Posting(cls.account, total),
                        Posting(other_account),
                    ]
                )
            )

        return transactions

IGNORE = 'ignore'
class VanguardParser(Parser):
    first_header_fields = {
        'Fund Account Number',
        'Account Number'
    }
    field_counts = [11, 15]
    other_accounts = {
        'Reinvestment': 'Income:Dividends',
        'Reinvestment (LT gain)': 'Income:Long Term Capital Gains',
        'Reinvestment (ST gain)': 'Income:Short Term Capital Gains',
        'Distribution': 'Income:Dividends',
        'Exchange': None,
        'Buy': None,
    }

    @classmethod
    def make_transactions(cls, parts):
        # As of sometime in 2018, Vanguard *sometimes* now separates the
        # capital gain and dividend payment transactions from the reinvestment
        # transactions so we expect two lines like this:
        #
        # 62341669,12/28/2018,12/28/2018,Capital gain (LT),Long-Term Capital Gains Distribution,VANGUARD TARGET RETIREMENT 2045 INVESTOR CL,VTIVX,0.0,1.0,0.95,0.0,0.95,0.0,Cash,
        # 62341669,12/28/2018,12/28/2018,Reinvestment (LT gain),Reinvestment of a Long-Term Capital Gains Distribution,VANGUARD TARGET RETIREMENT 2045 INVESTOR CL,VTIVX,0.047,20.08,-0.95,0.0,-0.95,0.0,Cash,
        #
        # We're going to ignore the first transaction of every pair
        # and then *assume* that it exists when we process the second one.
        # What Could Go Wrong(tm)?

        trans_type = parts[3]
        if trans_type == 'Dividend' or trans_type.startswith('Capital gain'):
            return []

        date = datetime.strptime(parts[2], '%m/%d/%Y')
        quantity = Decimal(parts[7])
        unit_price = Decimal(parts[8])
        total = quantity * unit_price

        commodity = funds.get(parts[5])
        if not commodity:
            raise Exception('Unknown fund: '+parts[5])

        other_account = cls.other_accounts.get(trans_type)
        if trans_type in {'Exchange', 'Buy'}:
            # exchanging funds within same account
            if quantity > 0:
                desc = 'Buy '+commodity
            else:
                desc = 'Sell '+commodity

            postings = [
                Posting(cls.account, quantity, commodity, unit_price),
                Posting(cls.account, -total)
            ]

            return [ Transaction(date, desc, postings) ]

        if not other_account:
            raise Exception('Unexpected transaction type: '+trans_type)

        return [
            Transaction(
                date, 'Cash from {}'.format(trans_type),
                [
                    Posting(cls.account, total),
                    Posting(other_account),
                ]
            ),
            Transaction(
                date, 'Buy {} with cash from {}'.format(commodity, trans_type),
                [
                    Posting(cls.account, quantity, commodity, unit_price),
                    Posting(cls.account),
                ]
            )
        ]

class AmmVanguardParser(VanguardParser):
    account = 'Assets:Vanguard:AMM Roth IRA'

class CtcVanguardParser(VanguardParser):
    account = 'Assets:Vanguard:CTC Roth IRA'

class CtcIraVanguardParser(Parser):
    account = 'Assets:Vanguard:CTC IRA'
    header_offset = 7

    @classmethod
    def reorder(cls, items):
        return reversed(items)

    @classmethod
    def make_transactions(cls, parts):
        # 34549708,10/11/2016,10/12/2016,Buy,Buy,VANGUARD TARGET RETIREMENT 2045 INVESTOR CL,VTIVX,1244.048,18.83,-23425.43,0.0,-23425.43,0.0,Cash,
        trans_type = parts[3]
        date = datetime.strptime(parts[2], '%m/%d/%Y')
        quantity = Decimal(parts[7]) if parts[7] else 0
        #unit_price = Decimal(parts[8])
        total = Decimal(parts[9])
        unit_price = abs(total / quantity) if quantity else 0

        # default to money market symbol because it is omitted from data
        commodity = parts[6] if parts[6] else 'VMFXX'

        if trans_type in ('Dividend', 'Capital gain (LT)',
            'Capital gain (ST)'):
            desc = 'Cash from dividends'
            postings = [
                Posting(cls.account, total),
                Posting('Income:Dividends')
            ]
        elif trans_type == 'Sweep out':
            desc = 'Cash out of sweep account'
            quantity = total # for MM acct, 1 share == $1
            postings = [
                Posting(cls.account, -quantity, commodity, unit_price),
                Posting(cls.account, total)
            ]
        elif trans_type == 'Sweep in':
            desc = 'Cash into sweep account'
            quantity = total # for MM acct, 1 share == $1
            postings = [
                Posting(cls.account, total),
                Posting(cls.account, -quantity, commodity, unit_price)
            ]
        elif trans_type in ('Buy', 'Reinvestment',
            'Reinvestment (ST gain)', 'Reinvestment (LT gain)'):
            desc = 'Buy '+commodity
            postings = [
                Posting(cls.account, quantity, commodity, unit_price),
                Posting(cls.account, total)
            ]
        elif trans_type == 'Rollover (incoming)':
            # skip this, assuming source account will record it
            return []
        else:
            raise Exception('Unexpected transaction type: '+trans_type)

        return [ Transaction(date, desc, postings) ]


class FidelityParser(Parser):
    account = 'Assets:Fidelity:401(k)'
    first_header_fields = {'Plan name:', 'Date Range', 'Date'}

    other_accounts = {
        'CONTRIBUTION': 'Income:Retirement Contributions',
        'DIVIDEND': 'Income:Dividends',
        'ADMINISTRATIVE FEES': 'Expenses:Retirement Account Fees',
        'RECORDKEEPING FEE': 'Expenses:Retirement Account Fees',
        'ADVISOR FEE': 'Expenses:Retirement Account Fees',
        'ADVISOR / CONSULTANT FEE': 'Expenses:Retirement Account Fees',
        'Withdrawals': 'Income:Retirement Withdrawals',
    }

    @classmethod
    def reorder(cls, items):
        return reversed(items)

    @classmethod
    def make_transactions(cls, parts):
        # 11/02/2016,VANG TARGET RET 2045,CONTRIBUTION,"980.00","52.887"
        date = datetime.strptime(parts[0], '%m/%d/%Y')
        trans_type = parts[2]

        if trans_type == 'REALIZED G/L':
            # useless; ignore
            return []

        total = Decimal(parts[3].strip('"').replace(',', ''))
        quantity = Decimal(parts[4].strip('"').replace(',', ''))
        unit_price = total / quantity
        commodity = funds.get(parts[1])
        if not commodity:
            raise Exception('Unknown fund: '+raw_commodity)

        other_account = cls.other_accounts.get(trans_type)
        if not other_account:
            raise Exception('Unexpected transaction type: '+trans_type)

        if trans_type in ('CONTRIBUTION', 'DIVIDEND'):
            cash_desc = 'Cash from {}'.format(trans_type)
            trans_desc = 'Buy {} with cash from {}'.format(commodity, trans_type)
        elif trans_type in ('ADMINISTRATIVE FEES', 'RECORDKEEPING FEE', 'ADVISOR FEE', 'ADVISOR / CONSULTANT FEE'):
            cash_desc = 'Pay fees'
            trans_desc = 'Sell {} for fees'.format(commodity)
        elif trans_type in ('Withdrawals',):
            cash_desc = 'Withdraw funds'
            trans_desc = 'Sell {} for withdrawal'.format(commodity)
        else:
            raise Exception('Unknown trans_type: '+trans_type)

        return [
            Transaction(
                date, cash_desc,
                [
                    Posting(cls.account, total),
                    Posting(other_account),
                ]
            ),
            Transaction(
                date, trans_desc,
                [
                    Posting(cls.account, quantity, commodity, unit_price),
                    Posting(cls.account),
                ]
            )
        ]

class KennebunkParser(Parser):
    first_header_fields = {'Account'}
    account = 'Assets:Kennebunk:Checking'

    @classmethod
    def reorder(cls, items):
        return reversed(items)

    @classmethod
    def make_transactions(cls, parts):
        desc = parts[6].strip('"')
        date = datetime.strptime(parts[5], '%m/%d/%Y')
        if parts[2]:
            quantity = -1 * Decimal(parts[2])
        else:
            quantity = Decimal(parts[3])
        posting = Posting(account=cls.account, quantity=quantity)
        return [Transaction(date=date, desc=desc, postings=[posting])]
