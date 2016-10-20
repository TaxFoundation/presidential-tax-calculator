var app = {
  init: function () {
    this.income1 = document.getElementById('income1');
    this.income2 = document.getElementById('income2');
    this.deductions = document.getElementById('deductions');
    this.children = document.getElementById('children');
    this.childrenUnderFive = document.getElementById('children5');
    this.childcare = document.getElementById('childcare');
    this.married = document.getElementById('married');
    this.currentBurden = 0;

    this.tableRows = [
      {
        name: 'Taxable Income',
        id: 'taxable-income',
      },
      {
        name: 'Income Tax',
        id: 'federal-income-tax',
      },
      {
        name: 'Child Tax Credit',
        id: 'ctc',
      },
      {
        name: 'EITC',
        id: 'eitc',
      },
      {
        name: 'Income Tax After Credits and AMT',
        id: 'federal-income-tax-after-credits',
        class: 'tax-calculator-table__row--highlight',
      },
      {
        name: 'Employee Payroll Tax',
        id: 'employee-payroll-tax',
      },
      {
        name: 'Employer Payroll Tax',
        id: 'employer-payroll-tax',
      },
      {
        name: 'Total Income and Payroll Tax Burden',
        id: 'tax-burden',
        class: 'tax-calculator-table__row--highlight',
      },
      {
        name: 'Change',
        id: 'change',
        class: 'tax-calculator-table__row--change',
      },
    ];

    this.laws = taxLaws;

    for (var i = 0, j = app.tableRows.length; i < j; i++) {
      var row = document.createElement('tr');
      row.id = app.tableRows[i].id;
      row.classList.add('tax-calculator-table__body-row');
      if (app.tableRows[i].class) {
        row.classList.add(app.tableRows[i].class);
      }

      document.getElementById('tax-results-body').appendChild(row);
      var label = document.createElement('td');
      label.className = 'tax-calculator-table__result-row-label';
      label.innerHTML = app.tableRows[i].name;
      document.getElementById(app.tableRows[i].id).appendChild(label);

      for (var m = 0, n = app.laws.length; m < n; m++) {
        cell = document.createElement('td');
        var cellId = app.laws[m].id + '-' + app.tableRows[i].id;
        cell.id = cellId;
        cell.className = 'tax-calculator-table__result';
        document.getElementById(app.tableRows[i].id).appendChild(cell);

        this[cellId] = document.getElementById(cellId);
      }
    }

    // app.setEventListeners();
    app.calculate();
  },

  getBinaryStatus: function (income1, income2, children) {
    if (app.married.checked) {
      return 'married';
    } else {
      return 'single';
    }
  },

  getTrinaryStatus: function (income1, income2, children) {
    if (app.married.checked) {
      return 'married';
    } else if (children > 0) {
      return 'hoh';
    } else {
      return 'single';
    }
  },

  setChildrenUnderFiveRange: function () {
    var maxChildren = isNaN(parseInt(app.children.value)) ? 0 : parseInt(app.children.value);
    var underFive = document.getElementById('children-under-five-field');
    var childcare = document.getElementById('childcare-field');

    if (maxChildren > 0 && underFive.classList.contains('tax-calculator__field--hidden')) {
      underFive.classList.remove('tax-calculator__field--hidden');
      childcare.classList.remove('tax-calculator__field--hidden');
    } else if (maxChildren <= 0 && !underFive.classList.contains('tax-calculator__field--hidden')) {
      underFive.classList.add('tax-calculator__field--hidden');
      childcare.classList.add('tax-calculator__field--hidden');
    }

    if (app.childrenUnderFive.value > maxChildren) {
      app.childrenUnderFive.setAttribute('value', maxChildren);
      document.getElementById('childrenUnderFiveSelected').innerHTML = maxChildren;
    }

    if (maxChildren < 0) {
      app.children.value = 0;
      app.childcare.value = 0;
    } else if (maxChildren === 0) {
      app.childcare.value = 0;
    }

    document.getElementById('children5max').innerHTML = maxChildren;

    app.childrenUnderFive.setAttribute('max', maxChildren);
    app.calculate();
  },

  setChildrenUnderFiveSelected: function () {
    var selectedChildren = isNaN(parseInt(app.childrenUnderFive.value)) ? 0 : parseInt(app.childrenUnderFive.value);
    document.getElementById('childrenUnderFiveSelected').innerHTML = selectedChildren;
    app.calculate();
  },

  toggleItemizedDeductions: function () {
    document.getElementById('deductions-field')
      .classList.toggle('tax-calculator__field--hidden');

    if (!document.getElementById('deductions-tick').checked) {
      app.deductions.value = 0;
    }

    app.calculate();
  },

  toggleMarriage: function () {
    document.getElementById('income2-field')
      .classList.toggle('tax-calculator__field--hidden');

    if (!app.married.checked) {
      app.income2.value = 0;
    }

    app.calculate();
  },

  formatResult: function (result) {
    var resultString = Math.round(Math.abs(result)).toLocaleString('en');
    // TODO check for weird behavior in toLocaleString
    if (result < 0) {
      resultString = '&minus;&#36;' + resultString;
    } else {
      resultString = '&#36;' + resultString;
    }

    return resultString;
  },

  calculate: function () {
    var income1 = isNaN(parseInt(app.income1.value)) ? 0 : parseInt(app.income1.value);
    var income2 = isNaN(parseInt(app.income2.value)) ? 0 : parseInt(app.income2.value);
    var deductions = isNaN(parseInt(app.deductions.value)) ? 0 : parseInt(app.deductions.value);
    var children = isNaN(parseInt(app.children.value)) ? 0 : parseInt(app.children.value);
    var childrenUnderFive = isNaN(parseInt(app.childrenUnderFive.value)) ? 0 : parseInt(app.childrenUnderFive.value);
    var childcareExpenses = isNaN(parseInt(app.childcare.value)) ? 0 : parseInt(app.childcare.value);
    var binaryStatus = app.getBinaryStatus(income1, income2, children);
    var trinaryStatus = app.getTrinaryStatus(income1, income2, children);

    for (var plan = 0, j = app.laws.length; plan < j; plan++) {
      var federalTaxableIncome = taxCalculator
        .getFederalTaxableIncome(
          income1,
          income2,
          children,
          childrenUnderFive,
          trinaryStatus,
          app.laws[plan],
          deductions,
          childcareExpenses
      );

      var federalIncomeTax = taxCalculator
        .getFederalIncomeTax(
          income1,
          income2,
          deductions,
          federalTaxableIncome,
          trinaryStatus,
          app.laws[plan]
        );

      var childTaxCredit = taxCalculator
        .getFederalChildTaxCredit(
          income1,
          income2,
          children,
          childrenUnderFive,
          binaryStatus,
          app.laws[plan]
        );

      var eitc = taxCalculator
        .getFederalEITC(
          income1,
          income2,
          children,
          childcareExpenses,
          binaryStatus,
          app.laws[plan]
        );

      var medicareSurtax = taxCalculator
        .getMedicareSurtax(income1, income2, binaryStatus, app.laws[plan]);

      var employeePayrollTax = taxCalculator
        .getFederalEmployeePayrollTax(income1, app.laws[plan]) +
        taxCalculator.getFederalEmployeePayrollTax(income2, app.laws[plan]) +
        medicareSurtax;

      var federalIncomeTaxAfterCredits = taxCalculator.getFederalTaxableIncomeAfterCredits(
        income1,
        income2,
        deductions,
        binaryStatus,
        (federalIncomeTax - childTaxCredit - eitc),
        app.laws[plan],
        employeePayrollTax
      );

      var taxBurden = federalIncomeTaxAfterCredits + employeePayrollTax;

      var employerPayrollTax = taxCalculator
        .getFederalEmployerPayrollTax(income1, app.laws[plan]) +
        taxCalculator.getFederalEmployerPayrollTax(income2, app.laws[plan]);

      var taxWedge = taxBurden + employerPayrollTax;

      if (app.laws[plan].id === 'current') {
        app.currentBurden = taxWedge;
      }

      document.getElementById(
          app.laws[plan].id +
          '-taxable-income'
        )
        .innerHTML = app.formatResult(federalTaxableIncome);
      document.getElementById(
          app.laws[plan].id +
          '-federal-income-tax'
        )
        .innerHTML = app.formatResult(federalIncomeTax);
      document.getElementById(
          app.laws[plan].id +
          '-ctc'
        )
        .innerHTML = app.formatResult(childTaxCredit);
      document.getElementById(
          app.laws[plan].id +
          '-eitc'
        )
        .innerHTML = app.formatResult(eitc);
      document.getElementById(
          app.laws[plan].id +
          '-federal-income-tax-after-credits'
        )
        .innerHTML = app.formatResult(federalIncomeTaxAfterCredits);
      document.getElementById(
          app.laws[plan].id +
          '-employee-payroll-tax'
        )
        .innerHTML = app.formatResult(employeePayrollTax);
      document.getElementById(
          app.laws[plan].id +
          '-employer-payroll-tax'
        )
        .innerHTML = app.formatResult(employerPayrollTax);
      document.getElementById(
          app.laws[plan].id +
          '-tax-burden'
        )
        .innerHTML = app.formatResult(taxWedge);

      var planDifference = taxWedge - app.currentBurden;
      var changeCell = document.getElementById(
        app.laws[plan].id +
          '-change'
      );

      if(app.laws[plan].id === 'current') {
        changeCell.innerHTML = '--';
      } else {
        changeCell.innerHTML = app.formatResult(planDifference);
      }


      if (planDifference > 0) {
        changeCell.setAttribute('style', 'color: red');
      } else if (planDifference < 0) {
        changeCell.setAttribute('style', 'color: green');
      } else {
        changeCell.setAttribute('style', '');
      }
    }
  },
};

var taxCalculator = {
  roundToHundredths: function (number) {
    return Math.round(number * 100) / 100;
  },

  getFederalTaxableIncome: function (
      income1,
      income2,
      children,
      childrenUnderFive,
      status,
      taxLaw,
      itemizedDeductions,
      childcareExpenses
    ) {
    var income = income1 + income2;
    var exemption = 0;
    var deduction = 0;
    var taxableIncome = 0;

    if (income > taxLaw.pepPease.threshold[status]) {
      exemption = Math.max(
        0,
        (
          1 -
          Math.ceil(
            (income - taxLaw.pepPease.threshold[status]) / 2500
          ) *
          taxLaw.pepPease.phaseoutRate
        ) *
        (
          taxLaw.personalExemption *
          (
            1 +
            children +
            (status == 'married' ? 1 : 0)
          )
        )
      );
    } else {
      exemption = taxLaw.personalExemption *
      (1 + children + (status == 'married' ? 1 : 0));
    }

    if (itemizedDeductions > taxLaw.standardDeuction[status]) {
      if (income > taxLaw.pepPease.threshold[status]) {
        deduction = Math.max(
          itemizedDeductions -
          (income - taxLaw.pepPease.threshold[status]) *
          0.03,
          itemizedDeductions * 0.2
        );
      } else {
        deduction = itemizedDeductions;
      }
    } else {
      deduction = taxLaw.standardDeuction[status];
    }

    // Plan-specific deduction calculations for Trump
    if (taxLaw.id === 'trump') {
      // Reset deduction, undoing potential application of Pease limits earlier
      deduction = Math.max(taxLaw.standardDeuction[status], itemizedDeductions);

      // Apply deduction cap if applicable
      if (status === 'married' && deduction > 200000) {
        deduction = 200000;
      } else if (deduction > 100000) {
        deduction = 100000;
      }
    }

    taxableIncome = Math.max(0, income - deduction - exemption);

    // Plan-specific deduction for Trump
    if (taxLaw.id === 'trump') {
      var childcare = childcareExpenses;
      var statusSwitch = (status == 'married' ? 2 : 1);
      if ((income1 + income2) > 250000 * statusSwitch) {
        childcare = Math.max(
          0,
          (1 -
            (
              (income1 + income2) -
              (250000 * statusSwitch)
            ) / 50000
          ) * childcare
        );
      }

      childcare = Math.min(18000, childcare);

      taxableIncome -= childcare;
    }

    return taxCalculator.roundToHundredths(Math.max(taxableIncome, 0));
  },

  getFederalIncomeTax: function (income1, income2, itemizedDeductions, taxableIncome, status, taxLaw) {
    var income = taxableIncome;
    var limit = 0;
    var federalIncomeTax = 0;

    // Plan-specific deduction calculations for Clinton
    if (taxLaw.id === 'clinton') {
      // Assume 81% of deductions and healthcare of 11% or 30k
      var deductionLimit = itemizedDeductions * (1 - 0.19) +
        Math.min((income1 + income2) * 0.11, 30000);

      var bracket = taxLaw.brackets.filter(function (b) { return b.rate == 0.33; })[0];
      var limitedIncome = taxableIncome + deductionLimit - bracket[status];
      if (limitedIncome > 0) {
        limit = Math.min(limitedIncome, deductionLimit);
      }

      income = taxableIncome + limit;
    }

    // Loop through brackets backward for ease of calculation
    for (var i = taxLaw.brackets.length - 1, j = -1; i > j; i--) {
      if (income > taxLaw.brackets[i][status]) {
        federalIncomeTax = federalIncomeTax +
          ((income - taxLaw.brackets[i][status]) * taxLaw.brackets[i].rate);
        income = taxLaw.brackets[i][status];
      }
    }

    if (taxLaw.id === 'clinton') {
      federalIncomeTax -= (limit * 0.28);
    }

    // Clinton surtax on income over $5m
    if (taxLaw.id === 'clinton' && taxableIncome > 5000000) {
      federalIncomeTax += (taxableIncome - 5000000) * 0.04;
    }

    return taxCalculator.roundToHundredths(federalIncomeTax);
  },

  getFederalEITC: function (income1, income2, children, childcare, status, taxLaw) {
    var income = income1 + income2;
    var dependents = Math.min(3, children);
    var theEITC = taxLaw.eitc[dependents];
    var earnedIncomeTaxCredit = 0;
    var trumpEITC = 0;

    if (taxLaw.id === 'trump') {
      var lowestIncome = income1;
      var statusSwitch = (status == 'married' ? 2 : 1);
      if (income1 > 0 && income2 > 0) {
        lowestIncome = Math.min(income1, income2);
      }

      if ((income1 + income2) <= (15686.27 * statusSwitch)) {
        trumpEITC = Math.min(childcare * 0.0765, lowestIncome * 0.0765);
      } else {
        trumpEITC = Math.min(childcare * 0.0765, lowestIncome * 0.0765);
        trumpEITC = Math.max(
          0,
          trumpEITC -
          ((income1 + income2) - (15686.27 * statusSwitch)) * 0.0765
        );
      }
    }

    if (income < theEITC.threshold) {
      earnedIncomeTaxCredit = income *
        (theEITC.max / theEITC.threshold);
    } else if (income >= theEITC.threshold && income <= theEITC.phaseout[status]) {
      earnedIncomeTaxCredit = theEITC.max;
    } else if (income > theEITC.phaseout[status]) {
      earnedIncomeTaxCredit = Math.max(
        0,
        theEITC.max + (
          (theEITC.phaseout[status] - income) *
          (theEITC.max / (theEITC.maxIncome[status] - theEITC.phaseout[status]))
        )
      );
    }

    return taxCalculator.roundToHundredths(earnedIncomeTaxCredit + trumpEITC);
  },

  getFederalChildTaxCredit: function (
      income1,
      income2,
      children,
      childrenUnderFive,
      status,
      taxLaw
    ) {
    var income = income1 + income2;
    var olderChildren = children;
    var childTaxCredit = 0;

    if (taxLaw.id === 'clinton') {
      olderChildren = children - childrenUnderFive;
      if (childrenUnderFive > 0) {
        if (income <= 0) {
          childTaxCredit = 0;
        } else if (income <= taxLaw.ctc.phaseout[status]) {
          childTaxCredit = Math.min(
            taxLaw.ctc.credit * 2 *
            childrenUnderFive,
            income * 0.45
          );
        } else if (income > taxLaw.ctc.phaseout[status]) {
          childTaxCredit = Math.max(
            0,
            (taxLaw.ctc.credit * 2 * childrenUnderFive) -
            (
              Math.ceil(
                (income - taxLaw.ctc.phaseout[status]) * 0.001
              ) * 1000
            ) * taxLaw.ctc.phaseoutRate
          );
        }
      }
    }

    if (olderChildren > 0) {
      if (income <= taxLaw.ctc.phaseIn) {
        childTaxCredit += 0;
      } else if (income <= taxLaw.ctc.phaseout[status]) {
        childTaxCredit += Math.min(
          taxLaw.ctc.credit *
          olderChildren,
          (income - taxLaw.ctc.phaseIn) *
          taxLaw.ctc.phaseInRate
        );
      } else if (income > taxLaw.ctc.phaseout[status]) {
        childTaxCredit += Math.max(
          0,
          (taxLaw.ctc.credit * olderChildren) -
          (
            Math.ceil(
              (income - taxLaw.ctc.phaseout[status]) * 0.001
            ) * 1000
          ) * taxLaw.ctc.phaseoutRate
        );
      }
    }

    return taxCalculator.roundToHundredths(childTaxCredit);
  },

  getFederalEmployeePayrollTax: function (indIncome, taxLaw) {
    var income = indIncome;
    var employeePayrollTax = 0;

    for (var i = taxLaw.employeePayroll.length - 1, j = -1; i > j; i--) {
      if (income > taxLaw.employeePayroll[i].income) {
        employeePayrollTax = employeePayrollTax +
          (
            (income - taxLaw.employeePayroll[i].income) *
            taxLaw.employeePayroll[i].rate
          );
        income = taxLaw.employeePayroll[i].income;
      }
    }

    return taxCalculator.roundToHundredths(employeePayrollTax);
  },

  getFederalEmployerPayrollTax: function (indIncome, taxLaw) {
    var income = indIncome;
    var employerPayrollTax = 0;

    for (var i = taxLaw.employerPayroll.length - 1, j = -1; i > j; i--) {
      if (income > taxLaw.employerPayroll[i].income) {
        employerPayrollTax = employerPayrollTax +
          (
            (income - taxLaw.employerPayroll[i].income) *
            taxLaw.employerPayroll[i].rate
          );
        income = taxLaw.employerPayroll[i].income;
      }
    }

    return taxCalculator.roundToHundredths(employerPayrollTax);
  },

  getMedicareSurtax: function (income1, income2, status, taxLaw) {
    var income = income1 + income2;
    var medicareSurtax = 0;

    for (var i = taxLaw.medicareSurtax[status].length - 1, j = -1; i > j; i--) {
      if (income > taxLaw.medicareSurtax[status][i].income) {
        medicareSurtax = medicareSurtax +
          (
            (income - taxLaw.medicareSurtax[status][i].income) *
            taxLaw.medicareSurtax[status][i].rate
          );
        income = taxLaw.medicareSurtax[status][i].income;
      }
    }

    return taxCalculator.roundToHundredths(medicareSurtax);
  },

  getAlternativeMinimumTax: function (income1, income2, itemizedDeductions, status, taxLaw) {
    if (taxLaw.amt) {
      var combinedIncome = income1 + income2;
      var exemptionPhaseout = Math.max(
        0,
        (combinedIncome -
        taxLaw.amt[status].phaseout) * 0.25
      );

      var income = combinedIncome - Math.max(0, itemizedDeductions - combinedIncome * 0.04) -
        Math.max(0, taxLaw.amt[status].exemption - exemptionPhaseout);
      var amt = 0;

      for (var i = taxLaw.amt.brackets.length - 1, j = -1; i > j; i--) {
        if (income > taxLaw.amt.brackets[i].income) {
          amt += (income - taxLaw.amt.brackets[i].income) * taxLaw.amt.brackets[i].rate;
          income = taxLaw.amt.brackets[i].income;
        }
      }

      return taxCalculator.roundToHundredths(amt);
    } else {
      return 0;
    }
  },

  getFederalTaxableIncomeAfterCredits: function (
    income1,
    income2,
    itemizedDeductions,
    status,
    federalIncomeTax,
    taxLaw,
    employeePayrollTax
  ) {
    var amt = taxCalculator.getAlternativeMinimumTax(
      income1,
      income2,
      itemizedDeductions,
      status,
      taxLaw
    );
    var incomeTax = (federalIncomeTax < 0 ? federalIncomeTax : Math.max(
      federalIncomeTax,
      amt
    ));

    // Buffett Rule
    if (taxLaw.id === 'clinton') {
      var combinedIncome = income1 + income2;
      var buffett = 0;

      if (combinedIncome > 1000000) {
        buffett = (
          combinedIncome * 0.3 *
          Math.min((combinedIncome - 1000000) / 1000000, 1)
        );
      }

      if (federalIncomeTax + employeePayrollTax < buffett && combinedIncome > 2000000) {
        incomeTax = federalIncomeTax + (buffett - employeePayrollTax);
      }
    }

    return incomeTax;
  },
};

var taxLaws = [
  {
    name: 'Current Law',
    id: 'current',
    standardDeuction: {
      single: 6300,
      married: 12600,
      hoh: 9300,
    },
    personalExemption: 4050,
    brackets: [
      {
        rate: 0.1,
        single: 0,
        married: 0,
        hoh: 0,
      },
      {
        rate: 0.15,
        single: 9275,
        married: 18550,
        hoh: 13250,
      },
      {
        rate: 0.25,
        single: 37650,
        married: 75300,
        hoh: 50400,
      },
      {
        rate: 0.28,
        single: 91150,
        married: 151900,
        hoh: 130150,
      },
      {
        rate: 0.33,
        single: 190150,
        married: 231450,
        hoh: 210800,
      },
      {
        rate: 0.35,
        single: 413350,
        married: 413350,
        hoh: 413350,
      },
      {
        rate: 0.396,
        single: 415050,
        married: 466950,
        hoh: 441000,
      },
    ],
    eitc: {
      0: {
        max: 506,
        threshold: 6610,
        phaseout: {
          single: 8270,
          married: 13820,
        },
        maxIncome: {
          single: 14880,
          married: 20430,
        },
      },
      1: {
        max: 3373,
        threshold: 9920,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 39269,
          married: 44846,
        },
      },
      2: {
        max: 5572,
        threshold: 13930,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 44648,
          married: 50198,
        },
      },
      3: {
        max: 6269,
        threshold: 13930,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 47955,
          married: 53505,
        },
      },
    },
    employeePayroll: [
      {
        rate: 0.0765,
        income: 0,
      },
      {
        rate: 0.0145,
        income: 118500,
      },
    ],
    employerPayroll: [
      {
        rate: 0.0765,
        income: 0,
      },
      {
        rate: 0.0145,
        income: 118500,
      },
    ],
    medicareSurtax: {
      single: [
        {
          rate: 0,
          income: 0,
        },
        {
          rate: 0.009,
          income: 200000,
        },
      ],
      married: [
        {
          rate: 0,
          income: 0,
        },
        {
          rate: 0.009,
          income: 250000,
        },
      ],
    },
    unemploymentInsurance: {
      rate: 0.06,
      income: 7000,
    },
    ctc: {
      credit: 1000,
      phaseIn: 3000,
      phaseInRate: 0.15,
      phaseout: {
        single: 75000,
        married: 110000,
      },
      phaseoutRate: 0.05,
    },
    pepPease: {
      threshold: {
        single: 258250,
        married: 309900,
        hoh: 284050,
      },
      phaseoutRate: 0.02,
    },
    amt: {
      brackets: [
        {
          rate: 0.26,
          income: 0,
        },
        {
          rate: 0.28,
          income: 185400,
        },
      ],
      single: {
        exemption: 53600,
        phaseout: 119200,
      },
      married: {
        exemption: 83400,
        phaseout: 158900,
      },
    },
  },
  {
    name: 'Clinton Plan',
    id: 'clinton',
    standardDeuction: {
      single: 6300,
      married: 12600,
      hoh: 9300,
    },
    personalExemption: 4050,
    brackets: [
      {
        rate: 0.1,
        single: 0,
        married: 0,
        hoh: 0,
      },
      {
        rate: 0.15,
        single: 9275,
        married: 18550,
        hoh: 13250,
      },
      {
        rate: 0.25,
        single: 37650,
        married: 75300,
        hoh: 50400,
      },
      {
        rate: 0.28,
        single: 91150,
        married: 151900,
        hoh: 130150,
      },
      {
        rate: 0.33,
        single: 190150,
        married: 231450,
        hoh: 210800,
      },
      {
        rate: 0.35,
        single: 413350,
        married: 413350,
        hoh: 413350,
      },
      {
        rate: 0.396,
        single: 415050,
        married: 466950,
        hoh: 441000,
      },
    ],
    eitc: {
      0: {
        max: 506,
        threshold: 6610,
        phaseout: {
          single: 8270,
          married: 13820,
        },
        maxIncome: {
          single: 14880,
          married: 20430,
        },
      },
      1: {
        max: 3373,
        threshold: 9920,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 39269,
          married: 44846,
        },
      },
      2: {
        max: 5572,
        threshold: 13930,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 44648,
          married: 50198,
        },
      },
      3: {
        max: 6269,
        threshold: 13930,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 47955,
          married: 53505,
        },
      },
    },
    employeePayroll: [
      {
        rate: 0.0765,
        income: 0,
      },
      {
        rate: 0.0145,
        income: 118500,
      },
    ],
    employerPayroll: [
      {
        rate: 0.0765,
        income: 0,
      },
      {
        rate: 0.0145,
        income: 118500,
      },
    ],
    medicareSurtax: {
      single: [
        {
          rate: 0,
          income: 0,
        },
        {
          rate: 0.009,
          income: 200000,
        },
      ],
      married: [
        {
          rate: 0,
          income: 0,
        },
        {
          rate: 0.009,
          income: 250000,
        },
      ],
    },
    unemploymentInsurance: {
      rate: 0.06,
      income: 7000,
    },
    ctc: {
      credit: 1000,
      phaseIn: 0,
      phaseInRate: 0.15,
      phaseout: {
        single: 75000,
        married: 110000,
      },
      phaseoutRate: 0.05,
    },
    pepPease: {
      threshold: {
        single: 258250,
        married: 309900,
        hoh: 284050,
      },
      phaseoutRate: 0.02,
    },
    amt: {
      brackets: [
        {
          rate: 0.26,
          income: 0,
        },
        {
          rate: 0.28,
          income: 185400,
        },
      ],
      single: {
        exemption: 53600,
        phaseout: 119200,
      },
      married: {
        exemption: 83400,
        phaseout: 158900,
      },
    },
  },
  {
    name: 'Trump Plan',
    id: 'trump',
    standardDeuction: {
      single: 15000,
      married: 30000,
      hoh: 15000,
    },
    personalExemption: 0,
    brackets: [
      {
        rate: 0.12,
        single: 0,
        married: 0,
        hoh: 0,
      },
      {
        rate: 0.25,
        single: 37500,
        married: 75000,
        hoh: 37500,
      },
      {
        rate: 0.33,
        single: 112500,
        married: 225000,
        hoh: 112500,
      },
    ],
    eitc: {
      0: {
        max: 506,
        threshold: 6610,
        phaseout: {
          single: 8270,
          married: 13820,
        },
        maxIncome: {
          single: 14880,
          married: 20430,
        },
      },
      1: {
        max: 3373,
        threshold: 9920,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 39269,
          married: 44846,
        },
      },
      2: {
        max: 5572,
        threshold: 13930,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 44648,
          married: 50198,
        },
      },
      3: {
        max: 6269,
        threshold: 13930,
        phaseout: {
          single: 18190,
          married: 23740,
        },
        maxIncome: {
          single: 47955,
          married: 53505,
        },
      },
    },
    employeePayroll: [
      {
        rate: 0.0765,
        income: 0,
      },
      {
        rate: 0.0145,
        income: 118500,
      },
    ],
    employerPayroll: [
      {
        rate: 0.0765,
        income: 0,
      },
      {
        rate: 0.0145,
        income: 118500,
      },
    ],
    medicareSurtax: {
      single: [
        {
          rate: 0,
          income: 0,
        },
        {
          rate: 0.009,
          income: 200000,
        },
      ],
      married: [
        {
          rate: 0,
          income: 0,
        },
        {
          rate: 0.009,
          income: 250000,
        },
      ],
    },
    unemploymentInsurance: {
      rate: 0.06,
      income: 7000,
    },
    ctc: {
      credit: 1000,
      phaseIn: 3000,
      phaseInRate: 0.15,
      phaseout: {
        single: 75000,
        married: 110000,
      },
      phaseoutRate: 0.05,
    },
    pepPease: {
      threshold: {
        single: 258250,
        married: 309900,
        hoh: 284050,
      },
      phaseoutRate: 0.05,
    },
  },
];

window.addEventListener('load', function (event) {
  app.init();
});
