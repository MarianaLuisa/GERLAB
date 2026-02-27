export const mockDashboard = {
  totals: {
    totalLockers: 42,
    free: 18,
    occupied: 21,
    maintenance: 3,
  },
  weekly: [
    { day: "Seg", occupied: 22 },
    { day: "Ter", occupied: 24 },
    { day: "Qua", occupied: 20 },
    { day: "Qui", occupied: 26 },
    { day: "Sex", occupied: 23 },
    { day: "Sáb", occupied: 19 },
    { day: "Dom", occupied: 17 },
  ],
  lastAllocations: [
    { id: "1", user: "Ana Silva", locker: "A-02", when: "Hoje • 14:10" },
    { id: "2", user: "Bruno Lima", locker: "B-07", when: "Hoje • 13:42" },
    { id: "3", user: "Carla Souza", locker: "A-11", when: "Ontem • 17:05" },
    { id: "4", user: "Diego Martins", locker: "C-01", when: "Ontem • 15:22" },
  ],
};