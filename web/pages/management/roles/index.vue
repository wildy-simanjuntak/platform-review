<script setup>
definePageMeta({
  middleware: ["role"],
  allowedRoles: ["admin", "manager"],
});
</script>

<template>
  <Roles />
</template>
