var currentTaxes = {
  standardDeuction: {
    single: 6300,
    married: 12600,
    hoh: 9250,
  },
  personalExemption: 4000,
  brackets: [
    {
      rate: .1,
      single: 0,
      married: 0,
      hoh: 0
    },
    {
      rate: .15,
      single: 9225,
      married: 18450,
      hoh: 13150
    },
    {
      rate: .25,
      single: 37450,
      married: 74900,
      hoh: 50200
    },
    {
      rate: .28,
      single: 90750,
      married: 151200,
      hoh: 129600
    },
    {
      rate: .33,
      single: 189300,
      married: 230450,
      hoh: 209850
    },
    {
      rate: .35,
      single: 411500,
      married: 411500,
      hoh: 411500
    },
    {
      rate: .396,
      single: 413200,
      married: 464850,
      hoh: 439000
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
      }
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
      }
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
      }
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
      }
    }
  },
  employeePayroll: [
    {
      rate: .0765,
      income: 0
    },
    {
      rate: .0145,
      income: 118500
    }
  ],
  employerPayroll: [
    {
      rate: .0765,
      income: 0
    },
    {
      rate: .0145,
      income: 118500
    }
  ],
  medicareSurtax: {
    single: {
      rate: .009,
      income: 200000
    },
    married: {
      rate: .009,
      income: 250000
    }
  },
  unemploymentInsurance: {
    rate: .06,
    income: 7000
  },
  ctc: {
    credit: 1000,
    phaseIn: 3000,
    phaseInRate: .15,
    phaseout: {
      single: 75000,
      married: 110000
    },
    phaseoutRate: .05
  },
  pepPease: {
    threshold: {
      single: 258250,
      married: 309900,
      hoh: 284050
    },
    phaseoutRate: .02
  },
  amt: {
    brackets: [
      {
        rate: .26,
        income: 0
      },
      {
        rate: .28,
        income: 185400
      }
    ],
    single: {
      exemption: 53600,
      phaseout: 119200
    },
    married: {
      exemption: 83400,
      phaseout: 158900
    }
  }
}

var taxCalculator = {
  roundToHundredths: function (number) {
    return Math.round(number * 100) / 100;
  },

  getFederalTaxableIncome: function (income1, income2, children, status, taxLaw, stateIncomeTax) {
    var income = income1 + income2;
    var exemption = 0;
    var deduction = 0;
    var taxableIncome = 0;

    if (income > taxLaw.pepPease.threshold[status]) {
      exemption = Math.max(
        0, (
          1 - Math.ceil(income - taxLaw.pepPease.threshold[status] / 2500)
          * taxLaw.pepPease.phaseoutRate
        ) * (
          taxLaw.personalExemption * (1 + children + (status == 'married' ? 1 : 0))
        )
      );
    } else {
      exemption = taxLaw.personalExemption 
      * (1 + children + (status == 'married' ? 1 : 0));
    }

    if (stateIncomeTax > taxLaw.standardDeuction[status]) {
      if (income > taxLaw.pepPease.threshold[status]) {
        deduction = stateIncomeTax - (income - taxLaw.pepPease.threshold[status]) * .02;
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
        federalIncomeTax = federalIncomeTax
          + ((income - taxLaw.brackets[i][status]) * taxLaw.brackets[i].rate);
        income = taxLaw.brackets[i][status];
      }
    }

    return taxCalculator.roundToHundredths(federalIncomeTax);
  },

  // TODO Adjust to accomodate hoh status

  getFederalEITC: function (income1, income2, children, status, taxLaw) {
    var income = income1 + income2;
    var dependents = Math.min(3, children);
    var theEITC = taxLaw.eitc[dependents];
    var earnedIncomeTaxCredit = 0;


    if (income < theEITC.threshold) {
      earnedIncomeTaxCredit = income 
        * (theEITC.maxIncome[status] / theEITC.threshold);
    } else if (income >= theEITC.threshold && income <= theEITC.phaseout[status]) {
      earnedIncomeTaxCredit = theEITC.maxIncome[status]
    } else if (income > theEITC.phaseout[status]) {
      earnedIncomeTaxCredit = Math.max(
        0,
        theEITC.max + (
          (theEITC.phaseout[status] - income)
          * (theEITC.max / (theEITC.maxIncome[status] - theEITC.phaseout[status]))
        )
      );
    }

    return earnedIncomeTaxCredit;
  },

  getFederalChildTaxCredit: function (income1, income2, children, status, taxLaw) {
    var income = income1 + income2;
    var childTaxCredit = 0;

    if (children > 0) {
      if (income <= taxLaw.ctc.phaseIn) {
        childTaxCredit = 0;
      } else if (income <= taxLaw.ctc.phaseout[status]) {
        childTaxCredit = Math.min(
          taxLaw.ctc.credit * children, (income - taxLaw.ctc.phaseIn) * taxLaw.ctc.phaseInRate
        );
      } else if (income > taxLaw.ctc.phaseout[status]) {
        childTaxCredit = Math.max(
          0,
          (taxLaw.ctc.credit * children)
          - (Math.ceil((income - taxLaw.ctc.phaseout[status]) * .001) * 1000) * taxLaw.ctc.phaseoutRate
        );
      }
    }

    return childTaxCredit;
  },

  getFederalEmployeePayrollTax: function (indIncome, taxLaw) {
    var income = indIncome;
    var employeePayrollTax = 0;

    for (var i = taxLaw.employeePayroll.length - 1, j = -1; i > j; i--) {
      if (income > taxLaw.employeePayroll[i].income) {
        employeePayrollTax = employeePayrollTax
          + ((income - taxLaw.employeePayroll[i].income) * taxLaw.employeePayroll[i].rate);
        income = taxLaw.employeePayroll[i].income;
      }
    }

    return employeePayrollTax;
  },

  getFederalEmployerPayrollTax: function (indIncome, taxLaw) {
    var income = indIncome;
    var employerPayrollTax = 0;

    for (var i = taxLaw.employerPayroll.length - 1, j = -1; i > j; i--) {
      if (income > taxLaw.employerPayroll[i].income) {
        employerPayrollTax = employerPayrollTax
          + ((income - taxLaw.employerPayroll[i].income) * taxLaw.employerPayroll[i].rate);
        income = taxLaw.employerPayroll[i].income;
      }
    }

    return employerPayrollTax;
  },

  getMedicareSurtax: function (income1, income2, status, taxLaw) {
    var income = income1 + income2;
    var medicareSurtax = 0;



    return medicareSurtax;
  }
}