export default defineNuxtRouteMiddleware((to) => {
  const { userRole } = useRole();
  // console.log('Middleware Role - User Role:', userRole.value.name);
  // console.log('Middleware Role - Allowed Roles:', to.meta.allowedRoles);
  const toast = useToast();
  const allowedRoles = to.meta.allowedRoles;

  if (!allowedRoles) return;

  if (!userRole.value || !allowedRoles.includes(userRole.value.name)) {
    toast.add({
      title: 'Akses Dibatasi',
      description: 'Halaman ini hanya untuk Programmer/Admin.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle'
    });

    return navigateTo('/403'); 
  }
});