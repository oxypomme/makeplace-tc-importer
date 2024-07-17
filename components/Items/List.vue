<template>
  <v-data-table
    :items="items"
    :headers="headers"
    :sort-by="[{ key: 'qte', order: 'desc' }]"
  >
    <template #[`item.item.name`]="{ value, item: { item } }">
      <nuxt-link
        :href="`https://ffxivteamcraft.com/db/en/item/${item.id}`"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ value }}
      </nuxt-link>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import type { ParsedList } from '~/server/lib/makeplace';

defineProps<{
  items: ParsedList
}>();

const headers = computed(() => [
  { title: 'Item', value: 'item.name', sortable: true },
  { title: 'Quantity', value: 'qte', sortable: true },
]);
</script>
