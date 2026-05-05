<script setup>
import slug from "slug";
import { useUsersStore } from '~/stores/users';
import { storeToRefs } from 'pinia';

defineEmits(['toggle-sidebar'])
const { data: authData, signOut } = useAuth();
const store = useUsersStore();

const { items: allUsers } = storeToRefs(store);

const avatarUrl = computed(() => {
  const authUserId = authData.value?.user?._id;

  const currentUser = allUsers.value?.find(u => u._id === authUserId);
  const user = currentUser || authData.value?.user;

  if (!user?.username) return "https://ui-avatars.com/api/?name=Guest";

  if (user.image) {
    const buster = user.updatedAt ? new Date(user.updatedAt).getTime() : 0;
    return `/image/users/${slug(user.username)}.png?t=${buster}`;
  }

  return `https://ui-avatars.com/api/?name=${user.username}`;
});

const dropdownItems = computed(() => [
  [{ slot: "account", disabled: true }],
  [
    {
      label: "Settings",
      icon: "i-heroicons-cog-8-tooth",
      click: async () => {
        const id = authData.value?.user?._id;
        if (id) await navigateTo(`/profile/${id}`);
      }
    },
    {
      label: "Sign out",
      icon: "i-heroicons-arrow-left-on-rectangle",
      click: async () => {
        await signOut({ callbackUrl: "/" });
      }
    }
  ]
]);


</script>

<template>
  <nav class="sticky top-0 z-50 h-16 w-full flex justify-between items-center px-4 md:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
    
    <!-- Bagian Kiri: Burger + Title -->
    <div class="flex items-center space-x-2 md:space-x-4">
      <!-- Tombol Hamburger (Hanya muncul di < lg) -->
      <UButton
        icon="i-heroicons-bars-3-bottom-left"
        color="gray"
        variant="ghost"
        class="lg:hidden"
        @click="$emit('toggle-sidebar')"
      />

      <div class="hidden xs:block h-6 w-1 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
      
      <h1 class="text-sm md:text-lg font-bold tracking-tight text-gray-800 dark:text-white uppercase italic truncate max-w-[150px] md:max-w-none">
        Dashboard
      </h1>
    </div>

    <!-- Bagian Kanan: User Actions -->
    <div class="flex items-center">
      <ClientOnly>
        <UDropdown 
          :items="dropdownItems" 
          :popper="{ placement: 'bottom-end', offsetDistance: 12 }"
          :ui="{ 
            width: 'w-56', 
            rounded: 'rounded-xl', 
            ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
            shadow: 'shadow-2xl',
            item: { size: 'text-sm', padding: 'px-3 py-2' }
          }"
        >
          <button class="flex items-center group focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
            <!-- Nama User & Status (Hanya muncul di desktop) -->
            <div class="hidden sm:flex flex-col text-right mr-3 leading-tight">
               <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {{ authData?.user?.username }}
              </span>
              <span class="text-[10px] text-green-500 font-medium uppercase tracking-tighter flex items-center justify-end">
                <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Online
              </span>
            </div>
            
            <UAvatar 
              :src="avatarUrl" 
              :alt="authData?.user?.username" 
              size="sm"
              class="ring-2 ring-white dark:ring-gray-900 group-hover:ring-blue-500 transition-all shadow-md md:size-md"
            />
          </button>
          
          <!-- Template: Header Akun -->
          <template #account>
            <div class="p-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 rounded-t-xl">
              <p class="text-[10px] font-bold text-gray-400 uppercase">Signed in as</p>
              <p class="mt-0.5 font-bold text-gray-900 dark:text-white truncate text-sm">
                {{ authData?.user?.username }}
              </p>
            </div>
          </template>
          
          <template #item="{ item }">
            <div class="flex items-center w-full group/item">
              <UIcon :name="item.icon" class="flex-shrink-0 w-4 h-4 text-gray-400 group-hover/item:text-blue-500 transition-colors" />
              <span class="ml-3 truncate font-medium text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white">{{ item.label }}</span>
            </div>
          </template>
        </UDropdown>

        <template #fallback>
          <div class="flex items-center space-x-3">
            <div class="h-8 w-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg hidden sm:block" />
            <div class="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </nav>
</template>