<template>
  <v-container fluid class="pa-0 grey lighten-5">
    <v-sheet
      tile
      color="blue lighten-5"
      class="px-6 py-2 caption font-weight-medium"
    >
      {{ username }}/Labels/
    </v-sheet>

    <v-container fluid class="px-6 py-4">
      <v-row align="center" justify="space-between" class="mb-2">
        <v-col cols="12" md="8" class="d-flex align-center flex-wrap">
          <div class="text-h5 font-weight-bold mr-6 my-1">Labels Project</div>
          <div class="d-flex align-center my-1">
            <v-chip
              color="teal lighten-5"
              text-color="teal darken-2"
              label
              small
              class="font-weight-medium"
            >
              Total {{ labelCount }}
            </v-chip>
          </div>
        </v-col>
        <v-col cols="12" md="auto" class="d-flex justify-end flex-wrap py-1">
          <v-btn
            depressed
            small
            color="#009688"
            dark
            class="mr-2"
            @click="showCreateProjectDialog = true"
            >สร้าง Project</v-btn
          >
          <v-btn
            depressed
            small
            color="#6B7B8C"
            dark
            @click="showCreateLabelDialog = true"
            >สร้าง Label</v-btn
          >
        </v-col>
      </v-row>

      <v-row dense class="mb-2">
        <v-col cols="12" md="3">
          <v-autocomplete
            v-model="selectedProjectName"
            :items="searchOptions"
            outlined
            dense
            hide-details
            placeholder="เลือก project..."
            background-color="white"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-autocomplete
            v-model="selectedProductName"
            :items="productSearchOptions"
            outlined
            dense
            hide-details
            placeholder="ชื่อ product name..."
            background-color="white"
            clearable
            :disabled="!selectedProjectName"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-autocomplete
            v-model="selectedStatusIds"
            :items="statusFilterOptions"
            item-text="name"
            item-value="id"
            outlined
            dense
            hide-details
            clearable
            multiple
            placeholder="สถานะ..."
            background-color="white"
          >
            <template v-slot:selection="{ item }">
              <v-chip
                x-small
                class="font-weight-bold mr-1"
                pill
                :color="getLabelChipColor(item)"
                :text-color="getLabelChipTextColor(item)"
              >
                {{ item.name }}
              </v-chip>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="2">
          <v-menu
            v-model="startDateMenu"
            :close-on-content-click="false"
            offset-y
            transition="scale-transition"
            min-width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                :value="filterStartDate"
                outlined
                dense
                hide-details
                placeholder="สร้างโปรเจค..."
                background-color="white"
                clearable
                readonly
                prepend-inner-icon="mdi-calendar-arrow-right"
                v-bind="attrs"
                v-on="on"
                @click:clear="filterStartDate = null"
              />
            </template>
            <v-date-picker
              v-model="filterStartDate"
              no-title
              scrollable
              @input="startDateMenu = false"
            />
          </v-menu>
        </v-col>
        <v-col cols="12" md="2">
          <v-menu
            v-model="dueDateMenu"
            :close-on-content-click="false"
            offset-y
            transition="scale-transition"
            min-width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                :value="filterDueDate"
                outlined
                dense
                hide-details
                placeholder="ถึง..."
                background-color="white"
                clearable
                readonly
                prepend-inner-icon="mdi-calendar-clock"
                v-bind="attrs"
                v-on="on"
                @click:clear="filterDueDate = null"
              />
            </template>
            <v-date-picker
              v-model="filterDueDate"
              no-title
              scrollable
              :min="filterDueDateMin"
              @input="dueDateMenu = false"
            />
          </v-menu>
        </v-col>
      </v-row>

      <v-card v-if="loading" flat class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="teal" size="32" />
      </v-card>

      <v-card v-else-if="filteredLabels.length > 0" flat>
        <v-list dense>
          <template v-for="(label, index) in pagedLabels">
            <div :key="label.id">
              <v-list-item class="py-2" @click="openProject(label)">
                <v-list-item-avatar>
                  <v-avatar :color="label.color || 'grey lighten-2'" size="36">
                    <v-icon dark size="18">mdi-tag-outline</v-icon>
                  </v-avatar>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">
                    {{ label.name || "-" }}
                  </v-list-item-title>
                  <v-list-item-subtitle
                    class="d-flex align-center flex-wrap mt-1"
                    style="gap: 6px"
                  >
                    <span class="grey--text"
                      >                      # id {{ label.id }} ·
                      สร้างเมื่อ {{ formatDate(label.createdAt) }} · {{ timeAgo(label.updatedAt) }}</span
                    >

                    <template v-if="resolveStatus(label.status)">
                      <v-chip
                        x-small
                        class="font-weight-bold px-2"
                        pill
                        :color="getLabelChipColor(resolveStatus(label.status))"
                        :text-color="getLabelChipTextColor(resolveStatus(label.status))"
                      >
                        {{ resolveStatus(label.status).name }}
                      </v-chip>
                    </template>
                    <v-chip
                      v-else
                      x-small
                      label
                      color="grey lighten-3"
                      text-color="grey"
                      class="px-2"
                    >
                      ไม่มี status
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action class="d-flex flex-row align-center">
                  <v-btn
                    outlined
                    small
                    color="primary"
                    class="mr-2"
                    @click.stop="openEditDialog(label)"
                    >แก้ไข</v-btn
                  >
                  <v-icon small color="grey">mdi-chevron-right</v-icon>
                </v-list-item-action>
              </v-list-item>
              <v-divider v-if="index < pagedLabels.length - 1" />
            </div>
          </template>
        </v-list>
      </v-card>

      <v-sheet v-else outlined rounded class="py-12 text-center white">
        <v-icon size="64" color="grey lighten-1" class="mb-4"
          >mdi-tag-outline</v-icon
        >
        <div class="text-h6 mb-2">ยังไม่พบข้อมูล label</div>
        <div class="body-2 grey--text">
          กดปุ่ม Create Label เพื่อสร้างรายการใหม่
        </div>
      </v-sheet>

      <div
        class="d-flex flex-wrap align-center justify-end mt-4"
        style="gap: 16px"
      >
        <div class="d-flex align-center">
          <span class="caption grey--text text--darken-1 mr-2">Show Item</span>
          <v-select
            v-model="itemsPerPage"
            :items="itemsPerPageOptions"
            dense
            outlined
            hide-details
            style="max-width: 96px"
            :menu-props="{ offsetY: true, maxHeight: 200 }"
          />
        </div>
        <div class="d-flex align-center">
          <v-btn small icon :disabled="currentPage <= 1" @click="currentPage--">
            <v-icon small>mdi-chevron-left</v-icon>
          </v-btn>
          <span class="caption grey--text text--darken-1 mx-2"
            >Page {{ currentPage }}/{{ totalPages }}</span
          >
          <v-btn
            small
            icon
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            <v-icon small>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </div>
    </v-container>

    <CreateProjectDialog v-model="showCreateProjectDialog" @success="getLabels" />
    <CreateLabelDialog v-model="showCreateLabelDialog" @success="getLabels" />
    <UpdateLabelDialog
      v-model="showUpdateLabelDialog"
      :label="selectedLabel"
      @success="onLabelUpdated"
    />
  </v-container>
</template>

<script>
import CreateLabelDialog from "./createLabels.vue";
import UpdateLabelDialog from "./updateLabels.vue";
import CreateProjectDialog from "./createProject.vue";
import labelChipMixin from "~/mixins/labelChip";

export default {
  name: "ProjectIndexPage",
  mixins: [labelChipMixin],
  components: { CreateLabelDialog, UpdateLabelDialog, CreateProjectDialog },

  data() {
    return {
      selectedProjectName: null,
      selectedProductName: null,
      selectedStatusIds: [],
      filterStartDate: null,
      filterDueDate: null,
      startDateMenu: false,
      dueDateMenu: false,
      showCreateLabelDialog: false,
      showCreateProjectDialog: false,
      showUpdateLabelDialog: false,
      selectedLabel: null,
      itemsPerPage: 20,
      currentPage: 1,
      statusLabels: [],
    };
  },

  computed: {
    username() {
      return this.$store.getters["auth/currentUser"]?.username || "username";
    },
    labels() {
      return this.$store.getters["labels/labels"] || [];
    },
    loading() {
      return this.$store.getters["labels/loading"];
    },
    products() {
      return this.$store.getters["product/products"] || [];
    },
    labelCount() {
      return this.labels.length;
    },
    searchOptions() {
      return [...new Set(this.labels.map((l) => l.name))]
        .filter(Boolean)
        .sort();
    },
    productSearchOptions() {
      if (!this.selectedProjectName) return [];
      const relatedProducts = this.getProductsByProjectLabel(this.selectedProjectName);
      return [...new Set(relatedProducts.map((p) => p.name))]
        .filter(Boolean)
        .sort();
    },
    statusFilterOptions() {
      return [...this.statusLabels].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""))
      );
    },
    filterDueDateMin() {
      return this.filterStartDate || undefined;
    },
    itemsPerPageOptions() {
      const options = [20, 60, 100];
      const total = this.filteredLabels.length || 0;
      if (total > 100) {
        const maxOption = Math.ceil(total / 100) * 100;
        for (let size = 200; size <= maxOption; size += 100) {
          options.push(size);
        }
      }
      return options;
    },
    filteredLabels() {
      const selectedProject = this.selectedProjectName || "";
      const selectedProduct = this.selectedProductName || "";
      const selectedStatusIds = (this.selectedStatusIds || []).map(Number);
      const dateFrom = this.filterStartDate || null;
      const dateTo = this.filterDueDate || null;
      const hasDateFilter = !!(dateFrom || dateTo);

      return this.labels.filter((label) => {
        // 1. กรองตาม project ที่เลือก
        if (selectedProject && label.name !== selectedProject) return false;

        // 2. กรองตาม status
        if (
          selectedStatusIds.length > 0 &&
          !selectedStatusIds.includes(Number(label.status))
        ) {
          return false;
        }

        // 3. กรองตาม created_at
        if (hasDateFilter) {
          if (!this.isDateWithinRange(label.createdAt, dateFrom, dateTo)) return false;
        }

        // 4. กรองตาม product name ใน project นั้น
        if (!selectedProduct) return true;

        const relatedProducts = this.getProductsByProjectLabel(label.name);

        return relatedProducts.some((product) =>
          product.name === selectedProduct
        );
      });
    },
    totalPages() {
      return Math.ceil(this.filteredLabels.length / this.itemsPerPage) || 1;
    },
    pagedLabels() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredLabels.slice(start, end);
    },
    statusMap() {
      const map = {};
      this.statusLabels.forEach((s) => {
        map[Number(s.id)] = s;
      });
      return map;
    },
  },

  watch: {
    selectedProjectName() {
      this.selectedProductName = null;
      this.currentPage = 1;
    },
    filterStartDate(newVal) {
      if (newVal && this.filterDueDate && this.filterDueDate < newVal) {
        this.filterDueDate = null;
      }
    },
    itemsPerPage() {
      this.currentPage = 1;
    },
    filteredLabels() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages || 1;
      }
    },
  },

  async mounted() {
    try {
      await Promise.all([
        this.getLabels(),
        this.loadStatusLabels(),
        this.getProducts(),
      ]);
    } catch (error) {
      console.error("ไม่สามารถโหลดหน้า labels ได้", error);
    }
  },

  methods: {
    async getLabels() {
      try {
        await this.$store.dispatch("labels/getLabels", {
          filter: "type||$eq||1",
          params: { limit: 9999 },
        });
      } catch (e) {
        console.error("ไม่สามารถดึงข้อมูล Labels ได้", e);
      }
    },
    async loadStatusLabels() {
      try {
        const result = await this.$store.dispatch("labels/getLabelsName", {
          type: 4,
        });
        this.statusLabels = result.success ? result.data || [] : [];
      } catch (e) {
        console.error("ไม่สามารถดึง status labels ได้", e);
        this.statusLabels = [];
      }
    },
    async getProducts() {
      try {
        await this.$store.dispatch("product/getProducts");
      } catch (e) {
        console.error("ไม่สามารถดึงข้อมูล Products ได้", e);
      }
    },
    parseLabels(labels) {
      if (!labels) return [];
      if (typeof labels === "string" && labels.includes(",")) {
        return labels
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (Array.isArray(labels)) {
        return labels
          .map((item) =>
            typeof item === "object" ? (item.name || "").trim() : (item || "").trim()
          )
          .filter(Boolean);
      }
      if (typeof labels === "string") return [labels.trim()].filter(Boolean);
      return [];
    },
    getProductsByProjectLabel(projectName) {
      if (!projectName) return [];
      return this.products.filter((product) =>
        this.parseLabels(product.labels).includes(projectName)
      );
    },
    normalizeDate(value) {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    isDateWithinRange(value, from, to) {
      if (!from && !to) return true;
      const normalized = this.normalizeDate(value);
      if (!normalized) return false;
      if (from && normalized < from) return false;
      if (to && normalized > to) return false;
      return true;
    },
    resolveStatus(statusId) {
      if (!statusId) return null;
      return this.statusMap[Number(statusId)] || null;
    },
    onLabelUpdated(updatedLabel) {
      if (updatedLabel) {
        this.$store.commit("labels/UPDATE_LABEL", updatedLabel);
        if (this.selectedLabel?.id === updatedLabel.id) {
          this.selectedLabel = { ...updatedLabel };
        }
      }
    },
    async openProject(project) {
      await this.$store.dispatch("project/setCurrentProject", project);
      this.$store.commit("product/SET_LABEL_FILTER", null);
      this.$store.commit("issue/SET_LABEL_FILTER", null);
      this.$router.push("/product");
    },
    openEditDialog(label) {
      this.selectedLabel = label;
      this.showUpdateLabelDialog = true;
    },

    formatDate(dateString) {
      if (!dateString) return "ไม่ทราบวันที่";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "ไม่ทราบวันที่";
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    },
    timeAgo(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const days = Math.floor((new Date() - date) / 86400000);
      if (days === 0) return "อัปเดตวันนี้";
      return `อัปเดต ${days} วันที่แล้ว`;
    },
  },

  head() {
    return { title: "Labels - GitLab Issue Tracker" };
  },
};
</script>
