<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

navigateTo({ path: '/dashboard', query: { tab: 'seniority' } }, { replace: true });
</script>
