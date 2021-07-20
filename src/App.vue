<template>
  <v-app>
    <div class="maxWidth py-4">
      <div>零食 Tier List</div>
    </div>
    <div
      class="content"
      :class="{
        'content--horizontal': horizontal,
      }"
      v-if="!loading"
    >
      <div class="content__tier" style="background-color: #1A1A1A">
        <div id="js-screenshot" class="maxWidth pa-2">
          <div
            class="tiergrid"
          >
            <template
              v-for="element in list"
            >
              <div
                class="tierName"
                :key="`name-${element.id}`"
                :style="{
                  backgroundColor: element.bg,
                }"
              >
                <div>{{ element.name }}</div>
              </div>
              <draggable
                class="cardgrid"
                :list="element.arr"
                group="snack"
                @change="changeTier($event, element.name)"
                :key="`arr-${element.id}`"
                style="background-color: #1A1A1A"
              >
                <div
                  class="card snackcard"
                  v-for="i in element.arr"
                  :key="i.id"
                  :title="i.name"
                  :style="cardImg(i.id)"
                >
                  <div class="snackcard__info">
                    <v-btn
                      class="snackcard__btn"
                      icon
                      @click="openInfo(i)"
                    >
                      <v-icon>
                        mdi-information
                      </v-icon>
                    </v-btn>
                  </div>
                </div>
              </draggable>
            </template>
          </div>
        </div>
      </div>
      <div class="content__pool" style="background-color: #B2DFDB">
        <div class="maxWidth px-2 pt-3 pb-1 searchBar">
          <v-text-field
            outlined
            label="搜尋"
            prepend-inner-icon="mdi-magnify"
            hide-details
            v-model="search"
          ></v-text-field>
        </div>
        <div class="maxWidth px-2 py-6">
          <draggable
            class="cardgrid"
            :list="pool"
            @change="changeTier($event, null)"
            group="snack"
          >
            <template v-for="i in pool">
              <v-card
                v-if="!search || (search && i.name.includes(search))"
                class="snackcard"
                :key="i.id"
                :title="i.name"
                :style="cardImg(i.id)"
              >
                <div class="snackcard__info">
                  <v-btn
                    class="snackcard__btn"
                    icon
                    @click="openInfo(i)"
                  >
                    <v-icon>
                      mdi-information
                    </v-icon>
                  </v-btn>
                </div>
              </v-card>
            </template>
          </draggable>
        </div>
      </div>
    </div>
    <v-dialog v-model="snackInfo" max-width="400">
      <v-card>
        <div
          flat
          class="snackcard snackcard--lg"
          :style="cardImg(imgItem.id)"
        >
        </div>
        <div class="pa-2 text-center">
          {{ imgItem.name }}
        </div>
      </v-card>
    </v-dialog>
    <v-dialog v-model="openScreenshot">
      <v-card>
        <img class="imgScreenshot" :src="imgOutput" alt="screenshot">
      </v-card>
    </v-dialog>
    <div class="floatBtn">
      <v-btn
        class="mx-1"
        fab
        dark
        small
        color="primary"
        @click="horizontal = !horizontal"
        title="切換排版"
      >
        <v-icon dark>
          mdi-grid-large
        </v-icon>
      </v-btn>
      <v-btn
        class="mx-1"
        fab
        dark
        small
        color="error"
        @click="clearAll"
        title="清空列表"
      >
        <v-icon dark>
          mdi-delete
        </v-icon>
      </v-btn>
      <v-btn
        class="mx-1"
        fab
        dark
        small
        color="primary"
        @click="screenshot"
        title="截圖"
      >
        <v-icon dark>
          mdi-camera
        </v-icon>
      </v-btn>
    </div>
    <div class="pa-2 text-right text-caption">
      © 2021 實況主零食之家 All Rights Reserved
    </div>
  </v-app>
</template>

<script>
import draggable from 'vuedraggable';
import {
  entries, set, clear, createStore,
} from 'idb-keyval';
import axios from 'axios';
import html2canvas from 'html2canvas';

const customStore = createStore('tgm3', 'snacks');

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

export default {
  name: 'App',

  components: {
    draggable,
  },

  data: () => ({
    list: {},
    pool: [],
    snackInfo: false,
    openScreenshot: false,
    horizontal: false,
    imgItem: {},
    imgOutput: null,
    loading: true,
    search: '',
  }),
  methods: {
    cardImg(id) {
      if (!id) {
        return {};
      }
      return {
        backgroundImage: `url('./img/${id}.jpg')`,
      };
    },
    openInfo(item) {
      this.snackInfo = true;
      this.imgItem = item;
    },
    async screenshot() {
      this.imgOutput = '';
      const canvas = await html2canvas(document.getElementById('js-screenshot'), {
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
      });
      this.imgOutput = canvas.toDataURL('image/png');
      this.openScreenshot = true;
    },
    changeTier({ added, moved, removed }, val) {
      if (!val) {
        return;
      }
      if (added || moved || removed) {
        set(val, this.list[val].arr.map((e) => e.id), customStore);
      }
    },
    async clearAll() {
      await clear(customStore);
      this.reset();
      this.getData();
    },
    async reset() {
      this.list = Object.fromEntries([
        { name: 'S', bg: '#FF7F7F' },
        { name: 'A', bg: '#FFBF7F' },
        { name: 'B', bg: '#FFFF7F' },
        { name: 'C', bg: '#7FFF7F' },
        { name: 'D', bg: '#7FBFFF' },
        { name: 'E', bg: '#7F7FFF' },
        { name: 'F', bg: '#FF7FFF' },
      ].map((e) => ([e.name, { id: genId(), ...e, arr: [] }])));
      this.pool = [];
    },
    async getData() {
      this.loading = true;
      const { data } = await axios.get(`./data.json?v=${new Date().getTime()}`);
      const cacheMap = Object.fromEntries(await entries(customStore));
      const itemMap = Object.fromEntries(data.map((e) => [e.id, e]));

      let existArr = [];
      Object.keys(this.list).forEach((e) => {
        if (cacheMap[e] && Array.isArray(cacheMap[e])) {
          const val = cacheMap[e].map((i) => (itemMap[i])).filter((i) => !!i);
          this.$set(this.list[e], 'arr', val);
          existArr = [...existArr, ...cacheMap[e]];
        }
      });
      const existSet = new Set(existArr);
      data.forEach((e) => {
        if (!existSet.has(e.id)) {
          this.pool.push(e);
        }
      });
      this.loading = false;
    },
  },
  created() {
    this.reset();
    this.getData();
  },
};
</script>

<style lang="scss">
  .tierName {
    min-height: 80px;
    font-weight: 600;
    font-size: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .content--horizontal {
    display: grid;
    grid-template-columns: min(70%, 1200px) 1fr;
    grid-template-rows: 1fr;
    .content__pool {
      position: sticky;
      max-height: 100vh;
      overflow-x: hidden;
      overflow-y: auto;
      top: 0;
    }
    .searchBar {
      position: sticky;
      top: 0;
      background-color: #BFDDDB;
      z-index: 2;
    }
  }
  .maxWidth {
    max-width: 1200px;
    margin: 0 auto;
  }
  .cardgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 10px;
  }
  .tiergrid {
    display: grid;
    padding: 10px;
    grid-template-columns: 80px auto;
    gap: 10px;
    background-color: #000000;
  }
  .card {
    border-radius: 4px;
    overflow: hidden;
  }
  .snackcard {
    position: relative;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    width: 80px;
    height: 80px;
    &--lg {
      width: 400px;
      height: 400px;
    }
    &:hover {
      .snackcard__info {
        opacity: 1;
      }
    }
    &__info {
      opacity: 0;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }
    &__btn {
      pointer-events: auto;
      cursor: pointer;
    }
  }
  .screenshot {
    display: block;
    margin: 0 auto;
    max-width: 100%;
  }
  .floatBtn {
    position: absolute;
    top: 5px;
    right: 5px;
  }
  .imgScreenshot {
    display: block;
    margin: 0 auto;
  }
</style>
