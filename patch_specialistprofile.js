import fs from 'fs';
let code = fs.readFileSync('src/pages/SpecialistProfile.tsx', 'utf8');

const importStr = "import { ArrowLeft, ArrowRight, Star, ShieldCheck, CheckCircle, Clock, BookOpen, ChevronRight } from 'lucide-react';";
const newImportStr = "import { ArrowLeft, ArrowRight, Star, ShieldCheck, CheckCircle, Clock, BookOpen, ChevronRight } from 'lucide-react';\nimport { db } from '../lib/firebase';\nimport { doc, getDoc } from 'firebase/firestore';";
code = code.replace(importStr, newImportStr);

const fetchCode = `    fetch('/api/specialists')
      .then(res => res.json())
      .then((data: Specialist[]) => {
        const found = data.find(s => s.id === id);
        setSpecialist(found || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch specialist:", err);
        setLoading(false);
      });`;

const newFetchCode = `    const fetchSpecialist = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSpecialist({ id: docSnap.id, ...docSnap.data() } as any);
        } else {
          setSpecialist(null);
        }
      } catch (err) {
        console.error("Failed to fetch specialist:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialist();`;
code = code.replace(fetchCode, newFetchCode);

fs.writeFileSync('src/pages/SpecialistProfile.tsx', code);
console.log('patched specialist profile');
