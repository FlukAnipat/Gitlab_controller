<template>
  <v-container v-if="pageReady" fluid class="pa-0 grey lighten-5">
    <v-sheet
      tile
      color="blue lighten-5"
      class="px-6 py-2 caption font-weight-medium"
    >
      {{ username }}/Project/Issue
    </v-sheet>

    <v-container fluid class="px-6 py-4">
      <v-row align="center" justify="space-between" class="mb-2">
        <v-col cols="12" md="8" class="d-flex align-center flex-wrap">
          <div class="text-h5 font-weight-bold mr-6 my-1">All Issues</div>
          <div class="d-flex align-center my-1">
            <v-btn
              depressed
              small
              class="mr-2"
              :color="stateFilter === 'opened' ? 'teal' : 'grey lighten-3'"
              :dark="stateFilter === 'opened'"
              @click="stateFilter = 'opened'"
            >
              <v-icon left small>mdi-record-circle-outline</v-icon>เปิด({{
                openCount
              }})
            </v-btn>
            <v-btn
              depressed
              small
              :color="stateFilter === 'closed' ? 'teal' : 'grey lighten-3'"
              :dark="stateFilter === 'closed'"
              @click="stateFilter = 'closed'"
            >
              <v-icon left small>mdi-check-circle</v-icon>ปิด ({{
                closedCount
              }})
            </v-btn>
          </div>
        </v-col>
        <v-col cols="12" md="auto" class="d-flex justify-end flex-wrap py-1">
          <v-btn
            depressed
            small
            color="teal"
            dark
            @click="showCreateDialog = true"
            >สร้าง Issue</v-btn
          >
        </v-col>
      </v-row>

      <v-row dense class="mb-2">
        <v-col cols="12" md="4">
          <v-combobox
            :search-input.sync="searchQuery"
            :items="searchOptions"
            outlined
            dense
            hide-details
            placeholder="ค้นหา issue..."
            background-color="white"
            clearable
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="selectedProjectDisplay"
            :items="projectFilterOptions"
            label="ค้นหา Project..."
            clearable
            outlined
            dense
            hide-details
            background-color="white"
            multiple
            deletable-chips
            :menu-props="{ maxHeight: '300px' }"
          >
            <template v-slot:selection="{ item }"
              ><v-chip
                small
                pill
                class="ma-1"
                :color="getLabelChipColor(item)"
                :text-color="getLabelChipTextColor(item)"
                >{{ item }}</v-chip
              ></template
            >
            <template v-slot:item="{ item, on, attrs }">
              <v-list-item v-on="on" v-bind="attrs" class="py-1">
                <v-list-item-icon class="mr-2 my-auto" style="min-width: 20px">
                  <v-icon
                    v-if="selectedProjectDisplay.includes(item)"
                    small
                    color="primary"
                    >mdi-check</v-icon
                  >
                </v-list-item-icon>
                <v-list-item-content class="py-0">
                  <div class="d-flex align-center">
                    <div
                      :style="{
                        backgroundColor: labelColorMap[item] || '#9E9E9E',
                        width: '16px',
                        height: '8px',
                        borderRadius: '10px',
                      }"
                      class="mr-3"
                    ></div>
                    <span
                      class="text-body-2 grey--text text--darken-3 font-weight-medium"
                    >
                      {{ item }}
                    </span>
                  </div>
                </v-list-item-content>
              </v-list-item>
            </template>
            <template v-slot:prepend-item>
              <v-list-item
                ripple
                @mousedown.prevent
                @click="toggleSelectAllProjects"
              >
                <v-list-item-action
                  ><v-icon
                    :color="
                      selectedProjectDisplay.length ===
                      projectFilterOptions.length
                        ? 'primary'
                        : ''
                    "
                    >{{ projectSelectAllIcon }}</v-icon
                  ></v-list-item-action
                >
                <v-list-item-content
                  ><v-list-item-title
                    >เลือกทั้งหมด</v-list-item-title
                  ></v-list-item-content
                >
              </v-list-item>
              <v-divider class="mt-2" />
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="selectedUserDisplay"
            :items="userFilterOptions"
            label="ผู้ใช้..."
            clearable
            outlined
            dense
            hide-details
            background-color="white"
            :menu-props="{ maxHeight: '300px' }"
          >
            <template v-slot:item="{ item, on, attrs }">
              <v-list-item v-on="on" v-bind="attrs" class="py-1">
                <v-list-item-content>
                  <v-list-item-title class="text-body-2">{{
                    item
                  }}</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action v-if="selectedUserDisplay === item">
                  <v-icon small color="primary">mdi-check</v-icon>
                </v-list-item-action>
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <v-chip small class="ma-1">{{ item }}</v-chip>
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>

      <v-row dense class="mb-4">
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="selectedJobTypeDisplay"
            :items="jobTypeFilterOptions"
            label="ประเภทงาน..."
            clearable
            outlined
            dense
            hide-details
            background-color="white"
            multiple
            deletable-chips
            :menu-props="{ maxHeight: '300px' }"
          >
            <template v-slot:selection="{ item }"
              ><v-chip
                small
                pill
                class="ma-1"
                :color="getLabelChipColor(item)"
                :text-color="getLabelChipTextColor(item)"
                >{{ item }}</v-chip
              ></template
            >
            <template v-slot:item="{ item, on, attrs }">
              <v-list-item v-on="on" v-bind="attrs" class="py-1">
                <v-list-item-icon class="mr-2 my-auto" style="min-width: 20px">
                  <v-icon
                    v-if="selectedJobTypeDisplay.includes(item)"
                    small
                    color="primary"
                    >mdi-check</v-icon
                  >
                </v-list-item-icon>
                <v-list-item-content class="py-0">
                  <div class="d-flex align-center">
                    <div
                      :style="{
                        backgroundColor: labelColorMap[item] || '#9E9E9E',
                        width: '16px',
                        height: '8px',
                        borderRadius: '10px',
                      }"
                      class="mr-3"
                    ></div>
                    <span
                      class="text-body-2 grey--text text--darken-3 font-weight-medium"
                    >
                      {{ item }}
                    </span>
                  </div>
                </v-list-item-content>
              </v-list-item>
            </template>
            <template v-slot:prepend-item>
              <v-list-item
                ripple
                @mousedown.prevent
                @click="toggleSelectAllProjects"
              >
                <v-list-item-action
                  ><v-icon
                    :color="
                      selectedJobTypeDisplay.length ===
                      jobTypeFilterOptions.length
                        ? 'primary'
                        : ''
                    "
                    >{{ jobTypeSelectAllIcon }}</v-icon
                  ></v-list-item-action
                >
                <v-list-item-content
                  ><v-list-item-title
                    >เลือกทั้งหมด</v-list-item-title
                  ></v-list-item-content
                >
              </v-list-item>
              <v-divider class="mt-2" />
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="selectedStatusDisplay"
            :items="statusFilterOptions"
            label="สถานะ..."
            clearable
            outlined
            dense
            hide-details
            background-color="white"
            multiple
            deletable-chips
            :menu-props="{ maxHeight: '300px' }"
          >
            <template v-slot:selection="{ item }">
              <v-chip
                small
                pill
                class="ma-1"
                :color="getLabelChipColor(item)"
                :text-color="getLabelChipTextColor(item)"
                >{{ item }}</v-chip
              >
            </template>
            <template v-slot:item="{ item, on, attrs }">
              <v-list-item v-on="on" v-bind="attrs" class="py-1">
                <v-list-item-icon class="mr-2 my-auto" style="min-width: 20px">
                  <v-icon
                    v-if="selectedStatusDisplay.includes(item)"
                    small
                    color="primary"
                    >mdi-check</v-icon
                  >
                </v-list-item-icon>
                <v-list-item-content class="py-0">
                  <div class="d-flex align-center">
                    <div
                      :style="{
                        backgroundColor: labelColorMap[item] || '#9E9E9E',
                        width: '16px',
                        height: '8px',
                        borderRadius: '10px',
                      }"
                      class="mr-3"
                    ></div>
                    <span
                      class="text-body-2 grey--text text--darken-3 font-weight-medium"
                    >
                      {{ item }}
                    </span>
                  </div>
                </v-list-item-content>
              </v-list-item>
            </template>
            <template v-slot:prepend-item>
              <v-list-item
                ripple
                @mousedown.prevent
                @click="toggleSelectAllStatus"
              >
                <v-list-item-action
                  ><v-icon
                    :color="
                      selectedStatusDisplay.length ===
                      statusFilterOptions.length
                        ? 'primary'
                        : ''
                    "
                    >{{ statusSelectAllIcon }}</v-icon
                  ></v-list-item-action
                >
                <v-list-item-content
                  ><v-list-item-title
                    >เลือกทั้งหมด</v-list-item-title
                  ></v-list-item-content
                >
              </v-list-item>
              <v-divider class="mt-2" />
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
                placeholder="สร้างเมื่อ..."
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
                placeholder="กำหนดเสร็จ..."
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

      <v-row class="mb-2">
        <v-col cols="12" class="py-1">
          <v-btn
            depressed
            small
            :color="isBulkMode ? 'orange' : 'grey lighten-3'"
            :dark="isBulkMode"
            @click="isBulkMode = !isBulkMode"
          >
            <v-icon left small>{{ isBulkMode ? 'mdi-checkbox-marked-circle-outline' : 'mdi-checkbox-blank-circle-outline' }}</v-icon>
            จัดการทั้งหมด
          </v-btn>
        </v-col>
      </v-row>

      <!-- Bulk Action Bar -->
      <BulkActionBar
        :selected-ids="selectedIds"
        :is-bulk-mode="isBulkMode"
        :state-filter="stateFilter"
        :user-options="userFilterOptions"
        :bulk-labels-by-type="bulkLabelsByType"
        :label-color-map="labelColorMap"
        :current-project-label-names="currentProjectLabelNames"
        type-label="Issues"
        @clear="clearSelection"
        @clone="openCloneIssueDialog"
        @restore="confirmRestoreSelectedIssues"
        @delete="confirmDeleteSelectedIssues"
        @assign="bulkAssign"
        @apply-add-labels="applyBulkAddLabels"
        @apply-remove-labels="applyBulkRemoveLabels"
      />

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="teal" size="32" />
      </div>

      <v-card
        v-else-if="pagedItems.length > 0"
        flat
        color="transparent"
        elevation="0"
        class="mb-0"
      >
        <v-list dense class="py-0">
          <template v-for="(issue, index) in pagedItems">
            <div :key="issue.id">
              <v-list-item 
                class="py-2" 
                :class="{ 'teal lighten-5': isItemSelected(issue.id) }"
                @click="isBulkMode ? toggleItemSelection(issue.id) : openIssueDetail(issue)"
              >
                <v-list-item-action class="my-0 mr-2 py-0" v-if="isBulkMode">
                  <v-checkbox
                    :input-value="isItemSelected(issue.id)"
                    hide-details
                    dense
                    class="mt-0 pt-0"
                    readonly
                  />
                </v-list-item-action>
                <v-list-item-content class="py-1">
                  <div
                    v-if="issue.gitlabIssueId"
                    class="caption grey--text text--darken-1 d-flex align-center"
                  >
                    <span class="mr-2"
                      >#{{ issue.gitlabIid || issue.gitlabIssueId }}</span
                    >
                    <v-chip
                      v-if="issue.assigneeUsername"
                      x-small
                      label
                      color="orange lighten-5"
                      text-color="orange darken-3"
                      title="ผู้รับผิดชอบ"
                    >
                      <v-icon x-small left>mdi-account-check</v-icon
                      >{{ issue.assigneeUsername }}
                    </v-chip>
                  </div>
                  <div class="d-flex align-center flex-wrap">
                    <div class="body-2 font-weight-bold mr-2">
                      {{ issue.name }}
                    </div>
                    <v-chip
                      x-small
                      label
                      class="mr-1"
                      color="red lighten-5"
                      text-color="red darken-2"
                      >{{ issue.issueType || "issue" }}</v-chip
                    >
                    <v-chip
                      x-small
                      label
                      class="mr-1 font-weight-bold"
                      :color="
                        issue.state === 'closed'
                          ? 'grey lighten-3'
                          : 'green lighten-5'
                      "
                      :text-color="
                        issue.state === 'closed'
                          ? 'grey darken-1'
                          : 'green darken-2'
                      "
                    >
                      <v-icon x-small left>{{
                        issue.state === "closed"
                          ? "mdi-check-circle"
                          : "mdi-record-circle-outline"
                      }}</v-icon>
                      {{ issue.state === "closed" ? "Closed" : "Opened" }}
                    </v-chip>
                    <span class="caption grey--text text--darken-1"
                      >{{ formatDateThai(issue.createdAt)
                      }}{{
                        issue.authorUsername ? " " + issue.authorUsername : ""
                      }}</span
                    >
                  </div>
                  <!-- <div
                    class="caption grey--text text--darken-1"
                    v-html="truncateDescription(issue.description)"
                  ></div> -->
                  <div class="d-flex flex-wrap align-center mt-2">
                    <v-chip
                      v-for="label in issue.parsedLabels"
                      :key="label"
                      x-small
                      pill
                      class="mr-1"
                      :color="getLabelChipColor(label)"
                      :text-color="getLabelChipTextColor(label)"
                      >{{ label }}</v-chip
                    >
                  </div>
                  <div
                    v-if="issue.startDate || issue.dueDate"
                    class="d-flex align-center flex-wrap mt-1"
                    style="gap: 4px"
                  >
                    <v-chip
                      v-if="issue.startDate"
                      x-small
                      label
                      color="cyan lighten-5"
                      text-color="cyan darken-3"
                    >
                      <v-icon x-small left>mdi-calendar-arrow-right</v-icon>
                      {{ formatDateThai(issue.startDate) }}
                    </v-chip>
                    <v-icon
                      v-if="issue.startDate && issue.dueDate"
                      x-small
                      color="grey lighten-1"
                      >mdi-arrow-right-thin</v-icon
                    >
                    <v-chip
                      v-if="issue.dueDate"
                      x-small
                      label
                      :color="
                        isOverdue(issue) ? 'red lighten-5' : 'teal lighten-5'
                      "
                      :text-color="
                        isOverdue(issue) ? 'red darken-2' : 'teal darken-2'
                      "
                    >
                      <v-icon x-small left>mdi-calendar-clock</v-icon>
                      {{ formatDateThai(issue.dueDate) }}
                      <v-icon
                        v-if="isOverdue(issue)"
                        x-small
                        right
                        color="red darken-1"
                        >mdi-alert-circle</v-icon
                      >
                    </v-chip>
                  </div>
                </v-list-item-content>
                <v-list-item-action class="my-0 ml-2 py-0 align-self-center">
                  <div class="d-flex align-center">
                    <v-btn
                      v-if="issue.state !== 'closed'"
                      outlined
                      small
                      color="#D32F2F"
                      class="text-none px-3"
                      @click.stop="confirmDeleteIssue(issue)"
                      >ปิด</v-btn
                    >
                    <v-btn
                      v-if="issue.state === 'closed'"
                      outlined
                      small
                      color="blue"
                      class="text-none px-3"
                      @click.stop="confirmRestoreIssue(issue)"
                      >เปิด</v-btn
                    >
                    <v-icon x-small color="grey" class="ml-1"
                      >mdi-chevron-right</v-icon
                    >
                  </div>
                </v-list-item-action>
              </v-list-item>
              <v-divider v-if="index < pagedItems.length - 1" class="my-0" />
            </div>
          </template>
        </v-list>
      </v-card>

      <v-sheet v-else outlined rounded class="py-12 text-center">
        <v-icon size="64" color="grey lighten-1" class="mb-4"
          >mdi-alert-circle-outline</v-icon
        >
        <div class="text-h6 mb-2">ยังไม่มี Issue</div>
        <div class="body-2 grey--text">กดปุ่ม เพิ่ม เพื่อสร้าง Issue ใหม่</div>
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

    <IssueDetailDialog
      v-model="showIssueDetailDialog"
      :initialIssue="selectedIssue"
      @success="handleIssueUpdated"
      @deleted="handleIssueDeleted"
    />
    <CreateIssueDialog
      v-model="showCreateDialog"
      :initial-product-id="createIssueProductId"
      @success="getIssues"
    />
    <CreateProductDialog
      v-model="showCreateProductDialog"
      @success="getProducts"
    />

    <!-- Clone Issue Dialog -->
    <v-dialog v-model="showCloneIssueDialog" max-width="460" persistent>
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center pt-5 px-6 pb-0">
          <v-avatar rounded size="32" class="mr-3" color="teal lighten-5">
            <v-icon size="18" color="teal darken-1"
              >mdi-content-duplicate</v-icon
            >
          </v-avatar>
          <span class="text-h6 font-weight-bold">Clone Issues</span>
          <v-spacer />
          <v-btn icon @click="showCloneIssueDialog = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
        </v-card-title>

        <v-card-text class="px-6 pt-4 pb-2">
          <v-sheet outlined rounded="lg" class="overflow-hidden mb-4">
            <div
              v-for="(item, idx) in cloneIssueItems"
              :key="item.issue.id"
              class="d-flex align-center px-4 py-3"
              :style="
                idx < cloneIssueItems.length - 1
                  ? 'border-bottom:1px solid #E5E7EB'
                  : ''
              "
            >
              <v-checkbox
                v-model="item.selected"
                hide-details
                dense
                class="mt-0 pt-0 mr-3 flex-shrink-0"
              />
              <div class="flex-grow-1 mr-3" style="min-width: 0">
                <div
                  class="text-body-2 font-weight-medium grey--text text--darken-3"
                  style="
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ item.issue.title || item.issue.name }}
                </div>
                <div class="text-caption grey--text">
                  #{{ item.issue.gitlabIid || item.issue.gitlabIssueId }}
                </div>
              </div>
              <div class="d-flex align-center flex-shrink-0" style="gap: 4px">
                <v-btn
                  icon
                  x-small
                  :disabled="!item.selected || item.count <= 1"
                  @click="item.count = Math.max(1, item.count - 1)"
                >
                  <v-icon size="16">mdi-minus</v-icon>
                </v-btn>
                <v-text-field
                  v-model.number="item.count"
                  :disabled="!item.selected"
                  type="number"
                  min="1"
                  max="10"
                  dense
                  outlined
                  hide-details
                  style="width: 60px"
                  class="text-center rounded-lg"
                  @input="
                    item.count = Math.min(
                      10,
                      Math.max(1, parseInt(item.count) || 1)
                    )
                  "
                />
                <v-btn
                  icon
                  x-small
                  :disabled="!item.selected || item.count >= 10"
                  @click="item.count = Math.min(10, item.count + 1)"
                >
                  <v-icon size="16">mdi-plus</v-icon>
                </v-btn>
              </div>
            </div>
          </v-sheet>

          <v-sheet color="teal lighten-5" rounded="lg" class="pa-3">
            <div class="text-caption grey--text">
              จะสร้าง issue ใหม่
              <strong class="teal--text text--darken-2">{{
                totalCloneIssueCount
              }}</strong>
              รายการ (ชื่อเดิมทุกอย่าง)
            </div>
          </v-sheet>
        </v-card-text>

        <v-card-actions class="px-6 pb-5 pt-2">
          <v-btn text color="grey" @click="showCloneIssueDialog = false"
            >ยกเลิก</v-btn
          >
          <v-spacer />
          <v-btn
            color="teal darken-1"
            dark
            depressed
            class="rounded-lg font-weight-bold px-6"
            :disabled="selectedCloneIssueItems.length === 0"
            @click="executeCloneIssues"
          >
            <v-icon left size="16">mdi-content-duplicate</v-icon>
            Clone ({{ totalCloneIssueCount }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
  <v-container v-else fluid class="fill-height grey lighten-5">
    <v-row align="center" justify="center" class="fill-height">
      <v-progress-circular indeterminate color="teal" size="32" />
    </v-row>
  </v-container>
</template>

<script>
import CreateIssueDialog from "./createIssue.vue";
import IssueDetailDialog from "./detailIssue.vue";
import CreateProductDialog from "../product/createProduct.vue";
import labelChipMixin from "~/mixins/labelChip";
import dateFormatMixin from "~/mixins/dateFormat";
import bulkActionsMixin from "~/mixins/bulkActions";
import listPageMixin from "~/mixins/listPageMixin";
import BulkActionBar from "~/components/BulkActionBar.vue";

export default {
  name: "AllIssuePage",
  mixins: [labelChipMixin, dateFormatMixin, bulkActionsMixin, listPageMixin],
  components: {
    CreateIssueDialog,
    IssueDetailDialog,
    CreateProductDialog,
    BulkActionBar,
  },
  data() {
    return {
      showCreateDialog: false,
      showCreateProductDialog: false,
      showIssueDetailDialog: false,
      selectedIssue: null,
      // Clone Issue
      showCloneIssueDialog: false,
      cloneIssueItems: [],
    };
  },
  computed: {
    username() {
      return this.$store.getters["auth/currentUser"]?.username || "username";
    },
    projects() {
      return this.$store.getters["project/projects"] || [];
    },
    currentProject() {
      return this.$store.getters["project/currentProject"];
    },
    issueProjects() {
      return (this.projects || []).filter(
        (project) => String(project.projectType || "").toLowerCase() === "issue"
      );
    },
    issueProjectIds() {
      return this.issueProjects
        .map((project) => Number(project.id))
        .filter((id) => Number.isFinite(id));
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
    createIssueProductId() {
      const v = this.$route.query.productId;
      return v ? Number(v) : null;
    },
    issues() {
      return this.$store.getters["issue/issues"];
    },
    searchOptions() {
      return [...new Set((this.issues || []).map((i) => i.name))]
        .filter(Boolean)
        .sort();
    },
    loading() {
      return this.$store.getters["issue/loading"];
    },
    filteredIssuesAllStates() {
      let result = (this.$store.getters["issue/issues"] || []).map((i) => ({
        ...i,
        parsedLabels: this.parseLabels(i.labels),
      }));
      if (this.issueProjectIds.length > 0) {
        result = result.filter(
          (i) => this.issueProjectIds.includes(Number(i.projectId))
        );
      }
      if (this.selectedUserDisplay)
        result = result.filter(
          (i) => i.assigneeUsername === this.selectedUserDisplay
        );
      const jobTypeFilters = this.selectedJobTypeDisplay.map((l) =>
        l.toLowerCase()
      );
      if (jobTypeFilters && jobTypeFilters.length > 0)
        result = result.filter((i) =>
          i.parsedLabels?.some((label) =>
            jobTypeFilters.includes(label.toLowerCase())
          )
        );
      const statusFilters = this.selectedStatusDisplay.map((l) =>
        l.toLowerCase()
      );
      if (statusFilters && statusFilters.length > 0)
        result = result.filter((i) =>
          i.parsedLabels?.some((label) =>
            statusFilters.includes(label.toLowerCase())
          )
        );
      const projectFilters = this.selectedProjectDisplay.map((l) =>
        l.toLowerCase()
      );
      if (projectFilters && projectFilters.length > 0)
        result = result.filter((i) =>
          i.parsedLabels?.some((label) =>
            projectFilters.includes(label.toLowerCase())
          )
        );
      if (this.filterStartDate || this.filterDueDate) {
        result = result.filter((i) => this.isDateOverlapping(i, this.filterStartDate, this.filterDueDate));
      }
      const q = (this.searchQuery || "").trim().toLowerCase();
      if (q) {
        result = result.filter(
          (i) =>
            i.name?.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q)
        );
      }
      return result;
    },
    openCount() {
      return this.filteredIssuesAllStates.filter((i) => i.state === "opened")
        .length;
    },
    closedCount() {
      return this.filteredIssuesAllStates.filter((i) => i.state === "closed")
        .length;
    },
    userFilterOptions() {
      // รวบรวม username ทั้งหมดจาก issues ที่มีอยู่ (author + assignee)
      const users = new Set();
      (this.$store.getters["issue/issues"] || []).forEach((i) => {
        if (i.authorUsername) users.add(i.authorUsername);
        if (i.assigneeUsername) users.add(i.assigneeUsername);
      });
      return Array.from(users).filter(Boolean).sort();
    },
    jobTypeFilterOptions() {
      const options = new Set();
      const labels = this.bulkLabelsByType[0] || [];
      labels.forEach((l) => options.add(l.name));
      return Array.from(options).sort();
    },
    statusFilterOptions() {
      const options = new Set();
      const labels = this.bulkLabelsByType[2] || [];
      labels.forEach((l) => options.add(l.name));
      return Array.from(options).sort();
    },
    projectFilterOptions() {
      const options = new Set();
      const labels = this.bulkLabelsByType[1] || [];
      labels.forEach((l) => options.add(l.name));
      return Array.from(options).sort();
    },

    userSelectAllIcon() {
      return this.selectedUserDisplay
        ? "mdi-close-box"
        : "mdi-checkbox-blank-outline";
    },
    jobTypeSelectAllIcon() {
      if (
        this.selectedJobTypeDisplay.length ===
          this.jobTypeFilterOptions.length &&
        this.jobTypeFilterOptions.length > 0
      )
        return "mdi-close-box";
      if (this.selectedJobTypeDisplay.length > 0) return "mdi-minus-box";
      return "mdi-checkbox-blank-outline";
    },
    statusSelectAllIcon() {
      if (
        this.selectedStatusDisplay.length === this.statusFilterOptions.length &&
        this.statusFilterOptions.length > 0
      )
        return "mdi-close-box";
      if (this.selectedStatusDisplay.length > 0) return "mdi-minus-box";
      return "mdi-checkbox-blank-outline";
    },
    projectSelectAllIcon() {
      if (
        this.selectedProjectDisplay.length ===
          this.projectFilterOptions.length &&
        this.projectFilterOptions.length > 0
      )
        return "mdi-close-box";
      if (this.selectedProjectDisplay.length > 0) return "mdi-minus-box";
      return "mdi-checkbox-blank-outline";
    },
    filteredIssues() {
      let result = this.filteredIssuesAllStates;
      if (this.stateFilter && this.stateFilter !== "all")
        result = result.filter((i) => i.state === this.stateFilter);
      return result;
    },

    filteredItems() {
      return this.filteredIssues;
    },

    selectedIssues() {
      const selected = new Set(this.selectedIds.map((id) => Number(id)));
      return (this.filteredIssues || []).filter((issue) =>
        selected.has(Number(issue.id))
      );
    },
    // หน้า issue all ไม่ผูกกับ label context ใด context หนึ่ง
    currentProjectLabelNames() {
      return [];
    },
    // Clone Issue computed
    selectedCloneIssueItems() {
      return this.cloneIssueItems.filter((item) => item.selected);
    },
    totalCloneIssueCount() {
      return this.selectedCloneIssueItems.reduce(
        (sum, item) => sum + (item.count || 1),
        0
      );
    },
  },
  async mounted() {
    try {
      if (!this.currentProject && process.client)
        await this.$store.dispatch("project/initCurrentProject");
      await this.$store.dispatch("project/getProjects");
      await Promise.all([
        this.getIssues(),
        this.getLabelColors(),
        this.loadBulkLabelsByType(),
      ]);
      this.selectedUserDisplay = null;
      this.selectedJobTypeDisplay = [];
      this.selectedStatusDisplay = [];
      this.selectedProjectDisplay = [];
      this.filterStartDate = null;
      this.filterDueDate = null;
      if (this.$route.query.create === "1") this.showCreateDialog = true;
    } catch (error) {
      console.error("ไม่สามารถโหลดหน้า all issue ได้", error);
    } finally {
      this.pageReady = true;
    }
  },
  watch: {
    "$route.query": {
      immediate: false,
      handler(query) {
        if (query.create === "1") this.showCreateDialog = true;
      },
    },
    itemsPerPage() {
      this.currentPage = 1;
    },
    filteredIssues() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages || 1;
      }
    },
  },
  methods: {
    // ตัดข้อความ description ให้เหลือ 100 ตัวอักษร
    parseLabels(labels) {
      if (!labels) return [];
      if (typeof labels === "string" && labels.includes(","))
        return labels
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (Array.isArray(labels)) {
        return labels
          .map((l) =>
            typeof l === "object" ? (l.name || "").trim() : (l || "").trim()
          )
          .filter(Boolean);
      }
      if (typeof labels === "string") return [labels.trim()].filter(Boolean);
      return [];
    },
    async getIssues() {
      try {
        await this.$store.dispatch("issue/getIssues");
      } catch (error) {
        console.error("ไม่สามารถดึงข้อมูล issue ได้", error);
      }
    },
    async getLabelColors() {
      try {
        await this.$store.dispatch("labels/getLabels");
        this.labelColorMap = this.$store.getters["labels/labelColorMap"] || {};
      } catch {
        /* silent */
      }
    },
    toggleSelectAllUsers() {
      this.selectedUserDisplay = this.selectedUserDisplay ? null : null;
    },
    toggleSelectAllJobTypes() {
      this.$nextTick(() => {
        this.selectedJobTypeDisplay =
          this.selectedJobTypeDisplay.length ===
          this.jobTypeFilterOptions.length
            ? []
            : [...this.jobTypeFilterOptions];
      });
    },
    toggleSelectAllStatus() {
      this.$nextTick(() => {
        this.selectedStatusDisplay =
          this.selectedStatusDisplay.length === this.statusFilterOptions.length
            ? []
            : [...this.statusFilterOptions];
      });
    },
    toggleSelectAllProjects() {
      this.$nextTick(() => {
        this.selectedProjectDisplay =
          this.selectedProjectDisplay.length ===
          this.projectFilterOptions.length
            ? []
            : [...this.projectFilterOptions];
      });
    },
    onUserFilterChange(value) {
      // single select — computed filter ทำงานอัตโนมัติ
    },
    openIssueDetail(issue) {
      this.selectedIssue = issue;
      this.showIssueDetailDialog = true;
    },
    async handleIssueUpdated(updatedIssue) {
      this.selectedIssue = updatedIssue;
      await this.getIssues();
    },
    async handleIssueDeleted(deletedIssue) {
      this.selectedIssue = deletedIssue;
      await this.getIssues();
    },
    isOverdue(item) {
      if (!item.dueDate || item.state === "closed") return false;
      const due = new Date(item.dueDate);
      if (isNaN(due.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return due < today;
    },
    async getProducts() {
      try {
        await this.$store.dispatch("product/getProducts");
      } catch (error) {
        console.error("ไม่สามารถโหลดรายการ product ได้", error);
      }
    },
    // ── bulk actions ──
    // ยืนยันก่อนกู้คืน issue ทั้งหมดที่เลือก
    async confirmRestoreSelectedIssues() {
      if (this.selectedIds.length === 0) return;
      const result = await this.$swal.fire({
        title: "กู้คืน Issue ทั้งหมดที่เลือก?",
        text: `คุณกำลังจะกู้คืน ${this.selectedIds.length} รายการ`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "กู้คืน",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;

      this.$swal.fire({
        title: "กำลังกู้คืน...",
        allowOutsideClick: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });

      try {
        for (const id of this.selectedIds) {
          await this.$store.dispatch("issue/restoreIssue", id);
        }
        await this.getIssues();
        this.clearSelection();
        this.$swal.fire("สำเร็จ", "กู้คืนข้อมูลเรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "ไม่สามารถกู้คืนข้อมูลได้", "error");
      }
    },
    // ยืนยันก่อนลบ issue ทั้งหมดที่เลือก
    async confirmDeleteSelectedIssues() {
      if (this.selectedIds.length === 0) return;
      const result = await this.$swal.fire({
        title: "ลบ Issue ทั้งหมดที่เลือก?",
        text: `คุณกำลังจะลบ ${this.selectedIds.length} รายการ`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;

      this.$swal.fire({
        title: "กำลังลบ...",
        allowOutsideClick: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });

      try {
        for (const id of this.selectedIds) {
          await this.$store.dispatch("issue/deleteIssue", id);
        }
        await this.getIssues();
        this.clearSelection();
        this.$swal.fire("สำเร็จ", "ลบข้อมูลเรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
      }
    },
    // กำหนดผู้รับผิดชอบให้กับ issue ทั้งหมดที่เลือก
    async bulkAssign(username) {
      if (this.selectedIds.length === 0) return;
      this.$swal.fire({
        title: "กำลังอัปเดต...",
        allowOutsideClick: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });
      try {
        for (const id of this.selectedIds) {
          await this.$store.dispatch("issue/updateIssue", {
            issueId: id,
            issueData: { assigneeUsername: username },
          });
        }
        await this.getIssues();
        this.$swal.fire("สำเร็จ", "อัปเดตผู้รับผิดชอบเรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
      }
    },
    // เพิ่ม labels ที่เลือกให้กับ issue ทั้งหมดที่เลือก
    async applyBulkAddLabels(labelsToAdd) {
      if (this.selectedIds.length === 0 || labelsToAdd.length === 0) return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });
      try {
        const labelTypeMap = new Map();
        [0, 1, 2, 3].forEach((type) => {
          (this.bulkLabelsByType[type] || []).forEach((label) => {
            const name = label?.name || label;
            if (name) labelTypeMap.set(name, type);
          });
        });
        const replaceStatus = labelsToAdd.some(
          (label) => labelTypeMap.get(label) === 2
        );
        const replaceRole = labelsToAdd.some(
          (label) => labelTypeMap.get(label) === 3
        );

        for (const id of this.selectedIds) {
          const issue = (this.filteredIssues || []).find(
            (i) => Number(i.id) === Number(id)
          );
          const existingLabels = this.parseLabels(issue?.labels || "");
          const preservedLabels = existingLabels.filter((label) => {
            const type = labelTypeMap.get(label);
            if (replaceStatus && type === 2) return false;
            if (replaceRole && type === 3) return false;
            return true;
          });
          const newLabels = [...new Set([...preservedLabels, ...labelsToAdd])];
          await this.$store.dispatch("issue/updateIssue", {
            issueId: id,
            issueData: { labels: newLabels.join(",") },
          });
        }
        await this.getIssues();
        this.$swal.fire("สำเร็จ", "เพิ่ม Labels เรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire(
          "ผิดพลาด",
          `ไม่สามารถเพิ่ม Labels ได้: ${error.message || ""}`,
          "error"
        );
      }
    },
    // ลบ labels ที่เลือกออกจาก issue ทั้งหมดที่เลือก
    async applyBulkRemoveLabels(labelsToRemove) {
      if (this.selectedIds.length === 0 || labelsToRemove.length === 0)
        return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });
      try {
        for (const id of this.selectedIds) {
          const issue = (this.filteredIssues || []).find(
            (i) => Number(i.id) === Number(id)
          );
          const existingLabels = this.parseLabels(issue?.labels || "");
          const newLabels = existingLabels.filter(
            (l) => !labelsToRemove.includes(l)
          );
          await this.$store.dispatch("issue/updateIssue", {
            issueId: id,
            issueData: { labels: newLabels.join(",") },
          });
        }
        await this.getIssues();
        this.$swal.fire("สำเร็จ", "ลบ Labels เรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire(
          "ผิดพลาด",
          `ไม่สามารถลบ Labels ได้: ${error.message || ""}`,
          "error"
        );
      }
    },

    // ── Clone Issue ──
    openCloneIssueDialog() {
      if (this.selectedIds.length === 0) return;
      this.cloneIssueItems = this.selectedIssues.map((issue) => ({
        issue,
        selected: true,
        count: 1,
      }));
      this.showCloneIssueDialog = true;
    },

    async executeCloneIssues() {
      if (this.selectedCloneIssueItems.length === 0) return;

      if (process.client && document.activeElement?.blur) {
        document.activeElement.blur();
      }

      this.$swal.fire({
        title: "กำลัง Clone...",
        html: '<div class="text-body-2 grey--text">กรุณารอสักครู่</div>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => this.$swal.showLoading(),
      });

      let successCount = 0,
        failCount = 0;
      const successNames = [];
      const failNames = [];
      try {
        for (const item of this.selectedCloneIssueItems) {
          const issueName = item.issue.title || item.issue.name || "Untitled Issue";
          for (let i = 0; i < item.count; i++) {
            try {
              await this.$store.dispatch("issue/createIssue", {
                name: item.issue.title || item.issue.name,
                title: item.issue.title || item.issue.name,
                description: item.issue.description || "",
                issueType: item.issue.issueType || "issue",
                labels: item.issue.labels || [],
                assigneeUsername: item.issue.assigneeUsername || null,
                milestone: item.issue.milestone || null,
                startDate: null,
                dueDate: null,
                timeEstimate: item.issue.timeEstimate || 0,
                timeSpent: item.issue.timeSpent || 0,
                projectId: item.issue.projectId || null,
                productId: item.issue.productId || null,
              });
              successCount++;
              successNames.push(issueName);
            } catch (cloneError) {
              failCount++;
              failNames.push(issueName);
            }
          }
        }
        this.showCloneIssueDialog = false;
        this.cloneIssueItems = [];
        this.clearSelection();
        await this.getIssues();
        await this.$nextTick();
        if (process.client && document.activeElement?.blur) {
          document.activeElement.blur();
        }
        const msg =
          failCount > 0
            ? `Clone สำเร็จ ${successCount} รายการ\nสำเร็จ: ${successNames.join(", ") || "-"}\nล้มเหลว ${failCount} รายการ\nล้มเหลว: ${failNames.join(", ") || "-"}`
            : `Clone สำเร็จ ${successCount} รายการ\nสำเร็จ: ${successNames.join(", ") || "-"}`;
        this.$swal.fire("สำเร็จ", msg, failCount > 0 ? "warning" : "success");
      } catch (err) {
        this.showCloneIssueDialog = false;
        await this.$nextTick();
        if (process.client && document.activeElement?.blur) {
          document.activeElement.blur();
        }
        this.$swal.fire(
          "ผิดพลาด",
          "ไม่สามารถ Clone ได้: " + (err.message || ""),
          "error"
        );
      }
    },
  },
  head() {
    return { title: "All Issues - GitLab Issue Tracker" };
  },
};
</script>

<style scoped>
.filter-chip {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
