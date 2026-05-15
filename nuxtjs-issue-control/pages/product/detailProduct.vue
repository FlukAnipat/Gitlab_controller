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
                <v-icon size="20" color="#00A896">mdi-cube-outline</v-icon>
              </v-avatar>
              <h2
                class="text-h5 font-weight-bold grey--text text--darken-4 mb-0"
                style="letter-spacing: -0.025em"
              >
                Product Details
              </h2>
            </div>
            <div class="d-flex align-center" style="gap: 8px">
              <v-btn
                v-if="product && product.webUrl"
                :href="product.webUrl"
                target="_blank"
                rel="noopener noreferrer"
                small
                text
                color="#1867C5"
                class="text-none font-weight-bold rounded-lg px-3"
                elevation="0"
                height="32"
              >
                <v-icon size="14" class="mr-1">mdi-open-in-new</v-icon>View in
                GitLab
              </v-btn>
              <v-btn icon plain @click="closeDialog"
                ><v-icon size="22" color="grey lighten-1"
                  >mdi-close</v-icon
                ></v-btn
              >
            </div>
          </div>
        </v-card-title>

        <v-card-text
          class="px-0 pt-0 pb-0"
          style="height: 72vh; overflow-y: auto"
        >
          <v-row no-gutters style="height: 100%">
            <!-- Left -->
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
                v-if="product"
                v-model="product.name"
                placeholder="ระบุชื่อ Product..."
                outlined
                background-color="#f9fafb"
                color="#00A896"
                hide-details
                maxlength="200"
                class="font-weight-bold mb-5 rounded-lg"
                @input="updateField('name', $event)"
              />

              <div
                class="d-flex align-center mb-6"
                style="flex-wrap: wrap; gap: 8px"
              >
                <div
                  class="text-caption font-weight-bold grey--text text-uppercase mr-3"
                  style="letter-spacing: 0.07em"
                >
                  Type
                </div>
                <v-chip
                  v-if="product"
                  x-small
                  label
                  class="mr-1"
                  color="blue lighten-5"
                  text-color="primary"
                  >{{ product.issueType || "product" }}</v-chip
                >
                <v-chip
                  v-if="product"
                  x-small
                  label
                  class="font-weight-bold"
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
              </div>

              <v-divider class="mb-5" style="border-color: #f3f4f6" />

              <!-- Linked Issues -->
              <div class="mb-5">
                <div class="d-flex align-center mb-3">
                  <v-icon size="16" color="#00A896" class="mr-2"
                    >mdi-link-variant</v-icon
                  >
                  <span
                    class="text-caption font-weight-bold grey--text text-uppercase"
                    style="letter-spacing: 0.07em"
                    >Linked Issues</span
                  >
                  <v-chip
                    x-small
                    class="ml-2 font-weight-bold"
                    :color="
                      linkedIssues.length > 0
                        ? 'teal lighten-5'
                        : 'grey lighten-3'
                    "
                    :text-color="
                      linkedIssues.length > 0 ? 'teal darken-2' : 'grey'
                    "
                    >{{ linkedIssues.length }}</v-chip
                  >
                </div>
                <div
                  v-if="linkedIssues.length > 0"
                  :style="
                    linkedIssues.length > 3
                      ? 'max-height:240px;overflow-y:auto;'
                      : ''
                  "
                  class="linked-issues-list"
                >
                  <div
                    v-for="issue in linkedIssues"
                    :key="issue.id"
                    class="rounded-lg pa-3 mb-2"
                    style="background: #f9fafb; border: 1px solid #e5e7eb"
                  >
                    <div class="d-flex align-center justify-space-between mb-1">
                      <div
                        class="d-flex align-center"
                        style="min-width: 0; flex: 1; gap: 6px"
                      >
                        <v-icon
                          size="14"
                          class="flex-shrink-0"
                          :color="issue.state === 'closed' ? 'grey' : '#00A896'"
                        >
                          {{
                            issue.state === "closed"
                              ? "mdi-check-circle"
                              : "mdi-record-circle-outline"
                          }}
                        </v-icon>
                        <span
                          class="text-body-2 font-weight-bold grey--text text--darken-3"
                          style="
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            max-width: 240px;
                          "
                        >
                          {{ issue.title || issue.name }}
                        </span>
                        <v-chip
                          x-small
                          label
                          class="font-weight-bold flex-shrink-0"
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
                          {{ issue.state === "closed" ? "Closed" : "Opened" }}
                        </v-chip>
                      </div>
                      <v-btn
                        icon
                        x-small
                        class="ml-1 flex-shrink-0"
                        color="grey lighten-1"
                        @click="removeLinkedIssue(issue)"
                      >
                        <v-icon x-small>mdi-close</v-icon>
                      </v-btn>
                    </div>
                    <div class="d-flex align-center mb-1" style="gap: 10px">
                      <span class="text-caption grey--text"
                        >#{{
                          issue.gitlabIid || issue.gitlabIssueId || "-"
                        }}</span
                      >
                      <span
                        v-if="issue.assigneeUsername"
                        class="d-flex align-center text-caption grey--text"
                      >
                        <v-icon size="12" color="grey" class="mr-1"
                          >mdi-account-outline</v-icon
                        >{{ issue.assigneeUsername }}
                      </span>
                      <v-btn
                        v-if="issue.webUrl"
                        :href="issue.webUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        x-small
                        text
                        color="#00A896"
                        class="text-none font-weight-bold pa-0 ml-auto"
                        height="18"
                        style="min-width: 0"
                        @click.stop
                      >
                        <v-icon size="11" class="mr-1">mdi-open-in-new</v-icon
                        >GitLab
                      </v-btn>
                    </div>
                    <div
                      v-if="issueLabelList(issue).length"
                      class="d-flex flex-wrap"
                      style="gap: 4px"
                    >
                      <v-chip
                        v-for="lbl in issueLabelList(issue)"
                        :key="lbl"
                        x-small
                        class="font-weight-bold"
                        pill
                        :color="getLabelChipColor(lbl)"
                        :text-color="getLabelChipTextColor(lbl)"
                      >
                        {{ lbl }}
                      </v-chip>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="d-flex align-center justify-center rounded-lg py-4"
                  style="border: 1.5px dashed #e5e7eb; color: #9ca3af"
                >
                  <v-icon size="16" color="grey lighten-1" class="mr-2"
                    >mdi-link-variant-off</v-icon
                  >
                  <span class="text-caption">ยังไม่มี Issue ที่เชื่อมอยู่</span>
                </div>

                <!-- Add new linked issue -->
                <div class="mt-3">
                  <v-col cols="12" class="px-0 pb-2">
                    <v-autocomplete
                      v-model="pendingLinkedProjectLabel"
                      :items="labelsByType[1]"
                      item-text="name"
                      item-value="name"
                      clearable
                      outlined
                      dense
                      hide-details
                      placeholder="เลือก Labels Project..."
                      no-data-text="ไม่พบ Labels Project"
                      color="#00A896"
                      background-color="white"
                      class="rounded-lg"
                      @change="onPendingProjectLabelChange"
                    />
                  </v-col>
                  <v-row no-gutters style="gap: 8px">
                    <v-col>
                      <v-autocomplete
                        v-model="pendingLinkedIssueId"
                        :items="availableIssuesForLink"
                        :item-text="(item) => item.title || item.name"
                        item-value="id"
                        clearable
                        outlined
                        dense
                        hide-details
                        placeholder="เลือก Issue เพื่อเชื่อม..."
                        no-data-text="ไม่พบ Issue"
                        color="#00A896"
                        background-color="white"
                        class="rounded-lg"
                        :disabled="!pendingLinkedProjectLabel"
                        :menu-props="{ maxHeight: '300px', offsetY: true }"
                      />
                    </v-col>
                    <v-col
                      cols="auto"
                      class="d-flex align-center"
                      style="gap: 4px"
                    >
                      <v-btn
                        v-if="pendingLinkedIssueId"
                        small
                        color="#00A896"
                        dark
                        class="text-none rounded-lg"
                        @click="saveLinkedIssue"
                        >เพิ่ม</v-btn
                      >
                    </v-col>
                  </v-row>
                </div>
              </div>

              <v-divider class="mb-5" style="border-color: #f3f4f6" />

              <!-- Description -->
              <div class="d-flex align-center justify-space-between mb-2">
                <div
                  class="text-caption font-weight-bold grey--text text-uppercase"
                  style="letter-spacing: 0.07em"
                >
                  Description
                </div>
                <v-btn
                  x-small
                  text
                  :color="descEditMode ? 'grey' : '#00A896'"
                  class="text-none font-weight-bold"
                  @click="toggleDescMode"
                >
                  <v-icon x-small class="mr-1">{{
                    descEditMode ? "mdi-eye-outline" : "mdi-pencil-outline"
                  }}</v-icon>
                  {{ descEditMode ? "ดูตัวอย่าง" : "แก้ไข" }}
                </v-btn>
              </div>

              <v-sheet
                v-if="!descEditMode"
                outlined
                rounded="lg"
                class="pa-4 mb-4 description-view"
                style="min-height: 160px; max-height: 420px; overflow-y: auto"
              >
                <div
                  v-if="product && product.description"
                  class="description-content"
                  v-html="renderDescription(product.description, product.webUrl)"
                />
                <div v-else class="text-caption grey--text py-6 text-center">
                  <v-icon size="32" color="grey lighten-2" class="mb-2 d-block"
                    >mdi-text-box-outline</v-icon
                  >
                  ยังไม่มีคำอธิบาย — กดปุ่ม "แก้ไข" เพื่อเพิ่ม
                </div>
              </v-sheet>

              <v-sheet
                v-if="descEditMode"
                outlined
                rounded="lg"
                class="overflow-hidden mb-4"
                style="min-height: 200px"
              >
                <client-only>
                  <vue-editor
                    v-if="product"
                    v-model="editableHtml"
                    ref="productEditor"
                    :use-custom-image-handler="true"
                    placeholder="อธิบาย Product ให้ละเอียด... (วางรูปภาพได้เลย)"
                    :editor-toolbar="EDITOR_TOOLBAR"
                    @text-change="onEditorTextChange"
                    @image-added="onEditorImageAdded"
                  />
                </client-only>
              </v-sheet>

              <!-- Time Tracking -->
              <div class="mb-5">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span
                    class="text-caption font-weight-bold grey--text text-uppercase"
                    style="letter-spacing: 0.07em"
                    >Time Tracking</span
                  >
                  <div class="d-flex align-center" style="gap: 8px">
                    <div style="max-width: 140px">
                      <div class="text-caption grey--text mb-1">Estimate</div>
                      <v-text-field
                        v-if="product"
                        v-model="timeEstimateDisplay"
                        placeholder="เช่น 2h, 8h"
                        dense
                        outlined
                        hide-details
                        background-color="white"
                        color="#00A896"
                        class="rounded-lg"
                        @input="handleTimeEstimateInput"
                      />
                    </div>
                    <div style="max-width: 140px">
                      <div class="text-caption grey--text mb-1">Time Spent</div>
                      <v-text-field
                        v-if="product"
                        v-model="timeSpentDisplay"
                        placeholder="เช่น 2h, 1h30m"
                        dense
                        outlined
                        hide-details
                        background-color="white"
                        color="#00A896"
                        class="rounded-lg"
                        @input="handleTimeSpentInput"
                      />
                    </div>
                  </div>
                </div>
                <div
                  v-if="product && product.timeEstimate > 0"
                  class="d-flex align-center mb-1"
                >
                  <span class="text-caption grey--text text--darken-1 mr-2"
                    >Spent {{ timeSpentDisplay || "0h" }}</span
                  >
                  <v-progress-linear
                    :value="
                      (product.timeSpent / (product.timeEstimate || 1)) * 100
                    "
                    color="#00A896"
                    background-color="grey lighten-3"
                    height="6"
                    rounded
                    class="flex-grow-1"
                  />
                  <span class="text-caption grey--text text--darken-1 ml-2"
                    >Estimate {{ timeEstimateDisplay || "0h" }}</span
                  >
                </div>
              </div>
            </v-col>

            <!-- Right -->
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
                  v-if="product"
                  v-model="product.assigneeUsername"
                  :items="projectMembers"
                  :loading="membersLoading"
                  placeholder="เลือก Assignee..."
                  dense
                  outlined
                  hide-details
                  clearable
                  background-color="white"
                  color="#00A896"
                  class="rounded-lg"
                  :menu-props="{ maxHeight: '220px', offsetY: true }"
                  no-data-text="ไม่พบสมาชิกของ Project"
                  @change="updateField('assigneeUsername', $event)"
                />
              </div>

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
                  v-if="product"
                  rounded="lg"
                  class="pa-3"
                  style="background: #f3f4f6; border: 1px solid #e5e7eb"
                >
                  <div
                    v-for="tDef in labelTypeDefs"
                    :key="tDef.type"
                    :class="tDef.type < 3 ? 'mb-3' : 'mb-0'"
                  >
                    <div class="d-flex align-center mb-1">
                      <v-icon size="13" :color="tDef.color" class="mr-1">{{
                        tDef.icon
                      }}</v-icon>
                      <span
                        class="text-caption font-weight-bold"
                        :style="{ color: tDef.color }"
                        >{{ tDef.label }}</span
                      >
                    </div>
                    <v-autocomplete
                      v-model="labelByType[tDef.type]"
                      :items="labelsByType[tDef.type]"
                      item-text="name"
                      item-value="name"
                      placeholder="ค้นหาหรือเลือก..."
                      dense
                      outlined
                      hide-details
                      clearable
                      background-color="white"
                      :multiple="tDef.type < 2"
                      :color="tDef.color"
                      class="rounded-lg"
                      :menu-props="{ maxHeight: '200px', offsetY: true }"
                      @change="onLabelTypeChange"
                    >
                      <template v-slot:selection="{ item }">
                        <v-chip
                          small
                          :close="tDef.type < 2"
                          class="mr-1 mb-1 font-weight-bold"
                          pill
                          :color="getLabelChipColor(item.name || item)"
                          :text-color="getLabelChipTextColor(item.name || item)"
                          @click:close="
                            removeLabelFromType(tDef.type, item.name || item)
                          "
                        >
                          {{ item.name || item }}
                        </v-chip>
                      </template>
                      <template v-slot:item="{ item, on, attrs }">
                        <v-list-item v-on="on" v-bind="attrs" class="py-1">
                          <v-list-item-icon
                            class="mr-2 my-auto"
                            style="min-width: 20px"
                          >
                            <v-icon
                              v-if="
                                (tDef.type >= 2 &&
                                  labelByType[tDef.type] ===
                                    (item.name || item)) ||
                                (tDef.type < 2 &&
                                  labelByType[tDef.type].includes(
                                    item.name || item
                                  ))
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
                  v-if="product"
                  v-model="product.milestone"
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
                  @change="updateField('milestone', $event)"
                />
              </div>

              <div v-if="product" class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon size="16" color="indigo lighten-2" class="mr-2"
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
                      :value="toDisplayDate(product.startDate)"
                      :label="`Start Date (${toDisplayDate(product.startDate) || 'วว/ดด/ปปปป'})`"
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
                      @click:clear="updateField('startDate', null)"
                    />
                  </template>
                  <v-date-picker
                    v-model="product.startDate"
                    :max="product.dueDate"
                    no-title
                    scrollable
                    @input="startDateMenu = false; updateField('startDate', product.startDate)"
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
                      :value="toDisplayDate(product.dueDate)"
                      :label="`Due Date (${toDisplayDate(product.dueDate) || 'วว/ดด/ปปปป'})`"
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
                      @click:clear="updateField('dueDate', null)"
                    />
                  </template>
                  <v-date-picker
                    v-model="product.dueDate"
                    :min="product.startDate"
                    no-title
                    scrollable
                    @input="dueDateMenu = false; updateField('dueDate', product.dueDate)"
                  />
                </v-menu>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider style="border-color: #f3f4f6" />
        <v-card-actions class="grey lighten-5 px-10 py-5">
          <v-spacer />
          <v-btn
            outlined
            text
            color="grey darken-2"
            class="text-none rounded-lg mr-3 font-weight-bold"
            elevation="0"
            height="40"
            @click="closeDialog"
            >ยกเลิก</v-btn
          >
          <v-btn
            v-if="isDirty"
            color="#00A896"
            class="white--text text-none rounded-lg font-weight-bold px-6"
            elevation="0"
            height="40"
            :loading="saving"
            @click="saveProduct"
          >
            <v-icon size="16" class="mr-1">mdi-content-save-outline</v-icon>
            บันทึก Product
            <v-chip
              x-small
              class="ml-2 font-weight-bold white--text"
              color="rgba(255,255,255,0.3)"
              >{{ dirtyCount }}</v-chip
            >
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import labelChipMixin      from "~/mixins/labelChip";
import milestoneOrderingMixin from "~/mixins/milestoneOrdering";
import detailFunctionMixin   from "~/mixins/detailFunction";
import dateFormatMixin       from "~/mixins/dateFormat";

export default {
  name: "ProductdetailFunction",
  mixins: [labelChipMixin, milestoneOrderingMixin, detailFunctionMixin, dateFormatMixin],

  components: {
    VueEditor: () =>
      process.client
        ? import("vue2-editor").then((m) => m.VueEditor)
        : Promise.resolve({ render: () => null }),
  },

  props: {
    value:          { type: Boolean, default: false },
    initialProduct: { type: Object,  default: null  },
  },

  data() {
    return {
      product: null,
      // Product-specific
      linkedIssues:             [],
      availableIssues:          [],
      pendingLinkedProjectLabel: null,
      pendingLinkedIssueId:      null,
      startDateMenu:             false,
      dueDateMenu:               false,
    };
  },

  computed: {
    /** ใช้โดย detailFunctionMixin.loadLabelsByType() */
    parsedLabels() {
      if (!this.product?.labels) return [];
      if (Array.isArray(this.product.labels)) return this.product.labels;
      return this.product.labels.split(",").map((s) => s.trim()).filter(Boolean);
    },
    availableIssuesForLink() {
      let list = (this.availableIssues || []).filter(
        (i) => i && i.state !== "closed"
      );
      if (this.pendingLinkedProjectLabel) {
        list = list.filter((i) => {
          if (!i.labels) return false;
          if (Array.isArray(i.labels))
            return i.labels.includes(this.pendingLinkedProjectLabel);
          return i.labels
            .split(",")
            .map((s) => s.trim())
            .includes(this.pendingLinkedProjectLabel);
        });
      }
      return list;
    },
  },

  watch: {
    value: {
      immediate: true,
      async handler(isOpen) {
        if (!isOpen) {
          this.linkedIssues              = [];
          this.availableIssues           = [];
          this.pendingLinkedProjectLabel = null;
          this.pendingLinkedIssueId      = null;
          this.product                   = null;
          this._resetDialogState();
          return;
        }

        if (this.initialProduct)
          this.product = JSON.parse(JSON.stringify(this.initialProduct));

        this.dirtyFields = {};
        if (this.product) this._initTimeDisplay(this.product);

        await Promise.all([
          this.loadLabelsByType(),
          this.getLabelColors(),
          this.getLinkedIssues(),
          this.getLinkableIssues(),
          this.getMilestones(this.product?.projectId),
          this.getProjectMembers(this.product?.assigneeUsername),
        ]);

        // ตั้ง default project label filter จาก label ที่ product มีอยู่
        this.pendingLinkedProjectLabel =
          this.labelByType[1]?.length > 0 ? this.labelByType[1][0] : null;

        if (this.product)
          this.originalValues = this._snapshotEntity(this.product);

        this.dirtyFields = {};
      },
    },
  },

  methods: {
    // ── Linked Issues ──────────────────────────────────────────────────────────

    issueLabelList(issue) {
      if (!issue?.labels) return [];
      if (Array.isArray(issue.labels)) return issue.labels.filter(Boolean);
      return issue.labels.split(",").map((s) => s.trim()).filter(Boolean);
    },

    async getLinkedIssues() {
      if (!this.product?.id) return;
      const result = await this.$store.dispatch(
        "issue/getIssuesByProduct",
        this.product.id
      );
      this.linkedIssues = result.success ? result.data : [];
    },

    async getLinkableIssues() {
      if (!this.product?.id) return;
      const result = await this.$store.dispatch(
        "issue/getLinkableIssuesByProduct",
        this.product.id
      );
      this.availableIssues = result.success ? result.data : [];
    },

    onPendingProjectLabelChange() {
      this.pendingLinkedIssueId = null;
    },

    async saveLinkedIssue() {
      if (!this.pendingLinkedIssueId || !this.product?.id) return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => this.$swal.showLoading(),
      });
      try {
        const result = await this.$store.dispatch("issue/linkIssueToProduct", {
          issueId:   this.pendingLinkedIssueId,
          productId: this.product.id,
        });
        if (!result.success) throw new Error(result.message || "Failed");
        this.pendingLinkedIssueId = null;
        await Promise.all([this.getLinkedIssues(), this.getLinkableIssues()]);
        this.$swal.fire("สำเร็จ", "เชื่อม Issue เรียบร้อย", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", error.message, "error");
      }
    },

    async removeLinkedIssue(issue) {
      if (!issue?.id) return;
      const ok = await this.$swal.fire({
        title:             "ยืนยันการลบการเชื่อมต่อ?",
        text:              `ลบการเชื่อมต่อกับ "${issue.title || issue.name}" ใช่หรือไม่?`,
        icon:              "warning",
        showCancelButton:  true,
        confirmButtonText: "ลบ",
        cancelButtonText:  "ยกเลิก",
      });
      if (!ok.isConfirmed) return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => this.$swal.showLoading(),
      });
      try {
        const result = await this.$store.dispatch(
          "issue/unlinkIssueFromProduct",
          { issueId: issue.id }
        );
        if (!result.success) throw new Error(result.message || "Failed");
        await Promise.all([this.getLinkedIssues(), this.getLinkableIssues()]);
        this.$swal.fire("สำเร็จ", "ยกเลิกการเชื่อม Issue เรียบร้อย", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", error.message, "error");
      }
    },

    // ── Save / Close ───────────────────────────────────────────────────────────

    _handleProductUpdated(updatedProduct) {
      if (!updatedProduct) return;
      this.product = JSON.parse(JSON.stringify(updatedProduct));
      this._initTimeDisplay(this.product);
      this.originalValues = this._snapshotEntity(this.product);
      this.dirtyFields    = {};
      this.descEditMode   = false;
      this.editableHtml   = "";
      this.$emit("success", updatedProduct);
    },

    async saveProduct() {
      if (!this.product?.id || !this.isDirty || this.saving) return;
      this.saving = true;
      this.$swal.fire({
        title: "กำลังบันทึก...",
        allowOutsideClick: false,
        didOpen: () => this.$swal.showLoading(),
      });
      try {
        const mergedPayload = Object.assign({}, ...Object.values(this.dirtyFields));
        const result = await this.$store.dispatch("product/updateProduct", {
          productId:   this.product.id,
          productData: mergedPayload,
        });
        if (!result.success) throw new Error(result.message || "Failed");
        this._handleProductUpdated(result.data);
        await Promise.all([
          this.getLinkedIssues(),
          this.getLabelColors(),
          this.getMilestones(this.product?.projectId),
        ]);
        this.$swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว", "success");
      } catch (error) {
        this.$swal.fire(
          "ผิดพลาด",
          `บันทึกไม่สำเร็จ: ${error.message || "Unknown error"}`,
          "error"
        );
      } finally {
        this.saving = false;
      }
    },

    async closeDialog() {
      if (this.isDirty) {
        const result = await this.$swal.fire({
          title:             "ยังมีข้อมูลที่ยังไม่ได้บันทึก",
          text:              "ต้องการบันทึกก่อนปิดหรือไม่?",
          icon:              "warning",
          showCancelButton:  true,
          showDenyButton:    true,
          confirmButtonText: "บันทึก",
          denyButtonText:    "ไม่บันทึก",
          cancelButtonText:  "ยกเลิก",
        });
        if (result.isConfirmed) { await this.saveProduct(); return; }
        if (result.isDismissed) return;

        // ไม่บันทึก → revert
        if (this.product) {
          this.product.name             = this.originalValues.name             ?? this.product.name;
          this.product.description      = this.originalValues.description      ?? this.product.description;
          this.product.assigneeUsername = this.originalValues.assigneeUsername ?? this.product.assigneeUsername;
          this.product.milestone        = this.originalValues.milestone        ?? this.product.milestone;
          this.product.startDate        = this.originalValues.startDate        ?? this.product.startDate;
          this.product.dueDate          = this.originalValues.dueDate          ?? this.product.dueDate;
          this.product.timeEstimate     = this.originalValues.timeEstimate     ?? this.product.timeEstimate;
          this.product.timeSpent        = this.originalValues.timeSpent        ?? this.product.timeSpent;
          try { this.product.labels = JSON.parse(this.originalValues.labels || "[]"); } catch { /* ignore */ }
          await this.loadLabelsByType();
        }
        this.dirtyFields = {};
      }

      this.descEditMode = false;
      this.editableHtml = "";
      this.$emit("input", false);
    },
  },
};
</script>

<style scoped>
.linked-issues-list::-webkit-scrollbar       { width: 4px; }
.linked-issues-list::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 4px; }
.linked-issues-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
.linked-issues-list::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

.description-view { background: #fafafa; }
.description-content {
  font-size: 14px;
  line-height: 1.75;
  color: #374151;
  word-break: break-word;
}
.description-content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 8px 0;
  display: block;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  cursor: zoom-in;
}
.description-content :deep(img:hover)         { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.description-content :deep(p)                 { margin: 0 0 8px; }
.description-content :deep(h1),
.description-content :deep(h2),
.description-content :deep(h3)               { margin: 12px 0 6px; font-weight: 700; }
.description-content :deep(ul),
.description-content :deep(ol)               { padding-left: 20px; margin: 6px 0; }
.description-content :deep(li)               { margin-bottom: 2px; }
.description-content :deep(blockquote) {
  border-left: 3px solid #e5e7eb;
  margin: 8px 0;
  padding: 4px 12px;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 0 4px 4px 0;
}
.description-content :deep(pre) {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
  font-family: monospace;
  font-size: 13px;
}
.description-content :deep(code) {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 4px;
  padding: 2px 5px;
  font-family: monospace;
  font-size: 13px;
}
.description-content :deep(a) { color: #1867c5; }

:deep(.ql-container)  { min-height: 160px; font-size: 14px; }
:deep(.ql-editor)     { min-height: 160px; line-height: 1.75; }
:deep(.ql-toolbar)    { border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
</style>