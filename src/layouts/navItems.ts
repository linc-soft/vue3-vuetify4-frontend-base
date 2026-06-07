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
  {
    title: 'Organization',
    icon: 'mdi-sitemap-outline',
    children: [
      { title: 'Departments', icon: 'mdi-office-building-outline', to: '/departments' },
      { title: 'Positions', icon: 'mdi-badge-account-horizontal-outline', to: '/positions' },
      { title: 'Employees', icon: 'mdi-account-tie-outline', to: '/employees' },
    ],
  },
  {
    title: 'Leave',
    icon: 'mdi-calendar-account-outline',
    children: [
      { title: 'My Leaves', icon: 'mdi-calendar-edit-outline', to: '/leaves' },
      { title: 'Approval Tasks', icon: 'mdi-gavel', to: '/leave-tasks' },
    ],
  },
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
