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
  eitc: [
    {
      children: 0,
      max: 503,
      threshold: 6580,
      phaseoutSingle: 8240,
      phaseoutMarried: 13760,
      maxIncomeSingle: 14820,
      maxIncomeMarried: 20330
    },
    {
      children: 1,
      max: 3359,
      threshold: 9880,
      phaseoutSingle: 18110,
      phaseoutMarried: 23630,
      maxIncomeSingle: 39131,
      maxIncomeMarried: 44651,
    },
    {
      children: 2,
      max: 5548,
      threshold: 13870,
      phaseoutSingle: 18110,
      phaseoutMarried: 23630,
      maxIncomeSingle: 44454,
      maxIncomeMarried: 49974
    },
    {
      children: 3,
      max: 6242,
      threshold: 13870,
      phaseoutSingle: 18110,
      phaseoutMarried: 23630,
      maxIncomeSingle: 47747,
      maxIncomeMarried: 53267
    }
  ],
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
    phaseoutSingle: 75000,
    phaseoutMarried: 110000,
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
  getFederalTaxableIncome: function (income1, income2, children, status, taxLaw, stateIncomeTax) {
    var income = income1 + income2;
    var exemption = 0;
    var deduction = 0;
    var taxableIncome = 0;

    if (income > taxLaw.pepPease.threshold[status]) {
      exemption = Math.max(
        0, (
          1
          - Math.ceil(income - taxLaw.pepPease.threshold[status] / 2500)
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

    return taxableIncome;
  },

  getFederalIncomeTax: function (taxableIncome, status) {
    
  }
}