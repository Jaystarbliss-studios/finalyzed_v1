import fs from 'fs';
let code = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');

const importStr = "import { Search, Filter, Star, Clock, CheckCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';";
const newImportStr = "import { Search, Filter, Star, Clock, CheckCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';\nimport { db } from '../lib/firebase';\nimport { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';";
code = code.replace(importStr, newImportStr);

const fetchCode = `    // Fetch from our local full-stack API
    fetch('/api/specialists')
      .then(res => res.json())
      .then(data => {
        setSpecialists(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch specialists:", err);
        setLoading(false);
      });`;

const newFetchCode = `    const fetchSpecialists = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'specialist'), where('status', '==', 'ACTIVE'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // Seed initial mock specialists if database is empty
          const mockSpecialists = [
            {
              id: "sp-1",
              name: "Dr. Jane Doe",
              role: "specialist",
              status: "ACTIVE",
              isVerified: true,
              rating: 4.9,
              reviews: 127,
              completedProjects: 94,
              averageDeliveryDays: 3.8,
              approvalRate: 98,
              specialistProfile: {
                bio: "Expert in computer science and algorithms.",
                institution: "University of Tech",
              },
              specialties: ["Computer Science", "Software Engineering", "IT"],
              imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60"
            },
            {
              id: "sp-2",
              name: "Samuel O.",
              role: "specialist",
              status: "ACTIVE",
              isVerified: true,
              rating: 4.8,
              reviews: 86,
              completedProjects: 112,
              averageDeliveryDays: 4.1,
              approvalRate: 96,
              specialties: ["Business Administration", "Accounting", "Finance"],
              imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&auto=format&fit=crop&q=60"
            },
            {
              id: "sp-3",
              name: "Dr. A. Rahman",
              role: "specialist",
              status: "ACTIVE",
              isVerified: true,
              rating: 5.0,
              reviews: 42,
              completedProjects: 45,
              averageDeliveryDays: 5.2,
              approvalRate: 99,
              specialties: ["Civil Engineering", "Architecture", "Project Management"],
              imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60"
            }
          ];
          
          const seededData = [];
          for (const sp of mockSpecialists) {
            await setDoc(doc(db, 'users', sp.id), sp);
            seededData.push(sp);
          }
          setSpecialists(seededData);
        } else {
          const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          setSpecialists(fetchedData);
        }
      } catch (err) {
        console.error("Failed to fetch specialists:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialists();`;
code = code.replace(fetchCode, newFetchCode);

fs.writeFileSync('src/pages/Marketplace.tsx', code);
console.log('patched marketplace');
