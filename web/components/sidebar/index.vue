<script setup>
const { data } = useAuth();
const route = useRoute();
const scope = effectScope();

const sidebarItems = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        roles: ['admin', 'manager', 'sme', 'programmer']
    },
    {
        label: 'Log Activity',
        to: '/log-activity',
        roles: ['admin', 'manager', 'sme', 'programmer']
    },
    {
        label: 'Management',
        roles: ['admin', 'manager'],
        subs: [
            { label: 'User', to: '/management/users' },
            { label: 'Roles', to: '/management/roles' },
        ],
    },
    {
        label: 'Project',
        roles: ['admin'],
        subs: [
            { label: 'Category', to: '/project/category' },
            { label: 'Module', to: '/project/module' },
            { label: 'Content', to: '/project/content' },
        ],
    },
    {
        label: 'Upload Content',
        to: '/upload',
        roles: ['programmer']
    }
];

const findMatchingIndex = (path, items) => items.findIndex(
    (item) => (item.to && path.includes(item.to)) || (item.subs?.some((sub) => path.includes(sub.to))),
);

const filteredItems = computed(() => {
    const userRole = data.value?.user?.role.name;
    return sidebarItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });
});

const statuses = ref([]);
watch(filteredItems, (newItems) => {
    statuses.value = newItems.map(() => ({ isOpen: false, isActive: false }));

    const index = findMatchingIndex(route.path, newItems);
    if (index !== -1 && statuses.value[index]) {
        statuses.value[index] = { isOpen: true, isActive: true };
    }
}, { immediate: true });

const toggleOpen = (index) => {
    const isOpenNow = statuses.value[index]?.isOpen;
    statuses.value = statuses.value.map((status, idx) => (idx === index
        ? { ...status, isOpen: filteredItems.value[index].to ? true : !isOpenNow, isActive: true }
        : { ...status, isOpen: false, isActive: false }));
};

scope.run(() => {
    watch(() => route.path, (value) => {
        const index = findMatchingIndex(value, filteredItems.value);
        if (index !== -1 && statuses.value[index]) {
            statuses.value = statuses.value.map((status, idx) => (idx === index
                ? { ...status, isOpen: true, isActive: true }
                : { ...status, isOpen: false, isActive: false }));
        }
    });
});

onMounted(() => {
    const index = findMatchingIndex(route.path, filteredItems.value);
    if (index !== -1 && statuses.value[index]) {
        statuses.value[index] = { isOpen: true, isActive: true };
    }
});

onScopeDispose(() => scope.stop());
</script>

<template>
  <div class="w-64 h-full  text-slate-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">

    <nav class="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <ul class="space-y-1">
        <li v-for="(item, index) in filteredItems" :key="index" class="select-none">
          
          <UButton
            color="gray"
            variant="ghost"
            :to="item.to"
            class="w-full group relative flex items-center px-3 py-2.5 transition-all duration-200 rounded-xl"
            :class="[
              statuses[index]?.isActive 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' 
                : 'text-slate-100  hover:bg-gray-50 dark:hover:bg-gray-800'
            ]"
            @click="toggleOpen(index)"
          >
            <UIcon 
              v-if="item.icon" 
              :name="item.icon" 
              class="w-5 h-5 mr-3 transition-colors"
              :class="[statuses[index]?.isActive ? 'text-blue-600' : 'text-slate-100 group-hover:text-slate-300']"
            />
            
            <span class="text-sm tracking-wide">{{ item.label }}</span>

            <template v-if="!item.to && item.subs?.length" #trailing>
              <UIcon 
                name="i-heroicons-chevron-right-20-solid"
                class="w-4 h-4 ms-auto transform transition-transform duration-300"
                :class="[statuses[index]?.isOpen && 'rotate-90', statuses[index]?.isActive ? 'text-blue-500' : 'text-gray-300']"
              />
            </template>

            <div v-if="statuses[index]?.isActive" class="absolute left-0 w-1 h-5 bg-blue-600 rounded-r-full"></div>
          </UButton>

          <Transition
            enter-active-class="overflow-hidden transition-[max-height] duration-300 ease-out"
            enter-from-class="max-h-0"
            enter-to-class="max-h-96"
            leave-active-class="overflow-hidden transition-[max-height] duration-300 ease-in"
            leave-from-class="max-h-96"
            leave-to-class="max-h-0"
          >
            <ul v-show="statuses[index]?.isOpen && !item.to" class="mt-1 ml-6 space-y-1 border-l border-gray-100 dark:border-gray-800">
              <li v-for="(sub, idx) in item.subs" :key="idx">
                <ULink 
                  :to="sub.to" 
                  active-class="text-blue-600 dark:text-blue-400 bg-white dark:bg-blue-900/10 font-medium"
                  inactive-class="text-slate-100 hover:text-gray-900  hover:bg-gray-50 dark:hover:bg-gray-800"
                  class="flex items-center w-full pl-6 pr-3 py-2 text-xs rounded-r-lg transition-all border-l-2 border-transparent"
                >
                  <span class="truncate">{{ sub.label }}</span>
                </ULink>
              </li>
            </ul>
          </Transition>
        </li>
      </ul>
    </nav>
  </div>
</template>

<!-- <style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
}
</style> -->