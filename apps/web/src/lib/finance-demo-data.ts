export const demoFinance = {
  id: "fin-1",
  fullName: "Sahra Warsame",
  email: "finance@qalinraac.local",
  role: "Finance" as const,
  avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sahra",
  phone: "+252 61 444 5555",
  bio: "Finance control for Qalinraac Academy.",
  registeredAt: "2025-09-01T00:00:00.000Z",
};

export const demoFinanceStats = {
  totalRevenue: 84250,
  totalExpenses: 21340,
  netProfit: 62910,
  pendingWithdrawals: 3,
  totalInstructorPayments: 28600,
  activeShareholders: 4,
};

export const demoRevenueOverview = {
  today: 860,
  weekly: 5240,
  monthly: 18420,
  annual: 84250,
  courseSales: 78100,
  manualIncome: 6150,
};

export const demoExpenseOverview = {
  today: 120,
  monthly: 4100,
  annual: 21340,
};

export const demoFinanceRevenue = [
  {
    id: "r1",
    student: "Amina Yusuf",
    course: "Full Stack Software Engineer + AI",
    instructor: "Mohamud Osman",
    amount: 120,
    paymentMethod: "Stripe",
    paymentGateway: "Stripe",
    date: "08 Sep 2026",
    source: "Course Sales" as const,
  },
  {
    id: "r2",
    student: "Hassan Ali",
    course: "Full Stack Software Engineer + AI",
    instructor: "Mohamud Osman",
    amount: 120,
    paymentMethod: "Waafi",
    paymentGateway: "Waafi",
    date: "07 Sep 2026",
    source: "Course Sales" as const,
  },
  {
    id: "r3",
    student: "Nura Farah",
    course: "UI Systems for Product Teams",
    instructor: "Hodan Abdi",
    amount: 90,
    paymentMethod: "Stripe",
    paymentGateway: "Stripe",
    date: "06 Sep 2026",
    source: "Course Sales" as const,
  },
  {
    id: "r4",
    student: "—",
    course: "Manual Income",
    instructor: "—",
    amount: 500,
    paymentMethod: "Bank Transfer",
    paymentGateway: "Manual",
    date: "05 Sep 2026",
    source: "Manual Income" as const,
  },
  {
    id: "r5",
    student: "Omar Guled",
    course: "Brand Identity Foundations",
    instructor: "Hodan Abdi",
    amount: 90,
    paymentMethod: "Waafi",
    paymentGateway: "Waafi",
    date: "04 Sep 2026",
    source: "Course Sales" as const,
  },
];

export const demoFinanceExpenses = [
  {
    id: "e1",
    title: "Cloud hosting",
    description: "Monthly R2 + compute",
    amount: 420,
    date: "01 Sep 2026",
    createdBy: "Sahra Warsame",
  },
  {
    id: "e2",
    title: "Marketing ads",
    description: "Meta + Google ads",
    amount: 980,
    date: "28 Aug 2026",
    createdBy: "Sahra Warsame",
  },
  {
    id: "e3",
    title: "Office supplies",
    description: "Print & stationery",
    amount: 75,
    date: "20 Aug 2026",
    createdBy: "Sahra Warsame",
  },
];

export const demoInstructorPayments = [
  {
    id: "ip1",
    instructor: "Mohamud Osman",
    totalEarnings: 12600,
    availableBalance: 1260,
    pendingBalance: 400,
    totalWithdrawn: 10940,
  },
  {
    id: "ip2",
    instructor: "Hodan Abdi",
    totalEarnings: 8400,
    availableBalance: 920,
    pendingBalance: 0,
    totalWithdrawn: 7480,
  },
  {
    id: "ip3",
    instructor: "Yasin Noor",
    totalEarnings: 2100,
    availableBalance: 210,
    pendingBalance: 150,
    totalWithdrawn: 1740,
  },
];

export const demoFinanceWithdrawals = [
  {
    id: "fw1",
    instructor: "Mohamud Osman",
    amount: 400,
    paymentMethod: "Waafi",
    accountDetails: "61xxxxxxx",
    requestDate: "01 Sep 2026",
    status: "Pending",
    availableBalance: 1260,
    previousWithdrawals: 2,
  },
  {
    id: "fw2",
    instructor: "Yasin Noor",
    amount: 150,
    paymentMethod: "Bank Transfer",
    accountDetails: "****4521",
    requestDate: "03 Sep 2026",
    status: "Pending",
    availableBalance: 210,
    previousWithdrawals: 1,
  },
  {
    id: "fw3",
    instructor: "Hodan Abdi",
    amount: 300,
    paymentMethod: "Stripe",
    accountDetails: "acct_****88",
    requestDate: "20 Aug 2026",
    status: "Completed",
    availableBalance: 920,
    previousWithdrawals: 4,
  },
  {
    id: "fw4",
    instructor: "Mohamud Osman",
    amount: 200,
    paymentMethod: "Waafi",
    accountDetails: "61xxxxxxx",
    requestDate: "10 Jul 2026",
    status: "Rejected",
    availableBalance: 1260,
    previousWithdrawals: 2,
    rejectionReason: "Account details incomplete",
  },
];

export const demoShareholders = [
  {
    id: "sh1",
    name: "Abdirizak Holdings",
    sharePercent: 40,
    currentProfit: 25164,
    distributionStatus: "Distributed",
  },
  {
    id: "sh2",
    name: "Qalinraac Trust",
    sharePercent: 30,
    currentProfit: 18873,
    distributionStatus: "Pending",
  },
  {
    id: "sh3",
    name: "Education Partners LLC",
    sharePercent: 20,
    currentProfit: 12582,
    distributionStatus: "Distributed",
  },
  {
    id: "sh4",
    name: "Community Fund",
    sharePercent: 10,
    currentProfit: 6291,
    distributionStatus: "Pending",
  },
];

export const demoFinanceChart = [
  { label: "Revenue", value: 84250 },
  { label: "Expenses", value: 21340 },
  { label: "Net Profit", value: 62910 },
  { label: "Instructor Share", value: 28600 },
  { label: "Platform Share", value: 34310 },
];

export const demoFinanceNotifications = [
  {
    id: "fn1",
    actor: "Withdrawals",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Withdraw",
    message: "💸 New Withdrawal Request — Mohamud Osman requested $400 via Waafi.",
    time: "about 3 hours ago",
    read: false,
  },
  {
    id: "fn2",
    actor: "Revenue",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Revenue",
    message: "🛒 New Course Purchase — Amina Yusuf paid $120 for Full Stack + AI.",
    time: "about 6 hours ago",
    read: false,
  },
  {
    id: "fn3",
    actor: "Expenses",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Expense",
    message: "🧾 New Expense — Cloud hosting $420 recorded.",
    time: "about 1 day ago",
    read: true,
  },
];

export const demoFinanceReports = {
  revenue: { daily: 860, weekly: 5240, monthly: 18420, annual: 84250 },
  expenses: { daily: 120, monthly: 4100, annual: 21340 },
  profit: { revenue: 84250, expenses: 21340, net: 62910 },
};
