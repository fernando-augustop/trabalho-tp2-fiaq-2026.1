import { writable } from 'svelte/store'

export const departmentsSidebarOpen = writable(false)

export function openDepartmentsSidebar() {
  departmentsSidebarOpen.set(true)
}

export function closeDepartmentsSidebar() {
  departmentsSidebarOpen.set(false)
}

export function toggleDepartmentsSidebar() {
  departmentsSidebarOpen.update(value => !value)
}
