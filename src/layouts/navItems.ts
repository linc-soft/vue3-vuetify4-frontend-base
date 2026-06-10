export interface NavItem {
  title: string
  icon: string
  to?: string
  children?: NavItem[]
}

export const navItems: NavItem[] = [
  { title: 'Home', icon: 'mdi-home', to: '/' },
  {
    title: 'Master Data',
    icon: 'mdi-database-outline',
    children: [
      { title: 'Users', icon: 'mdi-account-group', to: '/master/users' },
      { title: 'Roles', icon: 'mdi-shield-account-outline', to: '/master/roles' },
      { title: 'Departments', icon: 'mdi-office-building-outline', to: '/master/departments' },
      { title: 'Positions', icon: 'mdi-badge-account-horizontal-outline', to: '/master/positions' },
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
