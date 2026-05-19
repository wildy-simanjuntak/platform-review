<script setup>
const isSidebarOpen = ref(false);

const route = useRoute();
watch(() => route.fullPath, () => {
  isSidebarOpen.value = false;
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="fixed top-0 left-0 w-full h-16 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <Navbar @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
    </header>

    <div class="flex pt-16">
      <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-if="isSidebarOpen" 
          class="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          @click="isSidebarOpen = false"
        ></div>
      </Transition>

      <aside 
        class="fixed min-h-screen  inset-y-0 left-0 z-40 w-64 bg-gradient-to-r from-[#0054A6] to-[#012E67] border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 lg:translate-x-0 lg:static "
        :class="[isSidebarOpen ? 'translate-x-0' : '-translate-x-full']"
      >
        <Sidebar />
      </aside>

      <main class="flex-1 min-w-0 overflow-x-hidden">
        <div class="p-4 md:p-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>