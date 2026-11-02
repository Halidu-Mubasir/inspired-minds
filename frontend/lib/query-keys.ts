/**
 * Query keys, grouped so a prefix invalidates a whole family
 * (e.g. `queryKeys.pairings.all` refreshes every pairing list, detail and stat).
 */
type Params = Record<string, string>;

export const queryKeys = {
  dashboardStats: ["dashboard-stats"] as const,
  mySummary: ["my-summary"] as const,
  subjects: ["subjects"] as const,
  conversations: ["conversations"] as const,

  teachers: {
    all: ["teachers"] as const,
    list: (params: Params) => ["teachers", "list", params] as const,
    detail: (id: string) => ["teachers", "detail", id] as const,
  },
  students: {
    all: ["students"] as const,
    list: (params: Params) => ["students", "list", params] as const,
    detail: (id: string) => ["students", "detail", id] as const,
  },
  pairings: {
    all: ["pairings"] as const,
    list: (params: Params) => ["pairings", "list", params] as const,
    stats: ["pairings", "stats"] as const,
    myStudents: ["pairings", "my-students"] as const,
    myTeachers: ["pairings", "my-teachers"] as const,
  },
  lessons: {
    all: ["lessons"] as const,
    list: (params: Params) => ["lessons", "list", params] as const,
    detail: (id: string) => ["lessons", "detail", id] as const,
  },
  resources: {
    all: ["resources"] as const,
    list: (params: Params) => ["resources", "list", params] as const,
    library: (params: Params) => ["resources", "library", params] as const,
  },
};
