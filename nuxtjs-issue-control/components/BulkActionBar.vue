<template>
  <v-navigation-drawer
    :value="isBulkMode || selectedIds.length > 0"
    @input="$emit('update:drawer', $event)"
    right
    app
    width="300"
    class="bulk-sidebar elevation-4"
  >
    <div class="d-flex flex-column fill-height">
      <!-- Header -->
      <div class="pa-2 grey lighten-5 d-flex align-center">
        <div class="pl-2">
          <div class="text-caption font-weight-bold grey--text text--darken-3" style="line-height: 1.2;">จัดการทั้งหมด</div>
          <div class="grey--text" style="font-size: 0.7rem;">{{ selectedIds.length }} {{ typeLabel }}</div>
        </div>
      </div>

      <v-divider />

      <!-- Actions List -->
      <div class="pa-2 flex-grow-1 overflow-y-auto">
        <div class="text-overline mb-1 grey--text px-1" style="font-size: 0.6rem !important; letter-spacing: 1px !important;">ทั่วไป</div>
        
        <v-btn
          block
          depressed
          small
          color="teal lighten-5"
          class="text-none justify-start mb-1 teal--text text--darken-2"
          height="32"
          @click="$emit('clone')"
        >
          <v-icon left small size="16">mdi-content-duplicate</v-icon>
          <span class="text-caption">โคลนทั้งหมด</span>
        </v-btn>

        <v-btn
          block
          depressed
          small
          :color="stateFilter === 'closed' ? 'blue lighten-5' : 'red lighten-5'"
          class="text-none justify-start mb-3"
          :class="stateFilter === 'closed' ? 'blue--text text--darken-2' : 'red--text text--darken-2'"
          height="32"
          @click="stateFilter === 'closed' ? $emit('restore') : $emit('delete')"
        >
          <v-icon left small size="16">{{ stateFilter === 'closed' ? 'mdi-refresh' : 'mdi-archive-outline' }}</v-icon>
          <span class="text-caption">{{ stateFilter === "closed" ? "Restore Items" : "ปิดทั้งหมด" }}</span>
        </v-btn>

        <v-divider class="mb-2 mx-1" />
        <div class="text-overline mb-1 grey--text px-1" style="font-size: 0.6rem !important; letter-spacing: 1px !important;">จัดการ</div>

        <!-- Assignee Menu -->
        <v-menu v-model="assigneeMenu" offset-y min-width="240">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              block
              outlined
              small
              v-bind="attrs"
              v-on="on"
              color="teal"
              class="text-none justify-start mb-1"
              height="32"
            >
              <v-icon left small size="16">mdi-account-plus-outline</v-icon>
              <span class="text-caption">เพิ่ม/แก้ไข ผู้ใช้ตามที่เลือก</span>
              <v-spacer />
              <v-icon small size="14">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list dense class="rounded-lg py-1 elevation-10">
            <v-list-item @click="$emit('assign', null); assigneeMenu = false" min-height="32">
              <v-list-item-title class="grey--text" style="font-size: 0.75rem;">No Assignee</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              v-for="user in userOptions"
              :key="user"
              @click="$emit('assign', user); assigneeMenu = false"
              min-height="32"
            >
              <v-list-item-avatar size="20" color="teal lighten-5" class="mr-2">
                <span class="font-weight-bold teal--text" style="font-size: 0.7rem;">{{ user.charAt(0).toUpperCase() }}</span>
              </v-list-item-avatar>
              <v-list-item-title style="font-size: 0.75rem;">{{ user }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Add Labels -->
        <v-menu
          v-model="bulkAddLabelMenu"
          offset-y
          :close-on-content-click="false"
          min-width="240"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              block
              outlined
              small
              v-bind="attrs"
              v-on="on"
              color="teal"
              class="text-none justify-start mb-1"
              height="32"
            >
              <v-icon left small size="16">mdi-tag-plus-outline</v-icon>
              <span class="text-caption">เพิ่ม/แก้ไข Label ตามที่เลือก</span>
              <v-spacer />
              <v-icon small size="14">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-card class="rounded-lg elevation-10 border">
            <v-card-text class="pa-2 pb-1">
              <div class="mb-2" v-for="type in [0, 1, 2, 3]" :key="`add-${type}`">
                <div class="d-flex align-center mb-1">
                  <v-icon size="12" :color="getLabelTypeColor(type)" class="mr-1">{{ getLabelTypeIcon(type) }}</v-icon>
                  <span class="font-weight-bold" :style="{ color: getLabelTypeColor(type), fontSize: '0.65rem' }">
                    {{ getLabelTypeText(type) }}
                  </span>
                </div>
                <v-autocomplete
                  v-model="bulkLabelsToAdd[type]"
                  :items="type === 1 ? filteredBulkAddType1 : bulkLabelsByType[type]"
                  item-text="name"
                  item-value="name"
                  placeholder="Select..."
                  dense
                  outlined
                  hide-details
                  :multiple="type < 2"
                  background-color="grey lighten-5"
                  :color="getLabelTypeColor(type)"
                  class="rounded-lg compact-select"
                >
                  <template v-slot:selection="{ item }">
                    <v-chip small :close="type < 2" class="mr-1 mb-1 font-weight-medium" pill
                      :color="getLabelChipColor(item.name || item)"
                      :text-color="getLabelChipTextColor(item.name || item)"
                      @click:close="removeBulkAddLabel(type, item.name || item)"
                      style="font-size: 0.75rem !important;"
                    >{{ item.name || item }}</v-chip>
                  </template>
                  <template v-slot:item="{ item, on, attrs }">
                    <v-list-item v-on="on" v-bind="attrs" class="py-1" min-height="36">
                      <v-list-item-icon class="mr-2 my-auto" style="min-width: 20px">
                        <v-icon v-if="isLabelSelected(type, item.name || item, 'add')" small color="primary">mdi-check</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content class="py-0">
                        <div class="d-flex align-center">
                          <div :style="{ backgroundColor: labelColorMap[item.name || item] || '#9E9E9E', width: '16px', height: '8px', borderRadius: '10px' }" class="mr-3"></div>
                          <span class="text-body-2 grey--text text--darken-3 font-weight-medium">{{ item.name || item }}</span>
                        </div>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </div>
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-2">
              <v-spacer />
              <v-btn color="teal" depressed x-small :disabled="totalBulkLabelsToAdd === 0" @click="onApplyAddLabels" class="white--text px-3">Apply</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Remove Labels -->
        <v-menu
          v-model="bulkRemoveLabelMenu"
          offset-y
          :close-on-content-click="false"
          min-width="240"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              block
              outlined
              small
              v-bind="attrs"
              v-on="on"
              color="red lighten-1"
              class="text-none justify-start mb-1"
              height="32"
            >
              <v-icon left small size="16">mdi-tag-minus-outline</v-icon>
              <span class="text-caption">ลบ Label ตามที่เลือก</span>
              <v-spacer />
              <v-icon small size="14">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-card class="rounded-lg elevation-10 border">
            <v-card-text class="pa-2 pb-1">
              <div class="mb-2" v-for="type in [0, 1, 2, 3]" :key="`remove-${type}`">
                <div class="d-flex align-center mb-1">
                  <v-icon size="12" :color="getLabelTypeColor(type)" class="mr-1">{{ getLabelTypeIcon(type) }}</v-icon>
                  <span class="font-weight-bold" :style="{ color: getLabelTypeColor(type), fontSize: '0.65rem' }">
                    {{ getLabelTypeText(type) }}
                  </span>
                </div>
                <v-autocomplete
                  v-model="bulkLabelsToRemove[type]"
                  :items="bulkLabelsByType[type]"
                  item-text="name"
                  item-value="name"
                  placeholder="Select..."
                  dense
                  outlined
                  hide-details
                  multiple
                  background-color="grey lighten-5"
                  :color="getLabelTypeColor(type)"
                  class="rounded-lg compact-select"
                >
                  <template v-slot:selection="{ item }">
                    <v-chip small close class="mr-1 mb-1 font-weight-medium" pill
                      :color="getLabelChipColor(item.name || item)"
                      :text-color="getLabelChipTextColor(item.name || item)"
                      @click:close="removeBulkRemoveLabel(type, item.name || item)"
                      style="font-size: 0.75rem !important;"
                    >{{ item.name || item }}</v-chip>
                  </template>
                  <template v-slot:item="{ item, on, attrs }">
                    <v-list-item v-on="on" v-bind="attrs" class="py-1" min-height="36">
                      <v-list-item-icon class="mr-2 my-auto" style="min-width: 20px">
                        <v-icon v-if="bulkLabelsToRemove[type].includes(item.name || item)" small color="red">mdi-close-circle</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content class="py-0">
                        <div class="d-flex align-center">
                          <div :style="{ backgroundColor: labelColorMap[item.name || item] || '#9E9E9E', width: '16px', height: '8px', borderRadius: '10px' }" class="mr-3"></div>
                          <span class="text-body-2 grey--text text--darken-3 font-weight-medium">{{ item.name || item }}</span>
                        </div>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </div>
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-2">
              <v-spacer />
              <v-btn color="red lighten-1" depressed x-small :disabled="totalBulkLabelsToRemove === 0" @click="onApplyRemoveLabels" class="white--text px-3">Remove</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <slot name="extra-actions"></slot>
      </div>

      <v-divider />

      <!-- Footer -->
      <div class="pa-1 grey lighten-5">
        <v-btn block text x-small @click="$emit('clear')" class="text-none grey--text" height="24" style="font-size: 0.65rem;">Clear Selection</v-btn>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
/* No custom CSS, using Vuetify 2 native classes */
</style>

<script>
import labelChipMixin from '~/mixins/labelChip'

export default {
  name: 'BulkActionBar',
  mixins: [labelChipMixin],
  props: {
    selectedIds: { type: Array, default: () => [] },
    isBulkMode: { type: Boolean, default: false },
    stateFilter: { type: String, default: 'opened' },
    userOptions: { type: Array, default: () => [] },
    typeLabel: { type: String, default: 'Items' },
    bulkLabelsByType: { type: Object, default: () => ({ 0: [], 1: [], 2: [], 3: [] }) },
    labelColorMap: { type: Object, default: () => ({}) },
    currentProjectLabelNames: { type: Array, default: () => [] }
  },
  data() {
    return {
      assigneeMenu: false,
      bulkAddLabelMenu: false,
      bulkRemoveLabelMenu: false,
      bulkLabelsToAdd: { 0: [], 1: [], 2: null, 3: null },
      bulkLabelsToRemove: { 0: [], 1: [], 2: [], 3: [] }
    }
  },
  computed: {
    totalBulkLabelsToAdd() {
      return (
        (this.bulkLabelsToAdd[0]?.length || 0) +
        (this.bulkLabelsToAdd[1]?.length || 0) +
        (this.bulkLabelsToAdd[2] ? 1 : 0) +
        (this.bulkLabelsToAdd[3] ? 1 : 0)
      );
    },
    totalBulkLabelsToRemove() {
      return (
        (this.bulkLabelsToRemove[0]?.length || 0) +
        (this.bulkLabelsToRemove[1]?.length || 0) +
        (this.bulkLabelsToRemove[2]?.length || 0) +
        (this.bulkLabelsToRemove[3]?.length || 0)
      );
    },
    filteredBulkAddType1() {
      const projectSet = new Set(this.currentProjectLabelNames);
      return (this.bulkLabelsByType[1] || []).filter(
        (l) => !projectSet.has(l.name !== undefined ? l.name : l)
      );
    }
  },
  methods: {
    removeBulkAddLabel(type, label) {
      if (Array.isArray(this.bulkLabelsToAdd[type])) {
        this.bulkLabelsToAdd[type] = this.bulkLabelsToAdd[type].filter(l => l !== label);
      } else {
        this.bulkLabelsToAdd[type] = null;
      }
    },
    removeBulkRemoveLabel(type, label) {
      if (Array.isArray(this.bulkLabelsToRemove[type])) {
        this.bulkLabelsToRemove[type] = this.bulkLabelsToRemove[type].filter(l => l !== label);
      }
    },
    resetBulkLabelsToAdd() {
      this.bulkLabelsToAdd = { 0: [], 1: [], 2: null, 3: null };
    },
    resetBulkLabelsToRemove() {
      this.bulkLabelsToRemove = { 0: [], 1: [], 2: [], 3: [] };
    },
    onApplyAddLabels() {
      const labelsToAdd = [
        ...this.bulkLabelsToAdd[0],
        ...this.bulkLabelsToAdd[1]
      ];
      if (this.bulkLabelsToAdd[2]) labelsToAdd.push(this.bulkLabelsToAdd[2]);
      if (this.bulkLabelsToAdd[3]) labelsToAdd.push(this.bulkLabelsToAdd[3]);
      
      this.$emit('apply-add-labels', labelsToAdd);
      this.bulkAddLabelMenu = false;
      this.resetBulkLabelsToAdd();
    },
    onApplyRemoveLabels() {
      const labelsToRemove = [
        ...this.bulkLabelsToRemove[0],
        ...this.bulkLabelsToRemove[1],
        ...this.bulkLabelsToRemove[2],
        ...this.bulkLabelsToRemove[3]
      ];
      
      this.$emit('apply-remove-labels', labelsToRemove);
      this.bulkRemoveLabelMenu = false;
      this.resetBulkLabelsToRemove();
    },

    // UI Helpers
    getLabelTypeColor(type) {
      return '#00A896';
    },
    getLabelTypeIcon(type) {
      const icons = { 0: 'mdi-briefcase-outline', 1: 'mdi-folder-outline', 2: 'mdi-check-circle-outline', 3: 'mdi-account-outline' };
      return icons[type] || 'mdi-tag';
    },
    getLabelTypeText(type) {
      const texts = { 0: 'Job Type', 1: 'Project', 2: 'Status', 3: 'Role' };
      return texts[type] || 'Label';
    },
    isLabelSelected(type, labelName, mode) {
      const target = mode === 'add' ? this.bulkLabelsToAdd : this.bulkLabelsToRemove;
      const val = target[type];
      if (Array.isArray(val)) return val.includes(labelName);
      return val === labelName;
    }
  }
}
</script>
