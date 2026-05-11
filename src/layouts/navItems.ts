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
    title: 'Logs',
    icon: 'mdi-file-document-outline',
    children: [
      { title: 'Access Logs', icon: 'mdi-web', to: '/logs' },
      { title: 'Error Logs', icon: 'mdi-alert-circle-outline', to: '/logs/error' },
      { title: 'Operation Logs', icon: 'mdi-cog-outline', to: '/logs/operation' },
    ],
  },
]
