export interface NavItem {
  title: string
  icon: string
  to: string
}

export const navItems: NavItem[] = [
  { title: 'Home', icon: 'mdi-home', to: '/' },
  { title: 'Users', icon: 'mdi-account-group', to: '/users' },
]
