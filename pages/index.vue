<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>MakePlace {{ exporter.title }} Importer</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-alert type="info" variant="tonal">
          This tool is in early stage of development :
          if you encounter any issue (or feature requests), please
          <a href="https://github.com/oxypomme/makeplace-tc-importer/issues" target="_blank" rel="noopener noreferrer">open an issue</a>.
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card title="Choose or drop file">
          <template #text>
            <p>
              Import a <a href="https://makeplace.app" target="_blank" rel="noopener noreferrer">Makeplace</a> JSON file to import
              your items into <a :href="exporter.url" target="_blank" rel="noopener noreferrer">{{ exporter.title }}</a> list.
            </p>

            <div class="mt-4 mb-2">
              <v-row>
                <v-col cols="8" lg="10">
                  <v-file-input
                    v-model="files"
                    :loading="loading"
                    :error="!!error"
                    :error-messages="error?.message"
                    label="Makeplace JSON file"
                    prepend-icon="mdi-upload"
                    variant="outlined"
                    accept=".json"
                    show-size
                    @update:model-value="onFileUpload($event)"
                    @click:clear="reset()"
                  />
                </v-col>

                <v-col>
                  <v-select
                    v-model="exporter"
                    :items="Object.values(availableExporters)"
                    label="Exporter"
                    variant="outlined"
                    return-object
                    @update:model-value="result && reset()"
                  />
                </v-col>
              </v-row>
            </div>

            <v-alert v-if="result" type="success" variant="tonal" closable @click:close="files = [] && reset()">
              <div>
                Everything went fine ! You can now import your items into {{ exporter.title }} !
              </div>
              <div class="mt-2">
                <v-btn
                  :href="result.link"
                  :text="`Import into ${exporter.title}`"
                  append-icon="mdi-arrow-right"
                  color="success"
                />
              </div>
            </v-alert>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="result">
      <v-col>
        <v-card
          :subtitle="`Total quantity: ${totalItems._?.total ?? '?'}`"
          title="Furnitures and fixtures"
        >
          <template #text>
            <ItemsList :items="result.items" />
          </template>
        </v-card>
      </v-col>

      <v-col>
        <v-card title="Detail">
          <template #text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th />
                  <th>
                    Count
                  </th>
                  <th>
                    Total quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="[type, { label, icon }] in typeHeaderMap">
                  <tr
                    v-if="totalItems[type]"
                    :key="type"
                  >
                    <td><v-icon :icon="icon" size="small" class="mr-1" /> {{ label }}</td>
                    <td>{{ totalItems[type].count }}</td>
                    <td>{{ totalItems[type].total }}</td>
                  </tr>
                </template>
              </tbody>
            </v-table>
          </template>
        </v-card>

        <v-card
          :subtitle="`Total quantity: ${totalDyes}`"
          title="Dyes"
          class="mt-5"
        >
          <template #text>
            <ItemsList :items="result.dyes" items-per-page="4" />
          </template>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card>
          <template #text>
            <div>
              <h2>About</h2>
              <p>
                <i>MakePlace Teamcraft Importer</i> by <a href="https://github.com/oxypomme" target="_blank" rel="noopener noreferrer">oxypomme</a> (aka. Eileanoxy@Saggitarius)
              </p>
            </div>

            <div class="mt-6">
              <h2>Copyright notice</h2>
              <p>
                FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.<br />
                FINAL FANTASY XIV © 2010 - 2019 SQUARE ENIX CO., LTD. All Rights Reserved.<br />
                FFXIV Teamcraft, Garland Tools and MakePlace are not affiliated with Square Enix.
              </p>
            </div>

            <div class="mt-6">
              <h2>Thanks</h2>
              <ul class="ml-5">
                <li><a href="https://makeplace.app" target="_blank" rel="noopener noreferrer">Makeplace</a></li>
                <li><a href="https://ffxivteamcraft.com" target="_blank" rel="noopener noreferrer">Teamcraft</a></li>
                <li><a href="https://garlandtools.org" target="_blank" rel="noopener noreferrer">Garland Tools</a></li>
                <li><a href="https://xivapi.com" target="_blank" rel="noopener noreferrer">XIVAPI</a></li>
              </ul>
            </div>

            <div class="mt-6">
              <h2>Privacy Policy</h2>
              <p>
                This site uses almost nothing, nothing is collected nor stored anywhere.
              </p>
            </div>
          </template>

          <template #actions>
            <v-spacer />

            <v-btn
              v-tooltip="'View on GitHub'"
              icon="mdi-github"
              variant="tonal"
              href="https://github.com/oxypomme/makeplace-tc-importer"
              target="_blank"
              rel="noopener noreferrer"
            />
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { ParsedList } from '~/server/lib/makeplace';

useHead({
  title: 'MakePlace TC Importer',
  meta: [
    { property: 'og:title', content: 'MakePlace Teamcraft Importer' },
    { property: 'og:type', content: 'Website' },
    { property: 'og:description', content: 'Import a Makeplace JSON file to import your items into Teamcraft list.' },
    { property: 'og:url', content: 'https://mptc.oxypomme.fr' },
  ],
});

type ParsedItemType = ParsedList[number]['type'];

type UploadResult = {
  items: ParsedList;
  dyes: ParsedList;
  link: string;
};

const availableExporters = [
  { url: 'https://ffxivteamcraft.com', title: 'Teamcraft', value: 'teamcraft' },
  { url: 'https://garlandtools.org/', title: 'Garland Tools', value: 'garlandtools' },
] as const;
const typeHeaderMap = new Map<ParsedItemType, { label: string, icon: string }>([
  ['interior-furniture', { label: 'Interior Furnitures', icon: 'mdi-table-furniture' }],
  ['interior-fixture', { label: 'Interior Fixtures', icon: 'mdi-wall' }],
  ['exterior-furniture', { label: 'Exterior Furnitures', icon: 'mdi-tree' }],
  ['exterior-fixture', { label: 'Exterior Fixtures', icon: 'mdi-home' }],
  ['material', { label: 'Materials', icon: 'mdi-wallpaper' }],
  ['dye', { label: 'Dyes', icon: 'mdi-palette' }],
]);

const files = ref<File[]>([]);
const exporter = ref<(typeof availableExporters)[number]>(availableExporters[0]);
const loading = ref(false);
const error = ref<Error | null>(null);
const result = ref<UploadResult | null>(null);

const totalItems = computed(() => {
  const initial: { [type in ParsedItemType | '_']?: { total: number, count: number } } = {
    _: {
      total: 0,
      count: 0,
    },
  };

  if (!result.value || !initial._) {
    return initial;
  }

  const globalResult = initial._;
  globalResult.count = result.value.items.length;

  return result.value.items.reduce((acc, { type, qte }) => {
    const res = acc;
    if (!res[type]) {
      res[type] = { count: 0, total: 0 };
    }
    res[type].count += 1;
    res[type].total += qte;
    globalResult.total += qte;
    return res;
  }, initial);
});
const totalDyes = computed(() => {
  if (!result.value) {
    return 0;
  }
  return result.value.dyes.reduce((acc, { qte }) => acc + qte, 0);
});

function reset() {
  error.value = null;
  result.value = null;
}

function readJSONFile(file: File) {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        resolve(json);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function getTCImportLink(file: File) {
  const schema = await readJSONFile(file);

  return $fetch('/api/makeplace/teamcraft', {
    method: 'POST',
    body: schema,
  });
}

async function getGTImportLink(file: File) {
  const schema = await readJSONFile(file);

  return $fetch('/api/makeplace/garlean', {
    method: 'POST',
    body: schema,
    query: {
      name: file.name.replace(/\.json$/i, ''),
    },
  });
}

async function onFileUpload(f: File | File[]) {
  const file = Array.isArray(f) ? f[0] : f;
  if (!file) {
    return;
  }

  reset();
  loading.value = true;

  try {
    switch (exporter.value.value) {
      case 'teamcraft':
        result.value = await getTCImportLink(file);
        break;

      case 'garlandtools':
        result.value = await getGTImportLink(file);
        break;

      default:
        throw new Error(`Unknown exporter: ${exporter.value}`);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(`${e}`);
    error.value = err;
  }

  loading.value = false;
}
</script>
