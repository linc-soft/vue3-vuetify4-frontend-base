export interface NavItem {
  title: string
  icon: string
  to?: string
  children?: NavItem[]
}

export const navItems: NavItem[] = [
  { title: 'nav.home', icon: 'mdi-home', to: '/' },
  {
    title: 'nav.master',
    icon: 'mdi-database-outline',
    children: [
      { title: 'nav.users', icon: 'mdi-account-group', to: '/master/users' },
      { title: 'nav.roles', icon: 'mdi-shield-account-outline', to: '/master/roles' },
      { title: 'nav.departments', icon: 'mdi-office-building-outline', to: '/master/departments' },
      {
        title: 'nav.positions',
        icon: 'mdi-badge-account-horizontal-outline',
        to: '/master/positions',
      },
    ],
  },
  {
    title: 'nav.logs',
    icon: 'mdi-file-document-outline',
    children: [
      { title: 'nav.accessLogs', icon: 'mdi-web', to: '/logs' },
      { title: 'nav.errorLogs', icon: 'mdi-alert-circle-outline', to: '/logs/error' },
      { title: 'nav.operationLogs', icon: 'mdi-cog-outline', to: '/logs/operation' },
      { title: 'nav.sqlLogs', icon: 'mdi-database-search-outline', to: '/logs/sql' },
    ],
  },
]
