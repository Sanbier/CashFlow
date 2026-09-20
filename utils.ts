import { Income, Expense, MonthCashFlowRow, AnnualDashboardKPI } from './types';
import { CORE_EXPENSE_CATEGORIES, CORE_SAVING_CATEGORY } from './constants';

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount);

export const formatDate = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export const formatDateTime = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const day = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  return `${time} • ${day}`;
};

export const toTitleCase = (str: string) => {
  return str
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const parseAmount = (val: string) =>
  val ? parseInt(val.replace(/\./g, ''), 10) || 0 : 0;

export const handleAmountInput = (val: string, setter: (v: string) => void) => {
  const raw = val.replace(/\D/g, '');
  setter(raw === '' ? '' : Number(raw).toLocaleString('vi-VN'));
};

export const handleTextInput = (val: string, setter: (v: string) => void) => {
  setter(toTitleCase(val));
};

export const getCombinedDate = (dateInput: string) => {
  const d = new Date(dateInput);
  const now = new Date();
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
  return d.toISOString();
};

export const getMonthDateRange = (year: number, monthZeroIndexed: number) => {
  const startDate = new Date(year, monthZeroIndexed, 1, 0, 0, 0, 0);
  const endDate = new Date(year, monthZeroIndexed + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

export const computeAnnualCashFlow = (
  year: number,
  incomes: Income[],
  expenses: Expense[],
  initialYearBalance: Record<number, number> = {}
): {
  monthRows: MonthCashFlowRow[];
  annualKpi: AnnualDashboardKPI;
} => {
  const rows: MonthCashFlowRow[] = [];
  let rolloverBalance = initialYearBalance[year] || 0;

  for (let m = 1; m <= 12; m++) {
    const mIncomes = incomes.filter((item) => {
      const d = new Date(item.date);
      return d.getFullYear() === year && d.getMonth() + 1 === m;
    });

    const mExpenses = expenses.filter((item) => {
      const d = new Date(item.date);
      return d.getFullYear() === year && d.getMonth() + 1 === m;
    });

    let salary = 0;
    let loan = 0;
    let other = 0;

    for (const inc of mIncomes) {
      if (inc.incomeType === 'salary') {
        salary += inc.amount;
      } else if (inc.incomeType === 'loan') {
        loan += inc.amount;
      } else if (inc.incomeType === 'other') {
        other += inc.amount;
      } else {
        const s = (inc.source || '').toLowerCase();
        if (s.includes('lương')) salary += inc.amount;
        else if (s.includes('mượn') || s.includes('vay')) loan += inc.amount;
        else other += inc.amount;
      }
    }

    const startingBal = rolloverBalance;
    const totalNewIncome = salary + loan + other;
    // In Excel Sheet 2 Row 16: TỔNG THU = Lương + Mượn + Thu khác + SỐ DƯ ĐẦU THÁNG
    const totalAvailableFunds = totalNewIncome + startingBal;

    const expCatMap: Record<string, number> = {};
    for (const cat of CORE_EXPENSE_CATEGORIES) {
      expCatMap[cat] = 0;
    }

    let totalLiving = 0;
    let savings = 0;

    for (const exp of mExpenses) {
      if (exp.category === CORE_SAVING_CATEGORY || exp.category.toLowerCase().includes('tiết kiệm')) {
        savings += exp.amount;
      } else if (expCatMap[exp.category] !== undefined) {
        expCatMap[exp.category] += exp.amount;
        totalLiving += exp.amount;
      } else {
        expCatMap['Giải trí/Phát sinh'] = (expCatMap['Giải trí/Phát sinh'] || 0) + exp.amount;
        totalLiving += exp.amount;
      }
    }

    if (savings === 0 && totalNewIncome > 0 && mExpenses.length > 0) {
      savings = Math.round(totalNewIncome * 0.1);
    }

    const totalExpense = totalLiving + savings;
    const closingBal = totalAvailableFunds - totalExpense;
    const netBal = totalNewIncome - totalExpense;

    let status: 'surplus' | 'deficit' | 'balanced' = 'balanced';
    let statusText = 'CÂN BẰNG';

    if (netBal < 0) {
      status = 'deficit';
      statusText = `⚠ CHI VƯỢT THU ${formatCurrency(Math.abs(netBal))}`;
    } else if (netBal > 0) {
      status = 'surplus';
      statusText = `DƯ ${formatCurrency(netBal)}`;
    }

    rows.push({
      month: m,
      year,
      startingBalance: startingBal,
      salaryIncome: salary,
      loanIncome: loan,
      otherIncome: other,
      totalNewIncome,
      totalIncome: totalAvailableFunds,
      expensesByCategory: expCatMap,
      totalLivingExpense: totalLiving,
      savingsAllocation: savings,
      totalExpense,
      netBalance: netBal,
      closingBalance: closingBal,
      status,
      statusText,
    });

    rolloverBalance = closingBal;
  }

  let totalAnnualIncome = 0;
  let totalAnnualExpense = 0;
  let totalAnnualSavings = 0;
  let highestExpMonth: { month: number; amount: number } | null = null;
  let lowestExpMonth: { month: number; amount: number } | null = null;
  let highestSurplusMonth: { month: number; amount: number } | null = null;
  let activeMonthCount = 0;

  for (const row of rows) {
    totalAnnualIncome += row.totalNewIncome;
    totalAnnualExpense += row.totalExpense;
    totalAnnualSavings += row.savingsAllocation;

    if (row.totalExpense > 0 || row.totalNewIncome > 0) {
      activeMonthCount++;

      if (!highestExpMonth || row.totalExpense > highestExpMonth.amount) {
        highestExpMonth = { month: row.month, amount: row.totalExpense };
      }

      if (!lowestExpMonth || (row.totalExpense > 0 && row.totalExpense < lowestExpMonth.amount)) {
        lowestExpMonth = { month: row.month, amount: row.totalExpense };
      }

      if (!highestSurplusMonth || row.netBalance > highestSurplusMonth.amount) {
        highestSurplusMonth = { month: row.month, amount: row.netBalance };
      }
    }
  }

  const averageMonthlyExpense =
    activeMonthCount > 0 ? Math.round(totalAnnualExpense / activeMonthCount) : 0;
  const savingsRate =
    totalAnnualIncome > 0 ? Math.round((totalAnnualSavings / totalAnnualIncome) * 100) : 0;

  const annualKpi: AnnualDashboardKPI = {
    totalAnnualIncome,
    totalAnnualExpense,
    totalAnnualSavings,
    highestExpenseMonth: highestExpMonth,
    lowestExpenseMonth: lowestExpMonth,
    highestSurplusMonth: highestSurplusMonth,
    averageMonthlyExpense,
    savingsRate,
  };

  return { monthRows: rows, annualKpi };
};
