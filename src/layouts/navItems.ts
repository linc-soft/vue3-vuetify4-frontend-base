export interface NavItem {
  title: string
  icon: string
  to?: string
  children?: NavItem[]
}

export const navItems: NavItem[] = [
  { title: 'Home', icon: 'mdi-home', to: '/' },
  { title: 'Users', icon: 'mdi-account-group', to: '/users' },
  { title: 'Roles', icon: 'mdi-shield-account-outline', to: '/roles' },
  { title: 'Employees', icon: 'mdi-badge-account-horizontal', to: '/employees' },
  {
    title: 'Leave',
    icon: 'mdi-calendar-clock',
    children: [
      { title: 'Apply Leave', icon: 'mdi-calendar-plus', to: '/leaves/apply' },
      { title: 'My Leaves', icon: 'mdi-calendar-text', to: '/leaves/list' },
      { title: 'Approve Leave', icon: 'mdi-calendar-check', to: '/leaves/approval' },
    ],
  },
  { title: 'Regulations', icon: 'mdi-book-open-page-variant', to: '/regulations' },
  {
    title: 'Logs',
    icon: 'mdi-file-document-outline',
    children: [
      { title: 'Access Logs', icon: 'mdi-web', to: '/logs' },
      { title: 'Error Logs', icon: 'mdi-alert-circle-outline', to: '/logs/error' },
      { title: 'Operation Logs', icon: 'mdi-cog-outline', to: '/logs/operation' },
    ],
  },
]
