export function isValidStringAdvanced(value: string | null | undefined): boolean {
  if (value == null) return false;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  const invalidValues = ['', 'null', 'undefined', 'n/a', 'tbd', 'todo'];
  if (invalidValues.includes(trimmed.toLowerCase())) return false;
  if (!/[a-zA-Z0-9]/.test(trimmed)) return false;
  return true;
}

export function parseCurrencyAdvanced(input: string | number | null | undefined): number | false {
  if (input == null) return false;
  
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? false : input;
  }
  
  let str = String(input).trim().toLowerCase();
  if (str === '') return false;

  str = str.replace(/\b(dollars?|euros?|pounds?|rupees?|coins?)\b/gi, '');
  
  str = str.replace(/[$€£¥₹₿¢]/g, '');
  str = str.replace(/\b(usd|eur|gbp|inr|jpy|btc|eth|usdc|dai|usdt)\b/gi, '');
  
  const writtenPattern = /(\d+(?:\.\d+)?)\s+(thousand|million|billion|trillion)/;
  const writtenMatch = str.match(writtenPattern);
  
  if (writtenMatch) {
    const baseNumber = parseFloat(writtenMatch[1]);
    const multiplierWord = writtenMatch[2];
    
    const multipliers: Record<string, number> = {
      'thousand': 1_000,
      'million': 1_000_000,
      'billion': 1_000_000_000,
      'trillion': 1_000_000_000_000
    };
    
    const multiplier = multipliers[multiplierWord];
    if (multiplier && !isNaN(baseNumber)) {
      return baseNumber * multiplier;
    }
  }
  
  let multiplier = 1;
  const suffixMatch = str.match(/(.*?)([kmbtg])\s*$/);
  
  if (suffixMatch) {
    str = suffixMatch[1];
    const suffix = suffixMatch[2];
    
    const multipliers: Record<string, number> = {
      'k': 1_000,
      'm': 1_000_000,
      'b': 1_000_000_000,
      't': 1_000_000_000_000,
      'g': 1_000_000_000
    };
    
    multiplier = multipliers[suffix] || 1;
  }
  
  str = str.replace(/[\s,_]/g, '');
  
  if (!/^-?\d*\.?\d+$/.test(str)) return false;
  
  const num = parseFloat(str);
  if (isNaN(num) || !isFinite(num)) return false;
  
  return num * multiplier;
}

export function isISO8601(dateString: string | null | undefined): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
  
  if (!iso8601Regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

export function isISO8601Flexible(dateString: string | null | undefined): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const iso8601Patterns = [
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/,
    /^\d{4}-\d{2}-\d{2}$/
  ];
  
  const matchesPattern = iso8601Patterns.some(pattern => pattern.test(dateString));
  if (!matchesPattern) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function manualParsingArray(input: string){
    return input
  .slice(1, -1) 
  .split(/,\s*\n\s*/)
  .map(item => item.trim().replace(/^'|'$/g, ''))
  .filter(item => item); 
}