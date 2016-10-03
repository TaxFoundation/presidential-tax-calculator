var app = {
  init: function () {
    this.income1 = document.getElementById('income1');
    this.income2 = document.getElementById('income2');
    this.children = document.getElementById('children');
    this.married = document.getElementById('married');

    this.tableRows = [
      {
        name: 'Taxable Income',
        id: 'taxable-income',
      },
      {
        name: 'Federal Income Tax',
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
        name: 'Federal Income Tax After Credits',
        id: 'federal-income-tax-after-credits',
      },
      {
        name: 'Employee Payroll Tax',
        id: 'employee-payroll-tax',
      },
      {
        name: 'Tax Burden',
        id: 'tax-burden',
      },
      {
        name: 'Employer Payroll Tax',
        id: 'employer-payroll-tax',
      },
      {
        name: 'Medicare Surtax',
        id: 'medicare-surtax',
      },
      {
        name: 'Tax Wedge',
        id: 'tax-wedge',
      },
    ];

    this.laws = taxLaws;

    for (var i = 0, j = app.tableRows.length; i < j; i++) {
      var row = document.createElement('tr');
      row.id = app.tableRows[i].id;
      row.className = 'tax-calculator-table__body-row';
      document.getElementById('tax-results-body').appendChild(row);
      var label = document.createElement('td');
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

  getBinaryStatus: function (children, married) {
    if (married) {
      return 'married';
    } else {
      return 'single';
    }
  },

  getTrinaryStatus: function (children, married) {
    if (married) {
      return 'married';
    } else if (children > 0) {
      return 'hoh';
    } else {
      return 'single';
    }
  },

  setEventListeners: function () {
    app.income1.addEventListener('change', app.calculate());
    app.income2.addEventListener('change', app.calculate());
    app.children.addEventListener('change', app.calculate());
    app.married.addEventListener('change', app.calculate());
  },

  calculate: function () {
    var income1 = isNaN(parseInt(app.income1.value)) ? 0 : parseInt(app.income1.value);
    var income2 = isNaN(parseInt(app.income2.value)) ? 0 : parseInt(app.income2.value);
    var children = isNaN(parseInt(app.children.value)) ? 0 : parseInt(app.children.value);
    var binaryStatus = app.getBinaryStatus(children, app.married.checked);
    var trinaryStatus = app.getTrinaryStatus(children, app.married.checked);

    for (var plan = 0, j = app.laws.length; plan < j; plan++) {
      var federalTaxableIncome = taxCalculator
        .getFederalTaxableIncome(
          income1,
          income2,
          children,
          trinaryStatus,
          app.laws[plan],
          0
        );
      var federalIncomeTax = taxCalculator
        .getFederalIncomeTax(
          federalTaxableIncome,
          trinaryStatus,
          app.laws[plan]
        );
      var childTaxCredit = taxCalculator
        .getFederalChildTaxCredit(
          income1,
          income2,
          children,
          binaryStatus,
          app.laws[plan]
        );
      var eitc = taxCalculator
        .getFederalEITC(
          income1,
          income2,
          children,
          binaryStatus,
          app.laws[plan]
        );
      var federalIncomeTaxAfterCredits = federalIncomeTax - childTaxCredit - eitc;
      var employeePayrollTax = taxCalculator
        .getFederalEmployeePayrollTax(income1, app.laws[plan]) +
        taxCalculator.getFederalEmployeePayrollTax(income2, app.laws[plan]);
      var taxBurden = federalIncomeTaxAfterCredits + employeePayrollTax;
      var employerPayrollTax = taxCalculator
        .getFederalEmployerPayrollTax(income1, app.laws[plan]) +
        taxCalculator.getFederalEmployerPayrollTax(income2, app.laws[plan]);
      var medicareSurtax = taxCalculator
        .getMedicareSurtax(income1, income2, binaryStatus, app.laws[plan]);
      var taxWedge = taxBurden + employerPayrollTax + medicareSurtax;

      document.getElementById(
          app.laws[plan].id +
          '-taxable-income'
        )
        .innerHTML = Math.round(federalTaxableIncome);
      document.getElementById(
          app.laws[plan].id +
          '-federal-income-tax'
        )
        .innerHTML = Math.round(federalIncomeTax);
      document.getElementById(
          app.laws[plan].id +
          '-ctc'
        )
        .innerHTML = Math.round(childTaxCredit);
      document.getElementById(
          app.laws[plan].id +
          '-eitc'
        )
        .innerHTML = Math.round(eitc);
      document.getElementById(
          app.laws[plan].id +
          '-federal-income-tax-after-credits'
        )
        .innerHTML = Math.round(federalIncomeTaxAfterCredits);
      document.getElementById(
          app.laws[plan].id +
          '-employee-payroll-tax'
        )
        .innerHTML = Math.round(employeePayrollTax);
      document.getElementById(
          app.laws[plan].id +
          '-tax-burden'
        )
        .innerHTML = Math.round(taxBurden);
      document.getElementById(
          app.laws[plan].id +
          '-employer-payroll-tax'
        )
        .innerHTML = Math.round(employerPayrollTax);
      document.getElementById(
          app.laws[plan].id +
          '-medicare-surtax'
        )
        .innerHTML = Math.round(medicareSurtax);
      document.getElementById(
          app.laws[plan].id +
          '-tax-wedge'
        )
        .innerHTML = Math.round(taxWedge);
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
      status,
      taxLaw,
      stateIncomeTax
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
            income - taxLaw.pepPease.threshold[status] / 2500
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

    if (stateIncomeTax > taxLaw.standardDeuction[status]) {
      if (income > taxLaw.pepPease.threshold[status]) {
        deduction = stateIncomeTax -
          (income - taxLaw.pepPease.threshold[status]) *
          0.02;
      } else {
        deduction = stateIncomeTax;
      }
    } else {
      deduction = taxLaw.standardDeuction[status];
    }

    taxableIncome = Math.max(0, income - deduction - exemption);

    return taxCalculator.roundToHundredths(taxableIncome);
  },

  getFederalIncomeTax: function (taxableIncome, status, taxLaw) {
    var income = taxableIncome;
    var federalIncomeTax = 0;

    // Loop through brackets backward for ease of calculation
    for (var i = taxLaw.brackets.length - 1, j = -1; i > j; i--) {
      if (income > taxLaw.brackets[i][status]) {
        federalIncomeTax = federalIncomeTax +
          ((income - taxLaw.brackets[i][status]) * taxLaw.brackets[i].rate);
        income = taxLaw.brackets[i][status];
      }
    }

    return taxCalculator.roundToHundredths(federalIncomeTax);
  },

  getFederalEITC: function (income1, income2, children, status, taxLaw) {
    var income = income1 + income2;
    var dependents = Math.min(3, children);
    var theEITC = taxLaw.eitc[dependents];
    var earnedIncomeTaxCredit = 0;

    if (income < theEITC.threshold) {
      earnedIncomeTaxCredit = income *
        (theEITC.maxIncome[status] / theEITC.threshold);
    } else if (income >= theEITC.threshold && income <= theEITC.phaseout[status]) {
      earnedIncomeTaxCredit = theEITC.maxIncome[status];
    } else if (income > theEITC.phaseout[status]) {
      earnedIncomeTaxCredit = Math.max(
        0,
        theEITC.max + (
          (theEITC.phaseout[status] - income) *
          (theEITC.max / (theEITC.maxIncome[status] - theEITC.phaseout[status]))
        )
      );
    }

    return taxCalculator.roundToHundredths(earnedIncomeTaxCredit);
  },

  getFederalChildTaxCredit: function (
      income1,
      income2,
      children,
      status,
      taxLaw
    ) {
    var income = income1 + income2;
    var childTaxCredit = 0;

    if (children > 0) {
      if (income <= taxLaw.ctc.phaseIn) {
        childTaxCredit = 0;
      } else if (income <= taxLaw.ctc.phaseout[status]) {
        childTaxCredit = Math.min(
          taxLaw.ctc.credit *
          children,
          (income - taxLaw.ctc.phaseIn) *
          taxLaw.ctc.phaseInRate
        );
      } else if (income > taxLaw.ctc.phaseout[status]) {
        childTaxCredit = Math.max(
          0,
          (taxLaw.ctc.credit * children) -
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

  getAlternativeMinimumTax: function (income1, income2, status, taxLaw) {
    if (taxLaw.amt) {
      var income = (income1 + income2) - Math.max(
        0,
        taxLaw.amt[status].exemption -
        Math.max(
          0,
          (income1 + income2) -
          taxLaw.amt[status].phaseout * 0.25
        )
      );
      var amt = 0;

      for (var i = taxLaw.amt.length - 1, j = -1; i > j; i--) {
        if (income > taxLaw.amt[i].income) {
          amt = amt +
            (
              (income - taxLaw.amt[i].income) * taxLaw.amt[i].rate
            );
          income = taxLaw.amt[i].income;
        }
      }

      return taxCalculator.roundToHundredths(amt);
    } else {
      return 0;
    }
  },
};

var taxLaws = [
  {
    name: 'Current Law',
    id: 'current',
    standardDeuction: {
      single: 6300,
      married: 12600,
      hoh: 9250,
    },
    personalExemption: 4000,
    brackets: [
      {
        rate: 0.1,
        single: 0,
        married: 0,
        hoh: 0,
      },
      {
        rate: 0.15,
        single: 9225,
        married: 18450,
        hoh: 13150,
      },
      {
        rate: 0.25,
        single: 37450,
        married: 74900,
        hoh: 50200,
      },
      {
        rate: 0.28,
        single: 90750,
        married: 151200,
        hoh: 129600,
      },
      {
        rate: 0.33,
        single: 189300,
        married: 230450,
        hoh: 209850,
      },
      {
        rate: 0.35,
        single: 411500,
        married: 411500,
        hoh: 411500,
      },
      {
        rate: 0.396,
        single: 413200,
        married: 464850,
        hoh: 439000,
      },
    ],
    eitc: {
      0: {
        max: 503,
        threshold: 6580,
        phaseout: {
          single: 8240,
          married: 13760,
        },
        maxIncome: {
          single: 14820,
          married: 20330,
        },
      },
      1: {
        max: 3359,
        threshold: 9880,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 39131,
          married: 44651,
        },
      },
      2: {
        max: 5548,
        threshold: 13870,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 44454,
          married: 49974,
        },
      },
      3: {
        max: 6242,
        threshold: 13870,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 47747,
          married: 53267,
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
      hoh: 9250,
    },
    personalExemption: 4000,
    brackets: [
      {
        rate: 0.1,
        single: 0,
        married: 0,
        hoh: 0,
      },
      {
        rate: 0.15,
        single: 9225,
        married: 18450,
        hoh: 13150,
      },
      {
        rate: 0.25,
        single: 37450,
        married: 74900,
        hoh: 50200,
      },
      {
        rate: 0.28,
        single: 90750,
        married: 151200,
        hoh: 129600,
      },
      {
        rate: 0.33,
        single: 189300,
        married: 230450,
        hoh: 209850,
      },
      {
        rate: 0.35,
        single: 411500,
        married: 411500,
        hoh: 411500,
      },
      {
        rate: 0.396,
        single: 413200,
        married: 464850,
        hoh: 439000,
      },
      {
        rate: 0.436,
        single: 5000000,
        married: 5000000,
        hoh: 5000000,
      },
    ],
    eitc: {
      0: {
        max: 503,
        threshold: 6580,
        phaseout: {
          single: 8240,
          married: 13760,
        },
        maxIncome: {
          single: 14820,
          married: 20330,
        },
      },
      1: {
        max: 3359,
        threshold: 9880,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 39131,
          married: 44651,
        },
      },
      2: {
        max: 5548,
        threshold: 13870,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 44454,
          married: 49974,
        },
      },
      3: {
        max: 6242,
        threshold: 13870,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 47747,
          married: 53267,
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
        hoh: 75000,
      },
    ],
    eitc: {
      0: {
        max: 503,
        threshold: 6580,
        phaseout: {
          single: 8240,
          married: 13760,
        },
        maxIncome: {
          single: 14820,
          married: 20330,
        },
      },
      1: {
        max: 3359,
        threshold: 9880,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 39131,
          married: 44651,
        },
      },
      2: {
        max: 5548,
        threshold: 13870,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 44454,
          married: 49974,
        },
      },
      3: {
        max: 6242,
        threshold: 13870,
        phaseout: {
          single: 18110,
          married: 23630,
        },
        maxIncome: {
          single: 47747,
          married: 53267,
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
