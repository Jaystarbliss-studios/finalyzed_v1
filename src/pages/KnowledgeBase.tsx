import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Book, GraduationCap, Building2, Filter, ChevronRight } from 'lucide-react';

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const institutions = [
    { name: 'University of Lagos', departments: 45, specs: 1240 },
    { name: 'Obafemi Awolowo University', departments: 38, specs: 980 },
    { name: 'Ahmadu Bello University', departments: 52, specs: 1450 },
    { name: 'University of Ibadan', departments: 41, specs: 1120 },
    { name: 'Covenant University', departments: 28, specs: 750 },
    { name: 'Babcock University', departments: 31, specs: 680 },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-16 pt-8">
        <span className="mono-label mb-4 inline-block">Institutional Requirements</span>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
          The Academic <span className="font-bold">Knowledge Base</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Search thousands of anonymized project specifications to discover the exact formatting, structural, and citation requirements for your department.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-16 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all text-lg shadow-sm"
          placeholder="Search for your university, faculty, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Stats/Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bento-card p-6 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl">142</h3>
            <p className="text-sm text-muted-foreground">Institutions Documented</p>
          </div>
        </div>
        <div className="bento-card p-6 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl">850+</h3>
            <p className="text-sm text-muted-foreground">Departments Mapped</p>
          </div>
        </div>
        <div className="bento-card p-6 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl">12,400+</h3>
            <p className="text-sm text-muted-foreground">Historical Specifications</p>
          </div>
        </div>
      </div>

      {/* Popular Institutions List */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light">Popular <span className="font-bold">Institutions</span></h2>
          <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            View All Directory <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((inst, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bento-card p-6 hover:bg-muted/30 transition-colors cursor-pointer group"
            >
              <h3 className="font-bold text-foreground mb-4 group-hover:text-primary transition-colors">{inst.name}</h3>
              <div className="flex justify-between text-sm text-muted-foreground border-t border-border pt-4">
                <span>{inst.departments} Departments</span>
                <span>{inst.specs} Specs Logged</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-16 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <p className="text-sm text-yellow-600/90 leading-relaxed text-center">
          <strong>Note on Data Privacy:</strong> The Finalyzed Knowledge Base is generated entirely from anonymized, aggregated project specifications submitted to the platform. We strictly separate and protect all private student information. These guidelines reflect historical patterns and should be cross-referenced with your official departmental handbook.
        </p>
      </div>
    </div>
  );
}
