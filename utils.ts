
export const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

export const formatDate = (date: string) => { 
    if(!date) return ''; 
    const d = new Date(date); 
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`; 
};

export const toTitleCase = (str: string) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const parseAmount = (val: string) => val ? parseInt(val.replace(/\./g,''), 10) : 0;

export const handleAmountInput = (val: string, setter: (v: string) => void) => { 
    const raw = val.replace(/\D/g,''); 
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
