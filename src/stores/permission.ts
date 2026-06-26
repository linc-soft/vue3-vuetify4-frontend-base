import type { ResourceNode } from '@/api/schemas/resource'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMyResources } from '@/api/modules/resource'

const ADMIN_CODE = 'ADMIN'

function collectCodes(nodes: ResourceNode[], out: Set<string>, iconOut: Map<string, string>) {
  for (const node of nodes) {
    out.add(node.resourceCode)
    if (node.icon != null && node.icon !== '') {
      iconOut.set(node.resourceCode, node.icon)
    }
    if (node.children?.length) {
      collectCodes(node.children, out, iconOut)
    }
  }
}

function findRoutePaths(nodes: ResourceNode[], out: Set<string>) {
  for (const node of nodes) {
    if (node.type === 1 && node.routePath) {
      out.add(node.routePath)
    }
    if (node.children?.length) {
      findRoutePaths(node.children, out)
    }
  }
}

export const usePermissionStore = defineStore('permission', () => {
  const resourceTree = ref<ResourceNode[]>([])
  const resourceCodes = ref<Set<string>>(new Set())
  const resourceIcons = ref<Map<string, string>>(new Map())
  const visibleRoutePaths = ref<Set<string>>(new Set())
  const roleCodes = ref<Set<string>>(new Set())
  const loaded = ref(false)
  let loadingPromise: Promise<void> | null = null

  const isAdmin = computed(() => roleCodes.value.has(ADMIN_CODE))

  function setRoleCodes(codes: string[] | Set<string>) {
    roleCodes.value = codes instanceof Set ? new Set(codes) : new Set(codes)
  }

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return
    if (loadingPromise) return loadingPromise

    loadingPromise = (async () => {
      try {
        const tree = await getMyResources()
        resourceTree.value = tree
        const codes = new Set<string>()
        const icons = new Map<string, string>()
        collectCodes(tree, codes, icons)
        resourceCodes.value = codes
        resourceIcons.value = icons
        const paths = new Set<string>()
        findRoutePaths(tree, paths)
        visibleRoutePaths.value = paths
        loaded.value = true
      } finally {
        loadingPromise = null
      }
    })()

    return loadingPromise
  }

  function clear() {
    resourceTree.value = []
    resourceCodes.value = new Set()
    resourceIcons.value = new Map()
    visibleRoutePaths.value = new Set()
    roleCodes.value = new Set()
    loaded.value = false
    loadingPromise = null
  }

  function has(code: string): boolean {
    if (isAdmin.value) return true
    return resourceCodes.value.has(code)
  }

  function hasAny(codes: string[]): boolean {
    if (isAdmin.value) return true
    return codes.some(c => resourceCodes.value.has(c))
  }

  function hasAll(codes: string[]): boolean {
    if (isAdmin.value) return true
    return codes.every(c => resourceCodes.value.has(c))
  }

  function isRouteAllowed(resourceCode: string | undefined): boolean {
    if (!resourceCode) return true
    return has(resourceCode)
  }

  function iconOf(code: string): string | null {
    return resourceIcons.value.get(code) ?? null
  }

  return {
    resourceTree,
    resourceCodes,
    resourceIcons,
    visibleRoutePaths,
    roleCodes,
    loaded,
    isAdmin,
    load,
    clear,
    has,
    hasAny,
    hasAll,
    isRouteAllowed,
    iconOf,
    setRoleCodes,
  }
})
