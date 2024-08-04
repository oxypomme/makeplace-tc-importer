<template>
  <v-data-table
    :items="items"
    :headers="headers"
    :sort-by="[{ key: 'qte', order: 'desc' }]"
    :items-per-page="itemsPerPage"
  >
    <template #[`item.item.icon`]="{ value }">
      <v-avatar v-if="value" :image="`https://xivapi.com${value}`" density="compact" />
    </template>

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
  itemsPerPage?: number | string
}>();

const headers = computed(() => [
  { title: '', value: 'item.icon' },
  { title: 'Item', value: 'item.name', sortable: true },
  { title: 'Quantity', value: 'qte', sortable: true },
]);
</script>
