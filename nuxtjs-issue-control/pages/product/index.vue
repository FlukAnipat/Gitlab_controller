<template>
  <v-container v-if="pageReady" fluid class="pa-0 grey lighten-5">
    <v-sheet
      tile
      color="blue lighten-5"
      class="px-6 py-2 caption font-weight-medium"
    >
      {{ username }}/Project/{{ currentProject?.name }}/Product
    </v-sheet>

    <v-container fluid class="px-6 py-4">
      <v-row align="center" justify="space-between" class="mb-2">
        <v-col cols="12" md="8" class="d-flex align-center flex-wrap">
          <div class="text-h5 font-weight-bold mr-6 my-1">
            Products ({{ currentProject?.name }})
          </div>
          <div class="d-flex align-center my-1">
            <v-btn
              depressed
              small
              class="mr-2"
              :color="stateFilter === 'opened' ? 'teal' : 'grey lighten-3'"
              :dark="stateFilter === 'opened'"
              @click="stateFilter = 'opened'"
            >
              <v-icon left small>mdi-record-circle-outline</v-icon>เปิดใช้งาน ({{
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
              <v-icon left small>mdi-check-circle</v-icon>ปิดใช้งาน ({{
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
            >สร้าง Product</v-btn
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
            placeholder="ค้นหา product..."
            background-color="white"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
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
          />
        </v-col>
        <v-col cols="12" md="2">
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
        :current-project-label-names="activeLabelFilters"
        type-label="Products"
        @clear="clearSelection"
        @clone="openCloneProductDialog"
        @restore="confirmRestoreSelectedProducts"
        @delete="confirmDeleteSelectedProducts"
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
          <template v-for="(product, index) in pagedItems">
            <div :key="product.id">
              <v-list-item 
                class="py-2" 
                :class="{ 'teal lighten-5': isItemSelected(product.id) }"
                @click="isBulkMode ? toggleItemSelection(product.id) : openProductDetail(product)"
              >
                <v-list-item-action class="my-0 mr-2 py-0" v-if="isBulkMode">
                  <v-checkbox
                    :input-value="isItemSelected(product.id)"
                    hide-details
                    dense
                    class="mt-0 pt-0"
                    readonly
                  />
                </v-list-item-action>
                <v-list-item-content class="py-1">
                  <div
                    v-if="product.gitlabIssueId"
                    class="caption grey--text text--darken-1 d-flex align-center mb-1"
                  >
                    <span class="mr-2"
                      >#{{ product.gitlabIid || product.gitlabIssueId }}</span
                    >
                    <v-chip
                      v-if="product.assigneeUsername"
                      x-small
                      label
                      color="orange lighten-5"
                      text-color="orange darken-3"
                      title="ผู้รับผิดชอบ"
                    >
                      <v-icon x-small left>mdi-account-check</v-icon
                      >{{ product.assigneeUsername }}
                    </v-chip>
                  </div>
                  <div class="d-flex align-center flex-wrap">
                    <div class="body-2 font-weight-bold mr-2">
                      {{ product.name }}
                    </div>
                    <v-chip
                      x-small
                      label
                      class="mr-1"
                      color="blue lighten-5"
                      text-color="primary"
                      >{{ product.issueType || "product" }}</v-chip
                    >
                    <v-chip
                      x-small
                      label
                      class="mr-1 font-weight-bold"
                      :color="
                        product.state === 'closed'
                          ? 'grey lighten-3'
                          : 'green lighten-5'
                      "
                      :text-color="
                        product.state === 'closed'
                          ? 'grey darken-1'
                          : 'green darken-2'
                      "
                    >
                      <v-icon x-small left>{{
                        product.state === "closed"
                          ? "mdi-check-circle"
                          : "mdi-record-circle-outline"
                      }}</v-icon>
                      {{ product.state === "closed" ? "Closed" : "Opened" }}
                    </v-chip>
                    <span class="caption grey--text text--darken-1"
                      >{{ formatDateThai(product.createdAt)
                      }}{{
                        product.authorUsername
                          ? " " + product.authorUsername
                          : ""
                      }}</span
                    >
                  </div>
                  <!-- <div
                    class="caption grey--text text--darken-1"
                    v-html="truncateDescription(product.description)"
                  ></div> -->
                  <div class="d-flex flex-wrap align-center mt-2">
                    <v-chip
                      v-for="label in product.parsedLabels"
                      :key="label"
                      x-small
                      pill
                      class="mr-1"
                      :color="getLabelChipColor(label)"
                      :text-color="getLabelChipTextColor(label)"
                    >
                      {{ label }}
                    </v-chip>
                  </div>
                  <div
                    v-if="product.startDate || product.dueDate"
                    class="d-flex align-center flex-wrap mt-1"
                    style="gap: 4px"
                  >
                    <v-chip
                      v-if="product.startDate"
                      x-small
                      label
                      color="cyan lighten-5"
                      text-color="cyan darken-3"
                    >
                      <v-icon x-small left>mdi-calendar-arrow-right</v-icon>
                      {{ formatDateThai(product.startDate) }}
                    </v-chip>
                    <v-icon
                      v-if="product.startDate && product.dueDate"
                      x-small
                      color="grey lighten-1"
                      >mdi-arrow-right-thin</v-icon
                    >
                    <v-chip
                      v-if="product.dueDate"
                      x-small
                      label
                      :color="
                        isOverdue(product) ? 'red lighten-5' : 'teal lighten-5'
                      "
                      :text-color="
                        isOverdue(product) ? 'red darken-2' : 'teal darken-2'
                      "
                    >
                      <v-icon x-small left>mdi-calendar-clock</v-icon>
                      {{ formatDateThai(product.dueDate) }}
                      <v-icon
                        v-if="isOverdue(product)"
                        x-small
                        right
                        color="red darken-1"
                        >mdi-alert-circle</v-icon
                      >
                    </v-chip>
                  </div>
                </v-list-item-content>
                <v-list-item-action class="my-0 ml-2 py-0">
                  <div class="d-flex align-center">
                    <v-btn
                      v-if="product.state !== 'closed'"
                      outlined
                      small
                      color="#1867C5"
                      class="text-none px-3 mr-2"
                      @click.stop="goToAddIssueForProduct(product)"
                    >
                      <v-icon left small>mdi-plus</v-icon>เพิ่ม
                    </v-btn>
                    <v-btn
                      v-if="product.state !== 'closed'"
                      outlined
                      small
                      color="#D32F2F"
                      class="text-none px-3"
                      @click.stop="confirmDeleteProduct(product)"
                    >
                      ปิด
                    </v-btn>
                    <v-btn
                      v-if="product.state === 'closed'"
                      outlined
                      small
                      color="blue"
                      class="text-none px-3"
                      @click.stop="confirmRestoreProduct(product)"
                    >
                      เปิดใช้งาน
                    </v-btn>
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
          >mdi-cube-outline</v-icon
        >
        <div class="text-h6 mb-2">ยังไม่มี Product</div>
        <div class="body-2 grey--text">
          กดปุ่ม เพิ่ม เพื่อสร้าง Product ใหม่
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

    <ProductDetailDialog
      v-model="showProductDetailDialog"
      :initialProduct="selectedProduct"
      @success="handleProductUpdated"
      @deleted="handleProductDeleted"
    />
    <CreateProductDialog
      v-model="showCreateDialog"
      @success="onProductCreated"
    />
    <CreateIssueDialog
      v-model="showCreateIssueDialog"
      :productId="selectedProductId"
    />

    <!-- Clone Product Dialog -->
    <v-dialog v-model="showCloneProductDialog" max-width="460" persistent>
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center pt-5 px-6 pb-0">
          <v-avatar rounded size="32" class="mr-3" color="teal lighten-5">
            <v-icon size="18" color="teal darken-1"
              >mdi-content-duplicate</v-icon
            >
          </v-avatar>
          <span class="text-h6 font-weight-bold">Clone Products</span>
          <v-spacer />
          <v-btn icon @click="showCloneProductDialog = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
        </v-card-title>

        <v-card-text class="px-6 pt-4 pb-2">
          <v-sheet outlined rounded="lg" class="overflow-hidden mb-4">
            <div
              v-for="(item, idx) in cloneProductItems"
              :key="item.product.id"
              class="d-flex align-center px-4 py-3"
              :style="
                idx < cloneProductItems.length - 1
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
              <span
                class="text-body-2 font-weight-medium grey--text text--darken-3 flex-grow-1"
                >{{ item.product.name }}</span
              >
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
              จะสร้าง product ใหม่
              <strong class="teal--text text--darken-2">{{
                totalCloneProductCount
              }}</strong>
              รายการ โดยไม่ติด issue link, start date และ due date
            </div>
          </v-sheet>
        </v-card-text>

        <v-card-actions class="px-6 pb-5 pt-2">
          <v-btn text color="grey" @click="showCloneProductDialog = false"
            >ยกเลิก</v-btn
          >
          <v-spacer />
          <v-btn
            color="teal darken-1"
            dark
            depressed
            class="rounded-lg font-weight-bold px-6"
            :disabled="selectedCloneProductItems.length === 0"
            @click="executeCloneProducts"
          >
            <v-icon left size="16">mdi-content-duplicate</v-icon>
            Clone ({{ totalCloneProductCount }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showCloneDialog" max-width="680" persistent>
      <v-card class="rounded-xl">
        <v-card-title
          class="d-flex align-center justify-space-between pt-5 px-6 pb-0"
        >
          <div class="d-flex align-center">
            <v-avatar rounded size="32" class="mr-3" color="indigo lighten-5">
              <v-icon size="18" color="indigo">mdi-content-copy</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-bold">Clone Issues</span>
          </div>
          <v-btn icon @click="showCloneDialog = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
        </v-card-title>

        <v-card-text class="px-6 pt-5 pb-2">
          <div
            class="text-caption font-weight-bold grey--text text-uppercase mb-3"
            style="letter-spacing: 0.07em"
          >
            Product ที่เลือก ({{ selectedIds.length }})
          </div>
          <div class="d-flex flex-wrap mb-4" style="gap: 6px">
            <v-chip
              v-for="id in selectedIds"
              :key="id"
              small
              label
              color="indigo lighten-5"
              text-color="indigo darken-2"
            >
              {{ getProductName(id) }}
            </v-chip>
          </div>

          <v-divider class="mb-4" />

          <!-- เลือก issue และกำหนดจำนวน clone -->
          <div
            class="text-caption font-weight-bold grey--text text-uppercase mb-3"
            style="letter-spacing: 0.07em"
          >
            เลือก Issues และกำหนดจำนวน
          </div>

          <div v-if="cloneIssueLoading" class="d-flex justify-center py-6">
            <v-progress-circular indeterminate color="indigo" size="28" />
          </div>

          <div
            v-else-if="cloneableIssues.length === 0"
            class="text-center py-6 grey--text"
          >
            <v-icon size="40" color="grey lighten-2" class="mb-2 d-block"
              >mdi-alert-circle-outline</v-icon
            >
            ไม่พบ Issue ใน Product ที่เลือก
          </div>

          <div v-else>
            <v-sheet outlined rounded="lg" class="overflow-hidden mb-3">
              <div
                v-for="(item, idx) in cloneItems"
                :key="item.issue.id"
                class="d-flex align-center px-4 py-3"
                :style="
                  idx < cloneItems.length - 1
                    ? 'border-bottom:1px solid #F3F4F6'
                    : ''
                "
              >
                <!-- checkbox เลือก -->
                <v-checkbox
                  v-model="item.selected"
                  hide-details
                  dense
                  class="mt-0 pt-0 mr-3 flex-shrink-0"
                />

                <!-- ชื่อ issue -->
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
                  <div class="d-flex align-center mt-1" style="gap: 6px">
                    <span class="text-caption grey--text"
                      >#{{
                        item.issue.gitlabIid || item.issue.gitlabIssueId
                      }}</span
                    >
                    <span
                      v-if="item.issue.assigneeUsername"
                      class="text-caption grey--text"
                    >
                      <v-icon size="11" color="grey"
                        >mdi-account-outline</v-icon
                      >
                      {{ item.issue.assigneeUsername }}
                    </span>
                    <v-chip
                      x-small
                      label
                      color="blue lighten-5"
                      text-color="primary"
                      class="text-caption"
                    >
                      {{ getProductName(item.issue.productId) }}
                    </v-chip>
                  </div>
                </div>

                <!-- กำหนดจำนวน clone -->
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
                    max="20"
                    dense
                    outlined
                    hide-details
                    style="width: 60px"
                    class="text-center rounded-lg"
                    @input="
                      item.count = Math.min(
                        20,
                        Math.max(1, parseInt(item.count) || 1)
                      )
                    "
                  />
                  <v-btn
                    icon
                    x-small
                    :disabled="!item.selected || item.count >= 20"
                    @click="item.count = Math.min(20, item.count + 1)"
                  >
                    <v-icon size="16">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-sheet>

            <!-- สรุป -->
            <v-sheet color="indigo lighten-5" rounded="lg" class="pa-3">
              <div
                class="text-caption font-weight-bold indigo--text text--darken-2 mb-2"
              >
                สรุปการ Clone:
              </div>
              <div
                v-for="item in selectedCloneItems"
                :key="item.issue.id"
                class="d-flex align-center justify-space-between text-body-2 mb-1"
              >
                <span
                  class="grey--text text--darken-3"
                  style="
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 380px;
                  "
                >
                  {{ item.issue.title || item.issue.name }}
                </span>
                <v-chip
                  small
                  label
                  color="indigo"
                  dark
                  class="font-weight-bold ml-2 flex-shrink-0"
                >
                  × {{ item.count }}
                </v-chip>
              </div>
              <div
                v-if="selectedCloneItems.length === 0"
                class="text-caption grey--text"
              >
                ยังไม่ได้เลือก Issue
              </div>
              <v-divider class="my-2" v-if="selectedCloneItems.length > 0" />
              <div
                v-if="selectedCloneItems.length > 0"
                class="text-caption font-weight-bold indigo--text"
              >
                รวม {{ totalCloneCount }} issues ใหม่
              </div>
            </v-sheet>
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-5 pt-2">
          <v-btn text color="grey" @click="showCloneDialog = false"
            >ยกเลิก</v-btn
          >
          <v-spacer />
          <v-btn
            color="indigo"
            dark
            depressed
            class="rounded-lg font-weight-bold px-6"
            :loading="cloneLoading"
            :disabled="selectedCloneItems.length === 0 || cloneLoading"
            @click="executeClone"
          >
            <v-icon left size="16">mdi-content-copy</v-icon>
            Clone {{ totalCloneCount }} Issues
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
import CreateProductDialog from "./createProduct.vue";
import ProductDetailDialog from "./detailProduct.vue";
import CreateIssueDialog from "../issue/createIssue.vue";
import labelChipMixin from "~/mixins/labelChip";
import dateFormatMixin from "~/mixins/dateFormat";
import bulkActionsMixin from "~/mixins/bulkActions";
import listPageMixin from "~/mixins/listPageMixin";
import BulkActionBar from "~/components/BulkActionBar.vue";

export default {
  name: "ProductIndexPage",
  mixins: [labelChipMixin, dateFormatMixin, bulkActionsMixin, listPageMixin],
  components: {
    CreateProductDialog,
    ProductDetailDialog,
    CreateIssueDialog,
    BulkActionBar,
  },
  data() {
    return {
      showCreateDialog: false,
      showCreateIssueDialog: false,
      selectedProductId: null, // For single-issue creation
      showProductDetailDialog: false,
      selectedProduct: null,
      // Clone Issue
      showCloneDialog: false,
      cloneIssueLoading: false,
      cloneLoading: false,
      cloneableIssues: [],
      cloneItems: [],
      // Clone Product
      showCloneProductDialog: false,
      cloneProductItems: [],
      dbUsers: [],
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
    targetProductProject() {
      return this.projects.find(
        (project) =>
          Number(project.status) === 1 &&
          String(project.projectType || "").toLowerCase() === "product"
      ) || this.projects.find(
        (project) => String(project.projectType || "").toLowerCase() === "product"
      );
    },
    products() {
      return this.$store.getters["product/products"];
    },
    searchOptions() {
      return [...new Set((this.products || []).map((p) => p.name))]
        .filter(Boolean)
        .sort();
    },
    loading() {
      return this.$store.getters["product/loading"];
    },
    // products ที่กรอง user/label/search แล้ว แต่ยังไม่กรอง state — ใช้คำนวณ open/closed count
    filteredProductsAllStates() {
      let result = (this.$store.getters["product/products"] || []).map((p) => ({
        ...p,
        parsedLabels: this.parseLabels(p.labels),
      }));
      if (this.targetProductProject?.id) {
        result = result.filter(
          (p) => Number(p.projectId) === Number(this.targetProductProject.id)
        );
      }
      // กรองตาม labels ของ project ปัจจุบันเสมอ
      const projectLabels = this.activeLabelFilters;
      if (projectLabels && projectLabels.length > 0)
        result = result.filter((p) =>
          p.parsedLabels?.some((label) => projectLabels.includes(label))
        );
      if (this.selectedUserDisplay)
        result = result.filter(
          (p) => p.assigneeUsername === this.selectedUserDisplay
        );
      const statusFilters = (this.selectedStatusDisplay || []).map((l) =>
        l.toLowerCase()
      );
      if (statusFilters && statusFilters.length > 0)
        result = result.filter((p) =>
          p.parsedLabels?.some((label) =>
            statusFilters.includes(label.toLowerCase())
          )
        );
      if (this.filterStartDate || this.filterDueDate) {
        result = result.filter((p) => this.isDateOverlapping(p, this.filterStartDate, this.filterDueDate));
      }
      const q = (this.searchQuery || "").trim().toLowerCase();
      if (q) {
        result = result.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        );
      }
      return result;
    },
    openCount() {
      return this.filteredProductsAllStates.filter((p) => p.state === "opened")
        .length;
    },
    closedCount() {
      return this.filteredProductsAllStates.filter((p) => p.state === "closed")
        .length;
    },
    labelColorMap() {
      return this.$store.getters["labels/labelColorMap"];
    },
    userFilterOptions() {
      return this.dbUsers || [];
    },
    statusFilterOptions() {
      const options = new Set();
      const statusLabels = this.bulkLabelsByType[2] || [];
      statusLabels.forEach((l) => options.add(l.name));
      return Array.from(options).sort();
    },
    isLabelContext() {
      return (
        !!this.currentProject &&
        (this.currentProject.color ||
          this.currentProject.type !== undefined ||
          this.currentProject.status ||
          (!this.currentProject.gitlabProjectId &&
            !this.currentProject.pathWithNamespace))
      );
    },
    activeLabelFilters() {
      if (!this.isLabelContext) return [];
      return this.parseLabels(
        this.currentProject?.labels || this.currentProject?.name
      );
    },
    filteredItems() {
      let result = this.filteredProductsAllStates;
      if (this.stateFilter)
        result = result.filter((p) => p.state === this.stateFilter);
      return result;
    },
    selectedProducts() {
      const selected = new Set(this.selectedIds.map((id) => Number(id)));
      return (this.filteredItems || []).filter((product) =>
        selected.has(Number(product.id))
      );
    },
    // Clone Issue computed
    selectedCloneItems() {
      return this.cloneItems.filter((item) => item.selected);
    },
    totalCloneCount() {
      return this.selectedCloneItems.reduce(
        (sum, item) => sum + (item.count || 1),
        0
      );
    },
    // Clone Product computed
    selectedCloneProductItems() {
      return this.cloneProductItems.filter((item) => item.selected);
    },
    totalCloneProductCount() {
      return this.selectedCloneProductItems.reduce(
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
        this.getProducts(),
        this.getLabels(),
        this.loadBulkLabelsByType(),
        this.getUsers(),
      ]);
      // Restore filters
      const savedLabelFilter = this.$store.state.product?.labelFilter;
      this.selectedUserDisplay = null;
      this.selectedStatusDisplay = savedLabelFilter || [];
      if (this.$route.query.create === "1") this.showCreateDialog = true;
    } catch (error) {
      console.error("ไม่สามารถโหลดหน้า product ได้", error);
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
    selectedUserDisplay(val) {
      this.$store.commit("product/SET_USER_FILTER", val ? [val] : []);
    },
    selectedStatusDisplay(val) {
      this.$store.commit("product/SET_LABEL_FILTER", val);
    },
  },
  methods: {
    async getProducts() {
      try {
        await this.$store.dispatch("product/getProducts");
      } catch (error) {
        console.error("ไม่สามารถดึงข้อมูล Products ได้", error);
      }
    },
    async getLabels() {
      try {
        await this.$store.dispatch("labels/getLabels");
      } catch (error) {
        console.error("ไม่สามารถดึงข้อมูล Labels ได้", error);
      }
    },
    async getUsers() {
      try {
        const res = await this.$store.dispatch("auth/getUsers", { limit: 500, page: 1 });
        const rows = Array.isArray(res.data) ? res.data : [];
        this.dbUsers = rows
          .map((u) => u.username)
          .filter(Boolean)
          .sort();
      } catch (error) {
        console.error("ไม่สามารถดึงข้อมูล Users ได้", error);
      }
    },
    onProductCreated() {
      this.showCreateDialog = false;
    },
    openProductDetail(product) {
      this.selectedProduct = product;
      this.showProductDetailDialog = true;
    },
    async handleProductUpdated(updatedProduct) {
      await this.getProducts();
      if (updatedProduct) {
        const fresh =
          (this.$store.getters["product/products"] || []).find(
            (p) => Number(p.id) === Number(updatedProduct.id)
          ) || updatedProduct;
        this.selectedProduct = null;
        await this.$nextTick();
        this.selectedProduct = fresh;
      }
    },
    async handleProductDeleted() {
      await this.getProducts();
      this.selectedProduct = null;
      this.showProductDetailDialog = false;
    },
    async confirmDeleteProduct(product) {
      if (!product?.id) return;
      const result = await this.$swal.fire({
        title: "ลบ Product นี้?",
        text: "ระบบจะเปลี่ยน state เป็น closed และทำ soft delete",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;
      try {
        await this.$store.dispatch("product/deleteProduct", product.id);
        await this.getProducts();
        this.$swal.fire("สำเร็จ", "ลบ Product เรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "ลบไม่สำเร็จ: " + error.message, "error");
      }
    },
    async confirmRestoreProduct(product) {
      if (!product?.id) return;
      const result = await this.$swal.fire({
        title: "กู้คืน Product นี้?",
        text: "ระบบจะเปลี่ยน state กลับเป็น opened",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "กู้คืน",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;
      try {
        await this.$store.dispatch("product/restoreProduct", product.id);
        await this.getProducts();
        this.$swal.fire("สำเร็จ", "กู้คืนเรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "กู้คืนไม่สำเร็จ: " + error.message, "error");
      }
    },
    async confirmRestoreSelectedProducts() {
      if (this.selectedIds.length === 0) return;
      const result = await this.$swal.fire({
        title: `กู้คืน ${this.selectedIds.length} รายการที่เลือก?`,
        icon: "question",
        showCancelButton: true,
      });
      if (!result.isConfirmed) return;
      try {
        this.$swal.fire({ title: "กำลังกู้คืน...", allowOutsideClick: false, didOpen: () => this.$swal.showLoading() });
        for (const id of this.selectedIds) {
          await this.$store.dispatch("product/restoreProduct", id);
        }
        this.clearSelection();
        await this.getProducts();
        this.$swal.fire("สำเร็จ", "กู้คืนเรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "กู้คืนไม่สำเร็จ", "error");
      }
    },
    async confirmDeleteSelectedProducts() {
      if (this.selectedIds.length === 0) return;
      const result = await this.$swal.fire({
        title: `ลบ ${this.selectedIds.length} รายการที่เลือก?`,
        icon: "warning",
        showCancelButton: true,
      });
      if (!result.isConfirmed) return;
      try {
        this.$swal.fire({ title: "กำลังลบ...", allowOutsideClick: false, didOpen: () => this.$swal.showLoading() });
        for (const id of this.selectedIds) {
          await this.$store.dispatch("product/deleteProduct", id);
        }
        this.clearSelection();
        await this.getProducts();
        this.$swal.fire("สำเร็จ", "ลบเรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "ลบไม่สำเร็จ", "error");
      }
    },
    async bulkAssign(username) {
      if (this.selectedIds.length === 0) return;
      try {
        this.$swal.fire({ title: "กำลังอัปเดต...", allowOutsideClick: false, didOpen: () => this.$swal.showLoading() });
        for (const id of this.selectedIds) {
          await this.$store.dispatch("product/updateProduct", {
            productId: id,
            productData: { assigneeUsername: username },
          });
        }
        await this.getProducts();
        this.$swal.fire("สำเร็จ", "อัปเดตเรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "อัปเดตไม่สำเร็จ", "error");
      }
    },
    async applyBulkAddLabels(labelsToAdd) {
      if (this.selectedIds.length === 0 || labelsToAdd.length === 0) return;
      try {
        this.$swal.fire({ title: "กำลังเพิ่ม Labels...", allowOutsideClick: false, didOpen: () => this.$swal.showLoading() });
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
          const product = this.products.find((p) => Number(p.id) === Number(id));
          const existing = this.parseLabels(product?.labels);
          const preservedLabels = existing.filter((label) => {
            const type = labelTypeMap.get(label);
            if (replaceStatus && type === 2) return false;
            if (replaceRole && type === 3) return false;
            return true;
          });
          const labels = [...new Set([...preservedLabels, ...labelsToAdd])].join(",");
          await this.$store.dispatch("product/updateProduct", {
            productId: id,
            productData: { labels },
          });
        }
        await this.getProducts();
        this.$swal.fire("สำเร็จ", "เพิ่ม Labels เรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "เพิ่มไม่สำเร็จ", "error");
      }
    },
    async applyBulkRemoveLabels(labelsToRemove) {
      if (this.selectedIds.length === 0 || labelsToRemove.length === 0) return;
      try {
        this.$swal.fire({ title: "กำลังลบ Labels...", allowOutsideClick: false, didOpen: () => this.$swal.showLoading() });
        for (const id of this.selectedIds) {
          const product = this.products.find((p) => Number(p.id) === Number(id));
          const existing = this.parseLabels(product?.labels);
          const labels = existing.filter((l) => !labelsToRemove.includes(l)).join(",");
          await this.$store.dispatch("product/updateProduct", {
            productId: id,
            productData: { labels },
          });
        }
        await this.getProducts();
        this.$swal.fire("สำเร็จ", "ลบ Labels เรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", "ลบไม่สำเร็จ", "error");
      }
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
    goToAddIssueForProduct(product) {
      if (!product?.id) return;
      this.selectedProductId = product.id;
      this.showCreateIssueDialog = true;
    },
    getProductName(id) {
      const p = (this.products || []).find((p) => Number(p.id) === Number(id));
      return p ? p.name : `Product #${id}`;
    },
    async openCloneDialog() {
      if (this.selectedIds.length === 0) return;
      this.showCloneDialog = true;
      this.cloneIssueLoading = true;
      try {
        const res = await this.$store.dispatch("issue/getIssues", {
          productIds: this.selectedIds.join(","),
        });
        this.cloneableIssues = (res.data || []).filter((i) => i.state !== "closed");
        this.cloneItems = this.cloneableIssues.map((issue) => ({
          issue,
          selected: true,
          count: 1,
        }));
      } catch (err) {
        console.error(err);
      } finally {
        this.cloneIssueLoading = false;
      }
    },
    async executeClone() {
      if (this.selectedCloneItems.length === 0) return;
      this.cloneLoading = true;
      if (process.client && document.activeElement?.blur) {
        document.activeElement.blur();
      }
      try {
        for (const item of this.selectedCloneItems) {
          for (let i = 0; i < item.count; i++) {
            await this.$store.dispatch("issue/createIssue", {
              ...item.issue,
              id: undefined,
              gitlabIssueId: undefined,
              gitlabIid: undefined,
            });
          }
        }
        this.showCloneDialog = false;
        this.clearSelection();
        await this.getProducts();
        await this.$nextTick();
        if (process.client && document.activeElement?.blur) {
          document.activeElement.blur();
        }
        this.$swal.fire("สำเร็จ", "Clone Issues เรียบร้อยแล้ว", "success");
      } catch (err) {
        this.showCloneDialog = false;
        await this.$nextTick();
        if (process.client && document.activeElement?.blur) {
          document.activeElement.blur();
        }
        this.$swal.fire("ผิดพลาด", err.message, "error");
      } finally {
        this.cloneLoading = false;
      }
    },
    openCloneProductDialog() {
      if (this.selectedIds.length === 0) return;
      this.cloneProductItems = this.selectedProducts.map((p) => ({
        product: p,
        selected: true,
        count: 1,
      }));
      this.showCloneProductDialog = true;
    },
    async executeCloneProducts() {
      if (this.selectedCloneProductItems.length === 0) return;
      if (process.client && document.activeElement?.blur) {
        document.activeElement.blur();
      }
      this.$swal.fire({ title: "กำลัง Clone...", allowOutsideClick: false, didOpen: () => this.$swal.showLoading() });
      try {
        const result = await this.$store.dispatch("product/cloneProducts", {
          items: this.selectedCloneProductItems.map((item) => ({
            ...item.product,
            count: item.count,
          })),
          prefix: null,
          count: 1,
        });
        if (!result.success) throw new Error(result.message || "Clone failed");
        this.showCloneProductDialog = false;
        this.clearSelection();
        await this.getProducts();
        await this.$nextTick();
        if (process.client && document.activeElement?.blur) {
          document.activeElement.blur();
        }
        this.$swal.fire("สำเร็จ", "Clone Products เรียบร้อยแล้ว", "success");
      } catch (err) {
        this.showCloneProductDialog = false;
        await this.$nextTick();
        if (process.client && document.activeElement?.blur) {
          document.activeElement.blur();
        }
        this.$swal.fire("ผิดพลาด", err.message, "error");
      }
    },
  },
  head() {
    return { title: "Products - GitLab Issue Tracker" };
  },
};
</script>
