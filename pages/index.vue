<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>MakePlace TC Importer</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card title="Choose or drop file">
          <template #text>
            <p>
              Import a <a href="https://makeplace.app" target="_blank" rel="noopener noreferrer">Makeplace</a> JSON file to import
              your items into <a href="https://ffxivteamcraft.com" target="_blank" rel="noopener noreferrer">Teamcraft</a> list.
            </p>

            <div class="mt-4 mb-2">
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
            </div>

            <v-alert v-if="result" type="success" variant="tonal" closable @click:close="files = [] && reset()">
              <div>
                Everything went fine ! You can now import your items into Teamcraft !
              </div>
              <div class="mt-2">
                <v-btn
                  :href="result.link"
                  text="Import into Teamcraft"
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
        <v-card title="Meubles">
          <template #text>
            <ItemsList :items="result.items" />
          </template>
        </v-card>
      </v-col>
      <v-col>
        <v-card title="Dyes">
          <template #text>
            <ItemsList :items="result.dyes" />
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
                <b>MakePlace TC Importer</b> par <a href="https://github.com/oxypomme" target="_blank" rel="noopener noreferrer">oxypomme</a> (aka. Eileanoxy@Saggitarius)
              </p>
            </div>

            <div class="mt-6">
              <h2>Copyright notice</h2>
              <p>
                FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.<br />
                FINAL FANTASY XIV © 2010 - 2019 SQUARE ENIX CO., LTD. All Rights Reserved.<br />
                FFXIV Teamcraft is not affiliated with Square Enix.
              </p>
            </div>

            <div class="mt-6">
              <h2>Thanks</h2>
              <ul class="ml-5">
                <li><a href="https://makeplace.app" target="_blank" rel="noopener noreferrer">Makeplace</a></li>
                <li><a href="https://ffxivteamcraft.com" target="_blank" rel="noopener noreferrer">Teamcraft</a></li>
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
});

type UploadResult = {
  items: ParsedList;
  dyes: ParsedList;
  link: string;
};

const files = ref<File[]>([]);
const loading = ref(false);
const error = ref<Error | null>(null);
const result = ref<UploadResult | null>(null);

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

async function onFileUpload(f: File | File[]) {
  const file = Array.isArray(f) ? f[0] : f;
  if (!file) {
    return;
  }

  reset();
  loading.value = true;

  try {
    const schema = await readJSONFile(file);

    result.value = await $fetch('/api/makeplace/teamcraft', {
      method: 'POST',
      body: schema,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(`${e}`);
    error.value = err;
  }

  loading.value = false;
}
</script>
