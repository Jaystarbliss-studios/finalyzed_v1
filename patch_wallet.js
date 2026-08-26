import fs from 'fs';
let code = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');

const staticBalance = '<div className="text-5xl font-bold mb-8">₦24,500.00</div>';
const dynamicBalance = '<div className="text-5xl font-bold mb-8">₦{(userData?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>';
code = code.replace(staticBalance, dynamicBalance);

const staticPending = '<div className="text-3xl font-bold mb-4">₦10,000.00</div>';
const dynamicPending = '<div className="text-3xl font-bold mb-4">₦{(userData?.pendingClearance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>';
code = code.replace(staticPending, dynamicPending);

fs.writeFileSync('src/pages/Wallet.tsx', code);
console.log('patched wallet');
