<script setup>
import { watch, ref, computed, onMounted } from 'vue';
import { useUsersStore } from '../../stores/users'
import slug from 'slug'

const { data: authData } = useAuth()
const userStore = useUsersStore();

const showEditPhotoProfile = ref(false)
const showEditProfile = ref(false)
const showChangePassword = ref(false)

const { execute: fetchUsers } = useLazyAsyncData(() => userStore.getAll(), {
    immediate: false,
});

onMounted(() => {
    fetchUsers();
});

const currentUser = computed(() => {
    const myId = authData.value?.user?._id;
    return userStore.items.find(u => u._id === myId) || authData.value?.user;
});

const avatarSrc = ref("");
const handleAvatarError = () => {
    avatarSrc.value = `https://ui-avatars.com/api/?name=${currentUser.value?.username}&background=transparent&format=png`;
};

watch(currentUser, (newUser) => {
    if (newUser?.username) {
        // Gunakan ?t= bukan langsung =
        const buster = newUser.updatedAt ? new Date(newUser.updatedAt).getTime() : 0;
        
        avatarSrc.value = `/image/users/${slug(newUser.username)}.png?t=${buster}`;
        
        console.log("URL Gambar Baru:", avatarSrc.value);
    }
}, { immediate: true, deep: true });

const editPhotoProfile = () => {
    showEditPhotoProfile.value = true;
};

const editProfile = () => {
    showEditProfile.value = true;
};

const changePassword = () => {
    showChangePassword.value = true;
};
</script>


<template>
  <div class="pt-8 w-full max-w-5xl mx-auto px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Account Settings</h1>
      <p class="text-gray-500">Manage your profile information and security preferences.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-1 space-y-6">
        <UCard class="text-center overflow-visible">
          <div class="relative inline-block group">
            <UAvatar 
              :key="avatarSrc"
              :src="avatarSrc" 
              size="xl"
              :ui="{ size: { xl: 'h-48 w-48' } }" 
              class="ring-4 ring-primary-50 shadow-xl object-cover"
              @error="handleAvatarError"
            />
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
              <UButton 
                icon="i-heroicons-camera" 
                color="white" 
                variant="solid" 
                label="Change"
                size="xs"
                @click="editPhotoProfile(currentUser)" 
              />
            </div>
          </div>
          
          <div class="mt-4">
            <h2 class="text-xl font-bold text-gray-800">{{ currentUser.username }}</h2>
            <UBadge color="primary" variant="soft" class="mt-1">
              {{ currentUser.role.name|| 'No Role' }}
            </UBadge>
          </div>

          <template #footer>
            <div class="flex flex-col space-y-2 text-white">
              <UButton 
                icon="i-heroicons-pencil-square" 
                color="white"
                label="Update Profile" 
                block 
                @click="editProfile(currentUser)" 
              />
              <UButton 
                icon="i-heroicons-key" 
                label="Security Settings" 
                color="white" 
                block 
                @click="changePassword()" 
              />
            </div>
          </template>
        </UCard>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <UCard title="Personal Information">
          <template #header>
            <div class="font-semibold text-lg">General Information</div>
          </template>

          <div class="space-y-6">
            <div class="flex items-start space-x-4">
              <div class="p-2 bg-gray-100 rounded-lg">
                <UIcon name="i-heroicons-envelope" class="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <div class="text-sm font-medium text-gray-400">Email Address</div>
                <div class="text-lg font-medium text-gray-800">{{ currentUser.email }}</div>
              </div>
            </div>

            <UDivider />

            <div class="flex items-start space-x-4">
              <div class="p-2 bg-gray-100 rounded-lg">
                <UIcon name="i-heroicons-identification" class="w-6 h-6 text-gray-500" />
              </div>
              <div class="w-full">
                <div class="text-sm font-medium text-gray-400">Biography</div>
                <div class="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 italic">
                  "{{ currentUser.bio || 'No bio yet. Tell us something about yourself!' }}"
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <ProfilePhoto :show="showEditPhotoProfile" :data="currentUser" @close="showEditPhotoProfile = false" />
    <ProfileEdit :show="showEditProfile" :data="currentUser" @close="showEditProfile = false" />
    <ProfileChangePassword :show="showChangePassword" @close="showChangePassword = false" />
  </div>
</template>