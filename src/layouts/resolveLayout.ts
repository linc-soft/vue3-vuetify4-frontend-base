import type { Component } from 'vue'
import BaselineLayout from './BaselineLayout.vue'
import SystemBarLayout from './SystemBarLayout.vue'

type LayoutName = 'system-bar' | 'baseline'

const layouts: Record<LayoutName, Component> = {
  'system-bar': SystemBarLayout,
  baseline: BaselineLayout,
}

export function resolveLayout(): Component {
  const name = import.meta.env.VITE_LAYOUT as LayoutName
  return layouts[name] ?? BaselineLayout
}
