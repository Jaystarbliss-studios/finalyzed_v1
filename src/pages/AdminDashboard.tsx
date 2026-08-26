import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Users, TrendingUp, DollarSign, Activity, FileText, CheckCircle, Search, MoreVertical, Edit2, Ban, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

const revenueData = [
  { name: 'Mon', revenue: 4000, points: 2400 },
  { name: 'Tue', revenue: 3000, points: 1398 },
  { name: 'Wed', revenue: 2000, points: 9800 },
  { name: 'Thu', revenue: 2780, points: 3908 },
  { name: 'Fri', revenue: 1890, points: 4800 },
  { name: 'Sat', revenue: 2390, points: 3800 },
  { name: 'Sun', revenue: 3490, points: 4300 },
];

const roleData = [
  { name: 'Students', value: 400 },
  { name: 'Specialists', value: 300 },
  { name: 'Editors', value: 100 },
];

const COLORS = ['#337179', '#FAFAFA', '#9CA3AF'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <div className="flex flex-col">
          <span className="mono-label flex items-center gap-2 text-red-500">
            <ShieldAlert className="w-4 h-4" /> Super Admin Portal
          </span>
          <h1 className="text-3xl font-light tracking-tight mt-2">
            WELCOME, <span className="font-bold">ADMINISTRATOR</span>
          </h1>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="flex items-center gap-4 border-b border-border pb-px overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'User Management' },
          { id: 'projects', label: 'Active Projects' },
          { id: 'disputes', label: 'Disputes' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-primary text-foreground' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bento-card p-6">
              <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Total Revenue
              </div>
              <div className="text-3xl font-bold text-foreground">₦2.4M</div>
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +14% from last month
              </div>
            </div>
            
            <div className="bento-card p-6">
              <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Users
              </div>
              <div className="text-3xl font-bold text-foreground">843</div>
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +42 new this week
              </div>
            </div>

            <div className="bento-card p-6">
              <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Active Projects
              </div>
              <div className="text-3xl font-bold text-foreground">156</div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                42 in review
              </div>
            </div>

            <div className="bento-card p-6 border-primary/20 bg-primary/5">
              <div className="text-primary text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Finalyzed Points
              </div>
              <div className="text-3xl font-bold text-primary">124.5K</div>
              <div className="mt-2 text-xs text-primary/80">Active in circulation</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bento-card p-6">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Platform Revenue & Point Flow
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#337179" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#337179" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FAFAFA" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FAFAFA" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#337179" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="points" stroke="#FAFAFA" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bento-card p-6 flex flex-col">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> User Distribution
              </h3>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
          <div className="bento-card p-0 overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold">User Directory</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search users..." className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Alice Johnson', email: 'alice@example.com', role: 'student', status: 'active', date: 'Aug 24, 2026' },
                    { name: 'Dr. Sarah Jenkins', email: 's.jenkins@example.com', role: 'specialist', status: 'verified', date: 'Aug 20, 2026' },
                    { name: 'Prof. David Chen', email: 'd.chen@example.com', role: 'editor', status: 'pending_verification', date: 'Aug 25, 2026' },
                  ].map((usr, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{usr.name}</div>
                        <div className="text-muted-foreground text-xs">{usr.email}</div>
                      </td>
                      <td className="px-6 py-4 capitalize">{usr.role}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          usr.status === 'verified' ? 'bg-primary/10 text-primary border border-primary/20' :
                          usr.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        }`}>
                          {usr.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{usr.date}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'projects' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
          <div className="bento-card p-0 overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold">Platform Projects</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search projects by ID..." className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Project ID</th>
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Specialist</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { id: 'FYZ-00124', title: 'Smart Attendance System', student: 'Alice Johnson', specialist: 'Dr. Sarah Jenkins', status: 'editor_reviewing', value: '₦45,000' },
                    { id: 'FYZ-00125', title: 'Banking Fraud Study', student: 'Michael O.', specialist: 'Unassigned', status: 'payment_confirmed', value: '₦32,500' },
                  ].map((proj, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-muted-foreground">{proj.id}</td>
                      <td className="px-6 py-4 font-medium">{proj.title}</td>
                      <td className="px-6 py-4">{proj.student}</td>
                      <td className="px-6 py-4">{proj.specialist}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted border border-border">
                          {proj.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{proj.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'disputes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
          <div className="bento-card p-8 text-center text-muted-foreground">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-foreground mb-2">No Active Disputes</h3>
            <p className="text-sm">All projects are progressing normally. Disputes raised by students will appear here for arbitration.</p>
          </div>
        </motion.div>
      )}

    </div>
  );
}
