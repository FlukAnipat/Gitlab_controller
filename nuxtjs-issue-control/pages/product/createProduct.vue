<template>
  <div>
    <v-dialog
      :value="value"
      @input="$emit('input', $event)"
      @keydown.esc="closeDialog"
      max-width="1120"
      persistent
      scrollable
    >
      <v-card
        elevation="0"
        class="rounded-xl overflow-hidden"
        style="box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.18) !important"
      >
        <v-card-title class="white px-10 pt-9 pb-0">
          <div
            class="d-flex align-center justify-space-between"
            style="width: 100%"
          >
            <div class="d-flex align-center">
              <v-avatar
                rounded
                size="34"
                class="mr-3"
                color="rgba(0,168,150,0.08)"
              >
                <v-icon size="20" color="#00A896"
                  >mdi-plus-circle-outline</v-icon
                >
              </v-avatar>
              <h2
                class="text-h5 font-weight-bold grey--text text--darken-4 mb-0"
                style="letter-spacing: -0.025em"
              >
                Create Product
              </h2>
            </div>
            <v-btn icon plain @click="closeDialog" aria-label="ปิดหน้าต่าง">
              <v-icon size="22" color="grey lighten-1">mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <v-card-text
          class="px-0 pt-0 pb-0"
          style="height: 72vh; overflow-y: auto"
        >
          <v-row no-gutters style="height: 100%">
            <v-col
              cols="12"
              md="8"
              class="white px-10 pt-7 pb-4"
              style="border-right: 1px solid #f3f4f6"
            >
              <div
                class="text-caption font-weight-bold grey--text text-uppercase mb-2"
                style="letter-spacing: 0.07em"
              >
                Product Name <span class="red--text text--lighten-1">*</span>
              </div>
              <v-text-field
                id="product-name"
                v-model.trim="form.name"
                placeholder="ระบุชื่อ Product ที่ชัดเจน..."
                outlined
                background-color="#f9fafb"
                color="#00A896"
                hide-details
                autofocus
                maxlength="200"
                aria-required="true"
                class="font-weight-bold mb-5 rounded-lg"
              />

              <div
                class="d-flex align-center mb-6"
                style="flex-wrap: wrap; gap: 8px"
              >
                <div
                  class="text-caption font-weight-bold grey--text text-uppercase mr-3 mb-0"
                  style="letter-spacing: 0.07em"
                >
                  Type
                </div>
                <v-chip-group
                  v-model="form.issueType"
                  mandatory
                  active-class="font-weight-bold"
                >
                  <v-chip
                    v-for="t in productTypes"
                    :key="t.value"
                    :value="t.value"
                    :color="
                      form.issueType === t.value
                        ? 'rgba(0,168,150,0.08)'
                        : '#f3f4f6'
                    "
                    :text-color="
                      form.issueType === t.value ? '#00a896' : 'grey darken-1'
                    "
                    class="font-weight-medium px-4"
                    small
                  >
                    <v-icon
                      left
                      size="14"
                      :color="
                        form.issueType === t.value ? '#00a896' : 'grey darken-1'
                      "
                      >{{ t.icon }}</v-icon
                    >
                    {{ t.label }}
                  </v-chip>
                </v-chip-group>
              </div>

              <v-divider class="mb-5" style="border-color: #f3f4f6" />

              <div
                class="text-caption font-weight-bold grey--text text-uppercase mb-2"
                style="letter-spacing: 0.07em"
              >
                Description
              </div>
              <v-sheet outlined rounded="lg" class="overflow-hidden mb-4">
                <client-only>
                  <vue-editor
                    v-model="form.description"
                    ref="productCreateEditor"
                    :use-custom-image-handler="true"
                    placeholder="อธิบาย Product ให้ละเอียด..."
                    :editor-toolbar="EDITOR_TOOLBAR"
                    @image-added="onEditorImageAdded"
                  />
                </client-only>
              </v-sheet>
            </v-col>

            <v-col cols="12" md="4" class="grey lighten-5 px-8 pt-7 pb-4">
              <p
                class="text-caption font-weight-bold grey--text text--lighten-1 text-uppercase mb-5"
                style="letter-spacing: 0.09em"
              >
                Properties
              </p>

              <div class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon size="16" color="blue lighten-2" class="mr-2"
                    >mdi-account-outline</v-icon
                  >
                  <span
                    class="text-subtitle-2 font-weight-bold grey--text text--darken-3"
                    >Assignee</span
                  >
                </div>
                <v-autocomplete
                  v-model="form.assigneeUsername"
                  :items="availableUsers"
                  placeholder="เลือก Assignee..."
                  dense
                  outlined
                  hide-details
                  clearable
                  background-color="white"
                  color="#00A896"
                  class="rounded-lg"
                  :menu-props="{ maxHeight: '220px', offsetY: true }"
                />
              </div>

              <!-- Labels — 4 dropdown แยกตาม type พิมพ์ค้นหาได้ -->
              <div class="mb-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center">
                    <v-icon size="16" color="purple lighten-2" class="mr-2"
                      >mdi-tag-outline</v-icon
                    >
                    <span
                      class="text-subtitle-2 font-weight-bold grey--text text--darken-3"
                      >Labels</span
                    >
                  </div>
                  <v-btn
                    x-small
                    text
                    color="grey"
                    class="text-none"
                    @click="clearAllLabels"
                    >ล้างทั้งหมด</v-btn
                  >
                </div>
                <v-sheet
                  rounded="lg"
                  class="pa-3"
                  style="background: #f3f4f6; border: 1px solid #e5e7eb"
                >
                  <div class="mb-3">
                    <div class="d-flex align-center mb-1">
                      <v-icon size="13" color="#009688" class="mr-1"
                        >mdi-briefcase-outline</v-icon
                      >
                      <span
                        class="text-caption font-weight-bold"
                        style="color: #009688"
                        >Job type</span
                      >
                    </div>
                    <v-autocomplete
                      v-model="form.labelByType[0]"
                      :items="labelsByType[0]"
                      item-text="name"
                      item-value="name"
                      placeholder="ค้นหาหรือเลือก..."
                      dense
                      outlined
                      hide-details
                      clearable
                      multiple
                      background-color="white"
                      color="#009688"
                      class="rounded-lg"
                      :menu-props="{ maxHeight: '220px', offsetY: true }"
                    >
                      <template v-slot:selection="{ item }">
                        <v-chip
                          small
                          close
                          class="mr-1 mb-1 font-weight-bold"
                          pill
                          :color="getLabelChipColor(item.name || item)"
                          :text-color="getLabelChipTextColor(item.name || item)"
                          @click:close="
                            removeLabelFromType(0, item.name || item)
                          "
                          >{{ item.name || item }}</v-chip
                        >
                      </template>
                      <template v-slot:item="{ item, on, attrs }">
                        <v-list-item v-on="on" v-bind="attrs" class="py-1">
                          <v-list-item-icon
                            class="mr-2 my-auto"
                            style="min-width: 20px"
                          >
                            <v-icon
                              v-if="
                                form.labelByType[0].includes(item.name || item)
                              "
                              small
                              color="primary"
                              >mdi-check</v-icon
                            >
                          </v-list-item-icon>
                          <v-list-item-content class="py-0">
                            <div class="d-flex align-center">
                              <div
                                :style="{
                                  backgroundColor:
                                    labelColorMap[item.name || item] ||
                                    '#9E9E9E',
                                  width: '16px',
                                  height: '8px',
                                  borderRadius: '10px',
                                }"
                                class="mr-3"
                              ></div>
                              <span
                                class="text-body-2 grey--text text--darken-3 font-weight-medium"
                              >
                                {{ item.name || item }}
                              </span>
                            </div>
                          </v-list-item-content>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </div>

                  <div class="mb-3">
                    <div class="d-flex align-center mb-1">
                      <v-icon size="13" color="#E65100" class="mr-1"
                        >mdi-folder-outline</v-icon
                      >
                      <span
                        class="text-caption font-weight-bold"
                        style="color: #e65100"
                        >Project</span
                      >
                    </div>
                    <v-autocomplete
                      v-model="form.labelByType[1]"
                      :items="labelsByType[1]"
                      :filter="filterProjectDropdown"
                      item-text="name"
                      item-value="name"
                      placeholder="ค้นหาหรือเลือก..."
                      dense
                      outlined
                      hide-details
                      multiple
                      hide-selected
                      background-color="white"
                      color="#E65100"
                      class="rounded-lg"
                      :menu-props="{ maxHeight: '220px', offsetY: true }"
                    >
                      <template v-slot:selection="{ item }">
                        <v-chip
                          small
                          :close="
                            !preSelectedProjectLabelNames.includes(
                              item.name || item
                            )
                          "
                          class="mr-1 mb-1 font-weight-bold"
                          pill
                          :color="getLabelChipColor(item.name || item)"
                          :text-color="getLabelChipTextColor(item.name || item)"
                          @click:close="
                            removeLabelFromType(1, item.name || item)
                          "
                          >{{ item.name || item }}</v-chip
                        >
                      </template>
                      <template v-slot:item="{ item, on, attrs }">
                        <v-list-item v-on="on" v-bind="attrs" class="py-1">
                          <v-list-item-icon
                            class="mr-2 my-auto"
                            style="min-width: 20px"
                          >
                            <v-icon
                              v-if="
                                form.labelByType[1].includes(item.name || item)
                              "
                              small
                              color="primary"
                              >mdi-check</v-icon
                            >
                          </v-list-item-icon>
                          <v-list-item-content class="py-0">
                            <div class="d-flex align-center">
                              <div
                                :style="{
                                  backgroundColor:
                                    labelColorMap[item.name || item] ||
                                    '#9E9E9E',
                                  width: '16px',
                                  height: '8px',
                                  borderRadius: '10px',
                                }"
                                class="mr-3"
                              ></div>
                              <span
                                class="text-body-2 grey--text text--darken-3 font-weight-medium"
                              >
                                {{ item.name || item }}
                              </span>
                            </div>
                          </v-list-item-content>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </div>

                  <div class="mb-3">
                    <div class="d-flex align-center mb-1">
                      <v-icon size="13" color="#1867C5" class="mr-1"
                        >mdi-check-circle-outline</v-icon
                      >
                      <span
                        class="text-caption font-weight-bold"
                        style="color: #1867c5"
                        >Status</span
                      >
                    </div>
                    <v-autocomplete
                      v-model="form.labelByType[2]"
                      :items="labelsByType[2]"
                      item-text="name"
                      item-value="name"
                      placeholder="ค้นหาหรือเลือก..."
                      dense
                      outlined
                      hide-details
                      clearable
                      background-color="white"
                      color="#1867C5"
                      class="rounded-lg"
                      :menu-props="{ maxHeight: '220px', offsetY: true }"
                    >
                      <template v-slot:selection="{ item }">
                        <v-chip
                          small
                          class="mr-1 mb-1 font-weight-bold"
                          pill
                          :color="getLabelChipColor(item.name || item)"
                          :text-color="getLabelChipTextColor(item.name || item)"
                          >{{ item.name || item }}</v-chip
                        >
                      </template>
                      <template v-slot:item="{ item, on, attrs }">
                        <v-list-item v-on="on" v-bind="attrs" class="py-1">
                          <v-list-item-icon
                            class="mr-2 my-auto"
                            style="min-width: 20px"
                          >
                            <v-icon
                              v-if="form.labelByType[2] === (item.name || item)"
                              small
                              color="primary"
                              >mdi-check</v-icon
                            >
                          </v-list-item-icon>
                          <v-list-item-content class="py-0">
                            <div class="d-flex align-center">
                              <div
                                :style="{
                                  backgroundColor:
                                    labelColorMap[item.name || item] ||
                                    '#9E9E9E',
                                  width: '16px',
                                  height: '8px',
                                  borderRadius: '10px',
                                }"
                                class="mr-3"
                              ></div>
                              <span
                                class="text-body-2 grey--text text--darken-3 font-weight-medium"
                              >
                                {{ item.name || item }}
                              </span>
                            </div>
                          </v-list-item-content>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </div>

                  <div class="mb-3">
                    <div class="d-flex align-center mb-1">
                      <v-icon size="13" color="#7B1FA2" class="mr-1"
                        >mdi-account-outline</v-icon
                      >
                      <span
                        class="text-caption font-weight-bold"
                        style="color: #7b1fa2"
                        >Role</span
                      >
                    </div>
                    <v-autocomplete
                      v-model="form.labelByType[3]"
                      :items="labelsByType[3]"
                      item-text="name"
                      item-value="name"
                      placeholder="ค้นหาหรือเลือก..."
                      dense
                      outlined
                      hide-details
                      clearable
                      background-color="white"
                      color="#7B1FA2"
                      class="rounded-lg"
                      :menu-props="{ maxHeight: '220px', offsetY: true }"
                    >
                      <template v-slot:selection="{ item }">
                        <v-chip
                          small
                          class="mr-1 mb-1 font-weight-bold"
                          pill
                          :color="getLabelChipColor(item.name || item)"
                          :text-color="getLabelChipTextColor(item.name || item)"
                          >{{ item.name || item }}</v-chip
                        >
                      </template>
                      <template v-slot:item="{ item, on, attrs }">
                        <v-list-item v-on="on" v-bind="attrs" class="py-1">
                          <v-list-item-icon
                            class="mr-2 my-auto"
                            style="min-width: 20px"
                          >
                            <v-icon
                              v-if="form.labelByType[3] === (item.name || item)"
                              small
                              color="primary"
                              >mdi-check</v-icon
                            >
                          </v-list-item-icon>
                          <v-list-item-content class="py-0">
                            <div class="d-flex align-center">
                              <div
                                :style="{
                                  backgroundColor:
                                    labelColorMap[item.name || item] ||
                                    '#9E9E9E',
                                  width: '16px',
                                  height: '8px',
                                  borderRadius: '10px',
                                }"
                                class="mr-3"
                              ></div>
                              <span
                                class="text-body-2 grey--text text--darken-3 font-weight-medium"
                              >
                                {{ item.name || item }}
                              </span>
                            </div>
                          </v-list-item-content>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </div>
                </v-sheet>
              </div>

              <div class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon size="16" color="teal accent-4" class="mr-2"
                    >mdi-flag-outline</v-icon
                  >
                  <span
                    class="text-subtitle-2 font-weight-bold grey--text text--darken-3"
                    >Milestone</span
                  >
                </div>
                <v-select
                  v-model="form.milestone"
                  :items="milestoneOptions"
                  placeholder="เลือก Milestone..."
                  dense
                  outlined
                  hide-details
                  clearable
                  background-color="white"
                  color="#00A896"
                  class="rounded-lg"
                  :menu-props="{ maxHeight: '220px', offsetY: true }"
                />
              </div>

              <div class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon size="16" color="amber darken-1" class="mr-2"
                    >mdi-calendar-range-outline</v-icon
                  >
                  <span
                    class="text-subtitle-2 font-weight-bold grey--text text--darken-3"
                    >Dates</span
                  >
                </div>
                <!-- Start Date -->
                <v-menu
                  v-model="startDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      :value="toDisplayDate(form.startDate)"
                      :label="`Start Date (${toDisplayDate(form.startDate) || 'วว/ดด/ปปปป'})`"
                      prepend-inner-icon="mdi-calendar"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                      outlined
                      dense
                      hide-details
                      clearable
                      background-color="white"
                      color="#00A896"
                      class="rounded-lg mb-2"
                      @click:clear="form.startDate = null"
                    />
                  </template>
                  <v-date-picker
                    v-model="form.startDate"
                    :max="form.dueDate"
                    no-title
                    scrollable
                    @input="startDateMenu = false"
                  />
                </v-menu>

                <!-- Due Date -->
                <v-menu
                  v-model="dueDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      :value="toDisplayDate(form.dueDate)"
                      :label="`Due Date (${toDisplayDate(form.dueDate) || 'วว/ดด/ปปปป'})`"
                      prepend-inner-icon="mdi-calendar"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                      outlined
                      dense
                      hide-details
                      clearable
                      background-color="white"
                      color="#00A896"
                      class="rounded-lg"
                      @click:clear="form.dueDate = null"
                    />
                  </template>
                  <v-date-picker
                    v-model="form.dueDate"
                    :min="form.startDate"
                    no-title
                    scrollable
                    @input="dueDateMenu = false"
                  />
                </v-menu>
              </div>

              <div class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon size="16" color="red lighten-2" class="mr-2"
                    >mdi-contacts-outline</v-icon
                  >
                  <span
                    class="text-subtitle-2 font-weight-bold grey--text text--darken-3"
                    >Contacts</span
                  >
                </div>
                <v-text-field
                  v-model="form.contacts"
                  placeholder="ระบุ Contact..."
                  dense
                  outlined
                  hide-details
                  clearable
                  background-color="white"
                  color="#00A896"
                  class="rounded-lg"
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider style="border-color: #f3f4f6" />

        <v-card-actions class="grey lighten-5 px-10 py-5">
          <div class="d-flex align-center mr-3">
            <span
              class="text-subtitle-2 font-weight-bold grey--text text--darken-3 mr-2"
              >จำนวน</span
            >
            <v-text-field
              v-model.number="form.count"
              placeholder="จำนวน"
              dense
              outlined
              hide-details
              type="number"
              min="1"
              max="100"
              style="max-width: 100px"
              class="rounded-lg"
            />
          </div>
          <v-spacer />
          <v-btn
            outlined
            text
            color="grey darken-2"
            class="text-none rounded-lg mr-3 font-weight-bold"
            elevation="0"
            height="40"
            :disabled="loading"
            @click="closeDialog"
            >ยกเลิก</v-btn
          >
          <v-btn
            color="#00A896"
            class="white--text text-none rounded-lg font-weight-bold px-6"
            elevation="0"
            height="40"
            :loading="loading"
            :disabled="!isFormValid || loading"
            @click="submitCreate"
          >
            <v-icon size="16" class="mr-1">mdi-plus</v-icon>เพิ่ม Product
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import labelChipMixin from "~/mixins/labelChip";
import milestoneOrderingMixin from "~/mixins/milestoneOrdering";
import dateFormatMixin from "~/mixins/dateFormat";

const PRODUCT_TYPES = Object.freeze([
  { value: "product", label: "Product", icon: "mdi-package-variant" },
]);

const EDITOR_TOOLBAR = Object.freeze([
  ["undo", "redo"],
  [{ header: [false, 1, 2, 3, 4, 5, 6] }],
  ["bold", "italic", "underline", "strike"],
  [
    { align: "" },
    { align: "center" },
    { align: "right" },
    { align: "justify" },
  ],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ indent: "-1" }, { indent: "+1" }],
  ["link", "image", "video"],
  ["blockquote", "code-block"],
  [{ color: [] }, { background: [] }],
  ["clean"],
]);

const createDefaultForm = () => ({
  name: "",
  description: "",
  issueType: "product",
  state: "opened",
  labelByType: { 0: [], 1: [], 2: null, 3: null },
  milestone: "",
  assigneeUsername: "",
  dueDate: "",
  startDate: "",
  contacts: "",
  confidential: false,
  weight: null,
  count: 1,
});

export default {
  name: "CreateProductDialog",
  mixins: [labelChipMixin, milestoneOrderingMixin, dateFormatMixin],

  components: {
    VueEditor: () =>
      process.client
        ? import("vue2-editor").then((m) => m.VueEditor)
        : Promise.resolve({ render: () => null }),
  },

  props: {
    value: { type: Boolean, default: false },
  },

  emits: ["input", "success"],

  data() {
    return {
      form: createDefaultForm(),
      loading: false,
      projectMembers: [],
      productTypes: PRODUCT_TYPES,
      EDITOR_TOOLBAR,
      milestones: [],
      // labels แยกตาม type จาก API
      labelsByType: { 0: [], 1: [], 2: [], 3: [] },
      // milestoneProjectId เก็บไว้แค่เพื่อโหลด milestones — ไม่ส่งไป backend
      milestoneProjectId: null,

      // UI Menus
      startDateMenu: false,
      dueDateMenu:   false,
    };
  },

  computed: {
    currentProject() {
      return this.$store.getters["project/currentProject"];
    },
    projects() {
      return this.$store.getters["project/projects"] || [];
    },
    targetProductProject() {
      return this.projects.find(
        (project) =>
          Number(project.status) === 1 &&
          String(project.projectType || "").toLowerCase() === "product"
      ) || this.projects.find(
        (project) => String(project.projectType || "").toLowerCase() === "product"
      );
    },
    isFormValid() {
      return !!this.form.name.trim() && !!this.targetProductProject?.id;
    },
    availableUsers() {
      const usernames = this.projectMembers.filter(Boolean);
      const currentUsername = this.$store.getters["auth/currentUser"]?.username;
      if (currentUsername && !usernames.includes(currentUsername))
        usernames.unshift(currentUsername);
      return [...new Set(usernames)].sort((a, b) => a.localeCompare(b));
    },
    milestoneOptions() {
      return this.sortMilestonesByCurrentMonth(this.milestones).map(
        (m) => m.title
      );
    },
    labelColorMap() {
      const map = {};
      Object.values(this.labelsByType)
        .flat()
        .forEach((l) => {
          if (l.name && l.color) map[l.name] = l.color;
        });
      return map;
    },
    // label names ที่ถูก pre-select จาก project ปัจจุบัน (lock ไว้ ลบไม่ได้)
    preSelectedProjectLabelNames() {
      if (!this.currentProject) return [];
      const isLabelContext =
        this.currentProject.color ||
        this.currentProject.type !== undefined ||
        this.currentProject.status ||
        (!this.currentProject.gitlabProjectId &&
          !this.currentProject.pathWithNamespace);
      if (!isLabelContext) return [];
      const raw = this.currentProject?.labels || this.currentProject?.name;
      if (!raw) return [];
      const labelNames = Array.isArray(raw)
        ? raw.filter(Boolean)
        : typeof raw === "string"
        ? raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const type1Names = new Set(
        (this.labelsByType[1] || []).map((l) =>
          l.name !== undefined ? l.name : l
        )
      );
      return labelNames.filter((l) => type1Names.has(l));
    },
    // labels type 1 ที่เลือกได้เพิ่มเติม (ไม่รวม pre-selected)
    availableProjectLabels() {
      const locked = new Set(this.preSelectedProjectLabelNames);
      return (this.labelsByType[1] || []).filter(
        (l) => !locked.has(l.name !== undefined ? l.name : l)
      );
    },
  },

  watch: {
    value(isOpen) {
      if (isOpen) {
        this.resetForm();
        this.getData();
        this.$nextTick(() => this._registerQuillPaste());
      }
    },
  },

  async mounted() {
    try {
      await this.getData();
      this.$nextTick(() => this._registerQuillPaste());
    } catch (error) {
      console.error("ไม่สามารถโหลดหน้า create product ได้", error);
    }
  },

  methods: {
    toDisplayDate(value) {
      if (!value) return "";
      const date = new Date(value);
      if (isNaN(date.getTime())) return "";
      const dd = date.getDate().toString().padStart(2, "0");
      const mm = (date.getMonth() + 1).toString().padStart(2, "0");
      const yyyy = date.getFullYear() + 543;
      return `${dd}/${mm}/${yyyy}`;
    },
    // ── label helpers ──
    removeLabelFromType(type, labelName) {
      const arr = this.form.labelByType[type];
      const idx = arr.indexOf(labelName);
      if (idx !== -1) arr.splice(idx, 1);
    },
    clearAllLabels() {
      this.form.labelByType = { 0: [], 1: [], 2: null, 3: null };
    },
    getMergedLabels() {
      const merged = [];
      for (let t = 0; t <= 3; t++) {
        const val = this.form.labelByType[t];
        if (Array.isArray(val)) {
          merged.push(...val);
        } else if (val) {
          merged.push(val);
        }
      }
      return merged;
    },

    // ── color helpers ──

    // filter สำหรับ Project autocomplete — ซ่อน locked labels จาก dropdown แต่ยังแสดง chip ได้
    filterProjectDropdown(item, queryText, itemText) {
      const name = item.name !== undefined ? item.name : item;
      if (this.preSelectedProjectLabelNames.includes(name)) return false;
      return itemText
        .toLocaleLowerCase()
        .includes(queryText.toLocaleLowerCase());
    },
    // parse labels จาก string หรือ array
    parseLabels(labels) {
      if (!labels) return [];
      if (Array.isArray(labels)) return labels.filter(Boolean);
      if (typeof labels === "string")
        return labels
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return [];
    },
    // pre-select labels ของ project ปัจจุบัน (type 1) ใน form
    // ใช้ logic เดียวกับ activeLabelFilters ใน index.vue:
    // Label Projects (ไม่มี gitlabProjectId) จะใช้ชื่อ project เป็นชื่อ label
    preSelectProjectLabels() {
      if (!this.currentProject) return;
      const isLabelContext =
        this.currentProject.color ||
        this.currentProject.type !== undefined ||
        this.currentProject.status ||
        (!this.currentProject.gitlabProjectId &&
          !this.currentProject.pathWithNamespace);
      if (!isLabelContext) return;
      const raw = this.currentProject?.labels || this.currentProject?.name;
      const projectLabels = this.parseLabels(raw);
      if (!projectLabels.length) return;
      const type1Names = new Set(
        (this.labelsByType[1] || []).map((l) =>
          l.name !== undefined ? l.name : l
        )
      );
      this.form.labelByType[1] = projectLabels.filter((l) => type1Names.has(l));
    },

    // ── data loading ──
    async getData() {
      try {
        const [t0, t1, t2, t3] = await Promise.all([
          this.$store.dispatch("labels/getLabelsName", { type: 0 }),
          this.$store.dispatch("labels/getLabelsName", { type: 1 }),
          this.$store.dispatch("labels/getLabelsName", { type: 2 }),
          this.$store.dispatch("labels/getLabelsName", { type: 3 }),
          this.$store.dispatch("project/getProjects"),
        ]);

        this.labelsByType = {
          0: t0.data || [],
          1: t1.data || [],
          2: t2.data || [],
          3: t3.data || [],
        };

        // pre-select type-1 (Project) labels ที่ตรงกับ project ปัจจุบัน
        this.preSelectProjectLabels();

        await this.getMilestones();

        const result = await this.$store.dispatch(
          "project/getProjectMembers",
          this.targetProductProject?.gitlabProjectId
        );
        this.projectMembers = (result.data || [])
          .map((member) => member.username)
          .filter(Boolean)
          .sort();
      } catch (error) {
        console.error("Error getting dropdown data:", error);
        this.projectMembers = [];
      }
    },

    // โหลด milestones โดยหา project id จาก store
    // backend fallback _getProjectByUserId ให้เองอยู่แล้ว — ใช้ id นี้แค่เพื่อโหลด milestones เท่านั้น
    async getMilestones() {
      try {
        const projectId = this.targetProductProject?.id || null;

        this.milestoneProjectId = projectId;
        if (!projectId) return;

        const result = await this.$store.dispatch(
          "project/getProjectMilestones",
          projectId
        );
        this.milestones = result.data || [];
      } catch (error) {
        console.error("Failed to load milestones:", error);
        this.milestones = [];
      }
    },

    // ── form ──
    resetForm() {
      this.form = createDefaultForm();
    },
    closeDialog() {
      if (this.loading) return;
      this.$emit("input", false);
      this.resetForm();
    },
    cleanDescription(html) {
      if (!html) return "";
      const temp = document.createElement("div");
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || "";
    },
    async resolveUploadProjectId() {
      return this.targetProductProject?.id || null;
    },
    async onEditorImageAdded(file, Editor, cursorLocation, resetUploader) {
      try {
        let projectId = await this.resolveUploadProjectId();
        if (!projectId) {
          resetUploader?.();
          return;
        }

        const index =
          typeof cursorLocation === "number"
            ? cursorLocation
            : Editor.getSelection(true)?.index ?? Editor.getLength();

        const PLACEHOLDER = "[กำลังอัปโหลดรูปภาพ...]";
        const placeholderFull = "\n" + PLACEHOLDER + "\n";

        const removePlaceholder = () => {
          try {
            const txt = Editor.getText();
            const pi = txt.indexOf(PLACEHOLDER);
            if (pi !== -1)
              Editor.deleteText(Math.max(0, pi - 1), placeholderFull.length);
          } catch (_) {}
        };

        Editor.insertText(index, placeholderFull, "user");

        try {
          const formData = new FormData();
          formData.append("file", file, file.name || `paste-${Date.now()}.png`);
          const res = await this.$store.dispatch("project/uploadFile", {
            projectId,
            formData,
          });

          const md = res.data?.markdown;
          removePlaceholder();

          if (md) {
            const newIndex = Editor.getSelection(true)?.index ?? index;
            Editor.insertText(newIndex, "\n" + md + "\n", "user");
            Editor.setSelection(newIndex + md.length + 2, 0);
          }
          resetUploader?.();
        } catch (err) {
          console.error("upload image error:", err);
          removePlaceholder();
          resetUploader?.();
        }
      } catch (err) {
        console.error("onEditorImageAdded error:", err);
        resetUploader?.();
      }
    },
    _registerQuillPaste() {
      if (!process.client) return;
      const quill = this.$refs.productCreateEditor?.quill;
      if (!quill) {
        setTimeout(() => this._registerQuillPaste(), 300);
        return;
      }
      if (this._quillPasteHandler) {
        quill.root.removeEventListener("paste", this._quillPasteHandler, true);
      }
      this._quillPasteHandler = async (evt) => {
        const items = Array.from(evt.clipboardData?.items || []);
        const imageItem = items.find((i) => i.type.startsWith("image/"));
        if (!imageItem) return;
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        const file = imageItem.getAsFile();
        if (!file) return;
        const index = quill.getSelection(true)?.index ?? quill.getLength();
        await this.onEditorImageAdded(file, quill, index, () => {});
      };
      quill.root.addEventListener("paste", this._quillPasteHandler, true);
    },

    validate() {
      if (!this.targetProductProject?.id) {
        this.$swal.fire(
          "ข้อผิดพลาด",
          "ไม่พบ project_type = product ในตาราง project",
          "error"
        );
        return false;
      }
      if (!this.form.name.trim()) {
        this.$swal.fire("ข้อผิดพลาด", "กรุณาระบุชื่อ Product", "warning");
        return false;
      }
      return true;
    },

    buildPayload() {
      return {
        projectId: this.targetProductProject?.id,
        name: this.form.name.trim(),
        description: this.form.description || "",
        issueType: this.form.issueType,
        state: this.form.state,
        labels: this.getMergedLabels(),
        milestone: this.form.milestone,
        assigneeUsername: this.form.assigneeUsername,
        dueDate: this.form.dueDate,
        startDate: this.form.startDate,
        contacts: this.form.contacts,
        confidential: this.form.confidential,
        weight: this.form.weight,
      };
    },

    async submitCreate() {
      if (!this.validate()) return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });
      try {
        this.loading = true;
        const count = Math.max(
          1,
          Math.min(100, parseInt(this.form.count) || 1)
        );
        const payload = this.buildPayload();
        payload.count = count;

        const result = await this.$store.dispatch(
          "product/createProduct",
          payload
        );

        if (!result.success) {
          throw new Error(result.message || `สร้าง Product ไม่สำเร็จ`);
        }

        const results = Array.isArray(result.data)
          ? result.data
          : [result.data];
        this.$emit("success", results);
        this.$swal
          .fire(
            "สำเร็จ",
            `สร้าง Product จำนวน ${count} รายการเรียบร้อยแล้ว`,
            "success"
          )
          .then(() => {
            this.closeDialog();
            this.$router.push("/product");
          });
      } catch (error) {
        const message = !error.response
          ? "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ"
          : error.response?.data?.message || error.message || "Unknown error";
        console.error("[CreateProductDialog] submitCreate:", error);
        this.$swal.fire(
          "ผิดพลาด",
          `สร้าง Product ไม่สำเร็จ: ${message}`,
          "error"
        );
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
