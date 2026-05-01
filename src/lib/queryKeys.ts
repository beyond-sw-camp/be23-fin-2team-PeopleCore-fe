export const queryKeys = {
  vacation: {
    all: ['vacation'] as const,
    adminPeriod: (params: { startDate: string; endDate: string }) =>
      ['vacation', 'adminPeriod', params] as const,
    dashboardDepartments: (year: number) =>
      ['vacation', 'dashboard', 'departments', year] as const,
    dashboardMembers: (deptId: number, year: number) =>
      ['vacation', 'dashboard', 'members', deptId, year] as const,
    promotionNotices: (params: { year: number; page: number; size: number }) =>
      ['vacation', 'promotionNotices', params] as const,
    adminAdjustmentHistory: (empId: number, year: number) =>
      ['vacation', 'admin', 'adjustmentHistory', empId, year] as const,
    adminUseRequests: (params?: Record<string, unknown>) =>
      ['vacation', 'admin', 'useRequests', params ?? {}] as const,
    adminGrantRequests: (params?: Record<string, unknown>) =>
      ['vacation', 'admin', 'grantRequests', params ?? {}] as const,
    myBalance: (year: number) => ['vacation', 'my', 'balance', year] as const,
    myUpcoming: () => ['vacation', 'my', 'upcoming'] as const,
    myPast: (params: { page: number; size: number }) =>
      ['vacation', 'my', 'past', params] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    my: (params?: Record<string, unknown>) =>
      ['attendance', 'my', params ?? {}] as const,
    admin: (params?: Record<string, unknown>) =>
      ['attendance', 'admin', params ?? {}] as const,
    overtimePolicy: () => ['attendance', 'overtimePolicy'] as const,
  },
  approval: {
    all: ['approval'] as const,
    frequentForms: () => ['approval', 'frequentForms'] as const,
    menuCounts: () => ['approval', 'menuCounts'] as const,
    personalFolders: () => ['approval', 'personalFolders'] as const,
    deptFolders: () => ['approval', 'deptFolders'] as const,
    documents: (box: string, params?: Record<string, unknown>) =>
      ['approval', 'documents', box, params ?? {}] as const,
    forms: (params?: Record<string, unknown>) =>
      ['approval', 'forms', params ?? {}] as const,
  },
} as const
