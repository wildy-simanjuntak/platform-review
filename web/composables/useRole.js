export const useRole = () => {
  const { data } = useAuth();

  const userRole = computed(() => data.value?.user?.role);

  const isAdmin = computed(() => userRole.value === 'admin');
  const isSME = computed(() => userRole.value === 'sme');
  const isProgrammer = computed(() => userRole.value === 'programmer');
  const isManager = computed(() => userRole.value === 'manager');

  return {
    userRole,
    isAdmin,
    isSME,
    isProgrammer,
    isManager
  };
};