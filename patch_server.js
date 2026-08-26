import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

// Fix firebase admin imports for the modular SDK structure
code = code.replace(
  'import * as admin from "firebase-admin";',
  'import * as admin from "firebase-admin";\nimport { getFirestore, FieldValue } from "firebase-admin/firestore";\nimport { cert } from "firebase-admin/app";'
);

code = code.replace(
  'credential: admin.credential.cert(serviceAccount)',
  'credential: cert(serviceAccount)'
);

code = code.replace(
  'const db = adminApp.firestore();',
  'const db = getFirestore(adminApp);'
);

code = code.replace(
  'updatedAt: admin.firestore.FieldValue.serverTimestamp()',
  'updatedAt: FieldValue.serverTimestamp()'
);

code = code.replace(
  'createdAt: admin.firestore.FieldValue.serverTimestamp()',
  'createdAt: FieldValue.serverTimestamp()'
);

fs.writeFileSync('server.ts', code);
console.log('patched server.ts firebase admin imports');
