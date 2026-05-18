<script setup>
import { ref } from 'vue';
import { z } from 'zod';
import { useToggle } from '@vueuse/core';

const { signIn } = useAuth();

const form = ref();
const typePassword = ref(true);
const errorMessage = ref(null);
const state = ref({
  email: undefined,
  password: undefined,
});

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string(),
});

const togglePassword = useToggle(typePassword);

const submit = async () => {
  console.log("Tombol diklik, fungsi submit berjalan!");
  try {
    await form.value?.validate();
    console.log("Validasi berhasil, memproses login...");
    const { email, password } = state.value;
    await signIn('credentials', { email, password, callbackUrl: '/dashboard' });
  } catch (error) {
    console.error("Login failed:", error);

    errorMessage.value =
      error?.response?._data?.message ||
      error?.message ||
      "Terjadi kesalahan saat login. Periksa koneksi atau kredensial Anda.";
  }
};
</script>

<template>
  <!-- Parent utama dibuat relative, gambar dilepas dari class ini agar tidak merusak layout -->
  <div class="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 overflow-hidden">
    
    <!-- ELEMEN BACKGROUND KHUSUS: Menggunakan bg-cover + bg-fixed agar gambar utuh tersebar di layar -->
    <div class="absolute inset-0 bg-[url('/image/labtech.png')] bg-cover bg-center bg-no-repeat bg-fixed opacity-10 pointer-events-none"></div>

    <!-- KONTEN UTAMA: Diberikan z-10 agar berada aman di atas lapisan background -->
    <div class="max-w-md w-full relative z-10">
      <div class="text-center mb-10">
        <img src="/Logo.png" alt="Logo" class="mx-auto h-16 w-auto mb-6 transform hover:scale-105 transition-transform duration-300">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Welcome Back
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Please sign in to access your dashboard
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 py-8 px-10 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700">
        
        <ErrorHandler
          v-if="errorMessage"
          :error="errorMessage"
          class="mb-6"
        />

        <UForm
          ref="form"
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="submit"
        >
          <UFormGroup label="Email Address" name="email" eager-validation>
            <UInput
              v-model="state.email"
              placeholder="name@company.com"
              icon="i-heroicons-envelope"
              size="lg"
              autocomplete="email"
              class="focus:ring-blue-500"
            />
          </UFormGroup>

          <UFormGroup label="Password" name="password" eager-validation>
            <UInput
              v-model="state.password"
              :type="typePassword ? 'password' : 'text'"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              size="lg"
              autocomplete="current-password"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UButton
                  color="gray"
                  variant="ghost"
                  :icon="typePassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  :padded="false"
                  tabindex="-1"
                  @click="togglePassword()"
                />
              </template>
            </UInput>
          </UFormGroup>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30"
          >
            Sign In
          </UButton>
        </UForm>
      </div>

      <p class="mt-8 text-center text-xs text-gray-500 uppercase tracking-widest">
        &copy; 2026 Labtech Penta International. All rights reserved.
      </p>
    </div>
  </div>
</template>