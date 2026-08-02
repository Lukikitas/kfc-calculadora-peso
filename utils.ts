
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'No especificada';
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString; // Fallback
  }
};

export const getTodayDateString = (): string => new Date().toISOString().split('T')[0];

export const createMatchKey = (name: string): string => {
    if (!name) return '';
    let key = name.toLowerCase();

    // 1. Normalize sugar-free variants (s/azucar, cero, sin azucar)
    const sugarFreeRegex = /\bs\/\s*azucar\b|\bcero\b|\bsin\s*azucar\b/g;
    let isSugarFree = false;
    if (key.match(sugarFreeRegex)) {
        isSugarFree = true;
        key = key.replace(sugarFreeRegex, ' '); 
    }

    // 2. Remove specific packaging/unit descriptions and noise
    const patternsToRemove = [
        /x\s*500\s*ml\s*x\s*8\s*un/g,
        /500\s*ml\s*x\s*8\s*un/g,
        /packx\d+/g,
        /bibx\d+l/g,
        /cajax\d+/g,
        /\(\s*10l\s*\)/g,
        /\b10litros\s*rl\b/g,
        /\b10l\s*rl\b/g,
        /x\s*12\s*un\s*rl\b/g,
        /\b\d+\s*litros\b/g, /\b\d+\s*lts\b/g, /\b\d+\s*lt\b/g, /\b\d+l\b/g,
        /\b\d+\s*ml\b/g, /\b\d+\s*kg\b/g, /\b\d+\s*gr\b/g, /\b\d+\s*g\b/g,
        /\b\d+\s*un\b/g,
        /\b(botella|jarabe|rl|un|sabor)\b/g,
    ];
    for (const pattern of patternsToRemove) {
        key = key.replace(pattern, ' ');
    }

    // 3. Standardize base product names
    key = key.replace(/\bcoca\s*cola\b|\bcoca\b/g, 'cocacola');
    key = key.replace(/\bsprite\b/g, 'sprite');
    key = key.replace(/\bfanta\b/g, 'fanta');
    key = key.replace(/\bagua\s*(sin\s*gas)?\b|\bagua\b/g, 'agua');
    key = key.replace(/\baquarius\s*(manzana|pomelo|pera)\b/g, (match, p1) => `aquarius${p1}`);
    
    // 4. Remove extra spaces and non-alphanumeric chars
    key = key.replace(/[^a-z0-9_]/gi, '');
    key = key.trim();

    // 5. Append "cero" if sugar-free and applicable base product
    const productsWithZeroVariant = ['cocacola', 'sprite', 'fanta'];
    if (isSugarFree) {
        const baseName = productsWithZeroVariant.find(p => key.startsWith(p));
        if (baseName) {
            if (!key.endsWith('cero') && key === baseName) {
                 key = baseName + 'cero';
            }
        }
    }
    return key;
};
