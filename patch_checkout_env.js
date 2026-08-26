import fs from 'fs';
let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

// Use Vite's typed import.meta.env by casting or creating a vite-env.d.ts file.
// Since it's a TS error but builds fine, we can add a simple ts-ignore or cast.
code = code.replace(
  "publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',",
  "publicKey: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',"
);

fs.writeFileSync('src/pages/Checkout.tsx', code);
console.log('patched checkout import meta');
