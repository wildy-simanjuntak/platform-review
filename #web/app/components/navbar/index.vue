<script setup>
import slug from "slug";
const { data, signOut } = useAuth();

const avatarSrc = ref("");
const items = [
  [{ slot: "account", disabled: true }],
  [
    {
      label: "Settings",
      icon: "i-heroicons-cog-8-tooth",
      click: async () => {
        if (data.value?.user?._id) await navigateTo(`/profile/${data.value.user._id}`);
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
];
</script>

<template>
  <div class="h-12 p-4 w-full flex justify-between items-center space-x-4 group bg-white border-b">
    <div class="text-xl font-semibold">DASHBOARD</div>
    <div class="flex items-center space-x-4">
      <!-- <UIcon name="i-solar-bell-bing-bold" class="w-8 h-8 text-primary-600" /> -->
      <UDropdown :items="items" :popper="{ placement: 'bottom-start' }">
        <UAvatar  
            :src="
              data?.user?.image
                ? `/image/users/${slug(data.user.username)}.png`
                : `https://ui-avatars.com/api/?name=${data?.user?.username}`
            "
            :alt="username" 
            class="border-2 border-solid"
             />
        <template #account>
          <div class="text-left">
            <p>Signed in as</p>
            <p class="truncate font-medium text-gray-900">{{ username }}</p>
          </div>
        </template>
        <template #item="{ item }">
          <span class="truncate">{{ item.label }}</span>
          <UIcon :name="item.icon" class="ms-auto w-4 h-4 text-gray-400" />
        </template>
      </UDropdown>
    </div>
  </div>
</template>