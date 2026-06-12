export function trimf(x, a, b, c) {
  const left = a !== b ? (x - a) / (b - a) : x >= a ? 1.0 : 0.0;
  const right = b !== c ? (c - x) / (c - b) : x <= c ? 1.0 : 0.0;
  return Math.max(0, Math.min(left, right, 1));
}

export function trapmf(x, a, b, c, d) {
  const left = a !== b ? (x - a) / (b - a) : x >= a ? 1.0 : 0.0;
  const right = c !== d ? (d - x) / (d - c) : x <= d ? 1.0 : 0.0;
  return Math.max(0, Math.min(left, right, 1));
}

export function fuzzifyAge(age) {
  return {
    young: trapmf(age, 0, 0, 25, 35),
    middle: trimf(age, 30, 45, 60),
    old: trapmf(age, 55, 65, 100, 100),
  };
}

export function fuzzifyBMI(bmi) {
  return {
    underweight: trapmf(bmi, 0, 0, 18.5, 22),
    normal: trimf(bmi, 18.5, 22.5, 25),
    overweight: trimf(bmi, 23, 27.5, 30),
    obese: trapmf(bmi, 28, 32, 100, 100),
  };
}

export function fuzzifyHbA1c(hba1c) {
  return {
    normal: trapmf(hba1c, 0, 0, 5.6, 6.0),
    prediab: trimf(hba1c, 5.7, 6.2, 6.5),
    diabetic: trapmf(hba1c, 6.3, 6.8, 20, 20),
  };
}

export function fuzzifyGlucose(glucose) {
  return {
    low: trapmf(glucose, 0, 0, 100, 115),
    normal: trimf(glucose, 100, 130, 160),
    high: trimf(glucose, 155, 200, 245),
    very_high: trapmf(glucose, 240, 270, 400, 400),
  };
}

export function fuzzifyHypertension(hyp) {
  return {
    no: 1.0 - Number(hyp),
    yes: Number(hyp),
  };
}

export function fuzzifyHeart(hd) {
  return {
    no: 1.0 - Number(hd),
    yes: Number(hd),
  };
}

export function applyRules(age_mf, bmi_mf, hba1c_mf, gluc_mf, hyp_mf, hd_mf) {
  const rules = [];

  // HIGH RISK
  rules.push({ strength: Math.min(age_mf.old, hba1c_mf.diabetic, gluc_mf.very_high), label: 'high' });
  rules.push({ strength: Math.min(hba1c_mf.diabetic, gluc_mf.very_high), label: 'high' });
  rules.push({ strength: Math.min(age_mf.old, bmi_mf.obese, hyp_mf.yes), label: 'high' });
  rules.push({ strength: Math.min(hba1c_mf.diabetic, bmi_mf.obese), label: 'high' });
  rules.push({ strength: Math.min(hba1c_mf.diabetic, gluc_mf.high), label: 'high' });
  rules.push({ strength: Math.min(bmi_mf.obese, hd_mf.yes, hyp_mf.yes), label: 'high' });

  // MEDIUM RISK
  rules.push({ strength: Math.min(age_mf.middle, hba1c_mf.prediab, bmi_mf.overweight), label: 'medium' });
  rules.push({ strength: Math.min(hba1c_mf.prediab, gluc_mf.high), label: 'medium' });
  rules.push({ strength: Math.min(bmi_mf.overweight, hyp_mf.yes), label: 'medium' });
  rules.push({ strength: Math.min(age_mf.old, hba1c_mf.prediab), label: 'medium' });
  rules.push({ strength: Math.min(gluc_mf.high, hd_mf.yes), label: 'medium' });
  rules.push({ strength: Math.min(bmi_mf.obese, hba1c_mf.normal), label: 'medium' });

  // LOW RISK
  rules.push({ strength: Math.min(age_mf.young, bmi_mf.normal, hba1c_mf.normal), label: 'low' });
  rules.push({ strength: Math.min(age_mf.young, bmi_mf.underweight), label: 'low' });
  rules.push({ strength: Math.min(bmi_mf.underweight, hba1c_mf.normal, gluc_mf.normal), label: 'low' });
  rules.push({ strength: Math.min(age_mf.young, hba1c_mf.normal, gluc_mf.normal, hyp_mf.no), label: 'low' });
  rules.push({ strength: Math.min(age_mf.middle, bmi_mf.normal, hba1c_mf.normal), label: 'low' });
  rules.push({ strength: Math.min(gluc_mf.normal, hba1c_mf.normal, hd_mf.no, hyp_mf.no), label: 'low' });

  return rules;
}

const SUGENO_SINGLETONS = {
  low: 0.15,
  medium: 0.50,
  high: 0.85,
};

export function sugenoDefuzz(rules) {
  let numerator = 0.0;
  let denominator = 0.0;

  for (const rule of rules) {
    const z_i = SUGENO_SINGLETONS[rule.label];
    numerator += rule.strength * z_i;
    denominator += rule.strength;
  }

  if (denominator === 0) {
    return 0.5;
  }
  return numerator / denominator;
}

export function mamdaniDefuzz(rules) {
  // Discretize output space [0, 1] into 200 points
  const points = 200;
  const agg = new Array(points).fill(0);
  
  const out_low = (v) => trapmf(v, 0, 0, 0.3, 0.45);
  const out_medium = (v) => trimf(v, 0.35, 0.5, 0.65);
  const out_high = (v) => trapmf(v, 0.55, 0.7, 1.0, 1.0);

  for (const rule of rules) {
    if (rule.strength === 0) continue;
    
    for (let i = 0; i < points; i++) {
      const v = i / (points - 1);
      let mfVal = 0;
      if (rule.label === 'low') mfVal = out_low(v);
      else if (rule.label === 'medium') mfVal = out_medium(v);
      else if (rule.label === 'high') mfVal = out_high(v);
      
      const val = Math.min(rule.strength, mfVal);
      agg[i] = Math.max(agg[i], val);
    }
  }

  let sumNumerator = 0;
  let sumDenominator = 0;

  for (let i = 0; i < points; i++) {
    const v = i / (points - 1);
    sumNumerator += v * agg[i];
    sumDenominator += agg[i];
  }

  if (sumDenominator === 0) {
    return 0.5;
  }
  return sumNumerator / sumDenominator;
}

export function predictDiabetes(age, bmi, hba1c, glucose, hypertension, heart_disease) {
  const age_mf = fuzzifyAge(age);
  const bmi_mf = fuzzifyBMI(bmi);
  const hba1c_mf = fuzzifyHbA1c(hba1c);
  const gluc_mf = fuzzifyGlucose(glucose);
  const hyp_mf = fuzzifyHypertension(hypertension);
  const hd_mf = fuzzifyHeart(heart_disease);

  const rules = applyRules(age_mf, bmi_mf, hba1c_mf, gluc_mf, hyp_mf, hd_mf);

  const sugenoScore = sugenoDefuzz(rules);
  const mamdaniScore = mamdaniDefuzz(rules);

  return {
    sugenoScore,
    mamdaniScore,
    classification: mamdaniScore >= 0.5 ? 'High Risk' : mamdaniScore >= 0.3 ? 'Medium Risk' : 'Low Risk'
  };
}
