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
    <div class="p-4">
        <ul class="space-y-2">
            <li v-for="(item, index) in filteredItems" :key="index">
                <UButton 
                    color="gray" 
                    variant="ghost" 
                    square 
                    :label="item.label" 
                    :to="item.to" 
                    :padded="false"
                    :class="[statuses[index]?.isActive ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600']"
                    class="w-full hover:text-blue-600 hover:bg-blue-50/30 px-3 py-2 transition-all" 
                    @click="toggleOpen(index)"
                >
                    <template v-if="!item.to" #trailing>
                        <UIcon 
                            name="i-solar-alt-arrow-down-line-duotone"
                            class="w-4 h-4 ms-auto transform transition-transform duration-200"
                            :class="[statuses[index]?.isOpen && 'rotate-180']" 
                        />
                    </template>
                </UButton>

                <Transition
                    enter-active-class="transition-all duration-200 ease-out"
                    leave-active-class="transition-all duration-200 ease-in"
                >
                    <ul v-show="statuses[index]?.isOpen && !item.to" class="mt-1 ml-4 border-l-2 border-gray-100">
                        <li v-for="(sub, idx) in item.subs" :key="idx">
                            <ULink 
                                :to="sub.to" 
                                active-class="text-blue-600 border-l-2 border-blue-600 -ml-[2px]"
                                inactive-class="text-gray-500 border-transparent hover:text-blue-500" 
                                class="flex items-center w-full pl-4 py-2 text-sm transition-all"
                            >
                                {{ sub.label }}
                            </ULink>
                        </li>
                    </ul>
                </Transition>
            </li>
        </ul>
    </div>
</template>