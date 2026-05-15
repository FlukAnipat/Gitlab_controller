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
                  >mdi-alert-circle-outline</v-icon
                >
              </v-avatar>
              <h2
                class="text-h5 font-weight-bold grey--text text--darken-4 mb-0"
                style="letter-spacing: -0.025em"
              >
                Issue Details
              </h2>
            </div>
            <div class="d-flex align-center" style="gap: 8px">
              <v-btn
                v-if="issue && issue.webUrl"
                :href="issue.webUrl"
                target="_blank"
                small
                text
                color="#00A896"
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
            <!-- ── Left ── -->
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
                Issue Name <span class="red--text text--lighten-1">*</span>
              </div>
              <v-text-field
                v-if="issue"
                v-model="issue.name"
                placeholder="ระบุชื่อ Issue..."
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
                  v-if="issue"
                  x-small
                  label
                  class="mr-1"
                  color="blue lighten-5"
                  text-color="primary"
                  >{{ issue.issueType || "issue" }}</v-chip
                >
                <v-chip
                  v-if="issue"
                  x-small
                  label
                  class="font-weight-bold"
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
              </div>

              <v-divider class="mb-5" style="border-color: #f3f4f6" />

              <!-- Linked Product -->
              <div class="mb-5">
                <div class="d-flex align-center mb-3">
                  <v-icon size="16" color="#00A896" class="mr-2"
                    >mdi-cube-outline</v-icon
                  >
                  <span
                    class="text-caption font-weight-bold grey--text text-uppercase"
                    style="letter-spacing: 0.07em"
                    >Linked Product</span
                  >
                  <v-chip
                    x-small
                    class="ml-2 font-weight-bold"
                    :color="
                      linkedProductName ? 'blue lighten-5' : 'grey lighten-3'
                    "
                    :text-color="linkedProductName ? 'primary' : 'grey'"
                    >{{ linkedProductName ? 1 : 0 }}</v-chip
                  >
                </div>
                <div
                  v-if="linkedProductName"
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
                        :color="
                          issue.product.state === 'closed' ? 'grey' : '#1867C5'
                        "
                      >
                        {{
                          issue.product.state === "closed"
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
                        {{ linkedProductName }}
                      </span>
                      <v-chip
                        x-small
                        label
                        class="font-weight-bold flex-shrink-0"
                        :color="
                          issue.product.state === 'closed'
                            ? 'grey lighten-3'
                            : 'green lighten-5'
                        "
                        :text-color="
                          issue.product.state === 'closed'
                            ? 'grey darken-1'
                            : 'green darken-2'
                        "
                      >
                        {{
                          issue.product.state === "closed" ? "Closed" : "Opened"
                        }}
                      </v-chip>
                    </div>
                    <v-btn
                      icon
                      x-small
                      class="ml-1 flex-shrink-0"
                      color="grey lighten-1"
                      @click="removeLinkedProduct"
                    >
                      <v-icon x-small>mdi-close</v-icon>
                    </v-btn>
                  </div>
                  <div class="d-flex align-center mb-1" style="gap: 10px">
                    <span class="text-caption grey--text"
                      >#{{ issue.product.gitlabIid || "-" }}</span
                    >
                    <span
                      v-if="issue.product.assigneeUsername"
                      class="d-flex align-center text-caption grey--text"
                    >
                      <v-icon size="12" color="grey" class="mr-1"
                        >mdi-account-outline</v-icon
                      >{{ issue.product.assigneeUsername }}
                    </span>
                    <v-btn
                      v-if="issue.product.webUrl"
                      :href="issue.product.webUrl"
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
                    v-if="productLabelList.length"
                    class="d-flex flex-wrap"
                    style="gap: 4px"
                  >
                    <v-chip
                      v-for="lbl in productLabelList"
                      :key="lbl"
                      x-small
                      class="font-weight-bold"
                      pill
                      :color="getLabelChipColor(lbl)"
                      :text-color="getLabelChipTextColor(lbl)"
                      >{{ lbl }}</v-chip
                    >
                  </div>
                </div>
                <div v-else>
                  <div
                    class="d-flex align-center justify-center rounded-lg py-4 mb-3"
                    style="border: 1.5px dashed #e5e7eb; color: #9ca3af"
                  >
                    <v-icon size="16" color="grey lighten-1" class="mr-2"
                      >mdi-cube-off-outline</v-icon
                    >
                    <span class="text-caption"
                      >ยังไม่มี Product ที่เชื่อมอยู่</span
                    >
                  </div>
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
                        v-model="pendingLinkedProductId"
                        :items="availableProductsForLink"
                        item-text="name"
                        item-value="id"
                        clearable
                        outlined
                        dense
                        hide-details
                        placeholder="เลือก Product เพื่อเชื่อม..."
                        no-data-text="ไม่พบ Product"
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
                        v-if="pendingLinkedProductId"
                        small
                        color="#00A896"
                        dark
                        class="text-none rounded-lg"
                        @click="saveLinkedProduct"
                        >บันทึก</v-btn
                      >
                      <v-btn
                        v-if="pendingLinkedProductId"
                        small
                        text
                        color="grey"
                        class="text-none rounded-lg"
                        @click="pendingLinkedProductId = null"
                        >ยกเลิก</v-btn
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

              <!-- VIEW MODE -->
              <v-sheet
                v-if="!descEditMode"
                outlined
                rounded="lg"
                class="pa-4 mb-4 description-view"
                style="min-height: 120px; max-height: 420px; overflow-y: auto"
              >
                <div
                  v-if="issue && issue.description"
                  class="description-content"
                  v-html="renderDescription(issue.description, issue.webUrl)"
                />
                <div v-else class="text-caption grey--text py-4 text-center">
                  <v-icon size="32" color="grey lighten-2" class="mb-2 d-block"
                    >mdi-text-box-outline</v-icon
                  >
                  ยังไม่มีคำอธิบาย — กดปุ่ม "แก้ไข" เพื่อเพิ่ม
                </div>
              </v-sheet>

              <!-- EDIT MODE -->
              <v-sheet
                v-else
                outlined
                rounded="lg"
                class="overflow-hidden mb-4"
                style="min-height: 200px"
              >
                <client-only>
                  <vue-editor
                    v-if="issue"
                    v-model="editableHtml"
                    ref="issueEditor"
                    :use-custom-image-handler="true"
                    placeholder="อธิบาย Issue ให้ละเอียด... (รองรับ Markdown และวางรูปได้เลย)"
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
                        v-if="issue"
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
                        v-if="issue"
                        v-model="timeSpentDisplay"
                        placeholder="เช่น 2h, 1h30m, 45m"
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
                  v-if="issue && issue.timeEstimate > 0"
                  class="d-flex align-center mb-1"
                >
                  <span class="text-caption grey--text text--darken-1 mr-2"
                    >Spent {{ timeSpentDisplay || "0h" }}</span
                  >
                  <v-progress-linear
                    :value="(issue.timeSpent / (issue.timeEstimate || 1)) * 100"
                    color="#1867C5"
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

            <!-- ── Right ── -->
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
                  v-if="issue"
                  v-model="issue.assigneeUsername"
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
                  v-if="issue"
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
                      :multiple="tDef.type < 2"
                      background-color="white"
                      :color="tDef.color"
                      class="rounded-lg"
                      :menu-props="{ maxHeight: '220px', offsetY: true }"
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
                  v-if="issue"
                  v-model="issue.milestone"
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

              <div v-if="issue" class="mb-4">
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
                      :value="toDisplayDate(issue.startDate)"
                      :label="`Start Date (${toDisplayDate(issue.startDate) || 'วว/ดด/ปปปป'})`"
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
                    v-model="issue.startDate"
                    :max="issue.dueDate"
                    no-title
                    scrollable
                    @input="startDateMenu = false; updateField('startDate', issue.startDate)"
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
                      :value="toDisplayDate(issue.dueDate)"
                      :label="`Due Date (${toDisplayDate(issue.dueDate) || 'วว/ดด/ปปปป'})`"
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
                    v-model="issue.dueDate"
                    :min="issue.startDate"
                    no-title
                    scrollable
                    @input="dueDateMenu = false; updateField('dueDate', issue.dueDate)"
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
            :disabled="saving"
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
            @click="saveIssue"
          >
            <v-icon size="16" class="mr-1">mdi-content-save-outline</v-icon
            >บันทึก Issue
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
import labelChipMixin         from "~/mixins/labelChip";
import milestoneOrderingMixin from "~/mixins/milestoneOrdering";
import detailFunctionMixin      from "~/mixins/detailFunction";
import dateFormatMixin          from "~/mixins/dateFormat";

export default {
  name: "IssuedetailFunction",
  mixins: [labelChipMixin, milestoneOrderingMixin, detailFunctionMixin, dateFormatMixin],

  components: {
    VueEditor: () =>
      process.client
        ? import("vue2-editor").then((m) => m.VueEditor)
        : Promise.resolve({ render: () => null }),
  },

  props: {
    value:        { type: Boolean, default: false },
    initialIssue: { type: Object,  default: null  },
  },

  data() {
    return {
      issue: null,
      // Issue-specific
      products:                  [],
      pendingLinkedProjectLabel: null,
      pendingLinkedProductId:    null,
      startDateMenu:             false,
      dueDateMenu:               false,
    };
  },

  computed: {
    /** ใช้โดย detailFunctionMixin.loadLabelsByType() */
    parsedLabels() {
      if (!this.issue?.labels) return [];
      if (Array.isArray(this.issue.labels)) return this.issue.labels;
      return this.issue.labels.split(",").map((s) => s.trim()).filter(Boolean);
    },
    linkedProductName() {
      return this.issue?.product?.name || "";
    },
    productLabelList() {
      const labels = this.issue?.product?.labels;
      if (!labels) return [];
      if (Array.isArray(labels)) return labels.filter(Boolean);
      return labels.split(",").map((s) => s.trim()).filter(Boolean);
    },
    availableProductsForLink() {
      let list = (this.products || []).filter((p) => p && p.state !== "closed");
      if (this.pendingLinkedProjectLabel) {
        list = list.filter((p) => {
          if (!p.labels) return false;
          if (Array.isArray(p.labels))
            return p.labels.includes(this.pendingLinkedProjectLabel);
          return p.labels
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
          this.products                  = [];
          this.pendingLinkedProjectLabel = null;
          this.pendingLinkedProductId    = null;
          this.issue                     = null;
          this._resetDialogState();
          return;
        }

        if (this.initialIssue)
          this.issue = JSON.parse(JSON.stringify(this.initialIssue));

        this.dirtyFields  = {};
        this.descEditMode = false;
        if (this.issue) this._initTimeDisplay(this.issue);

        const pid = this.issue?.projectId || this.issue?.product?.projectId || null;

        await Promise.all([
          this.loadLabelsByType(),
          this.getLabelColors(),
          this.getProductOptions(),
          this.getMilestones(pid),
          this.getProjectMembers(this.issue?.assigneeUsername),
        ]);

        this.pendingLinkedProjectLabel =
          this.labelByType[1]?.length > 0 ? this.labelByType[1][0] : null;

        if (this.issue)
          this.originalValues = this._snapshotEntity(this.issue);

        await this.$nextTick();
        this.dirtyFields = {};
      },
    },
  },

  methods: {
    // ── Linked Product ─────────────────────────────────────────────────────────

    async getProductOptions() {
      try {
        const result = await this.$store.dispatch("product/getProducts");
        this.products = result.success ? result.data || [] : [];
      } catch {
        this.products = [];
      }
    },

    onPendingProjectLabelChange() {
      this.pendingLinkedProductId = null;
    },

    async saveLinkedProduct() {
      if (!this.pendingLinkedProductId || !this.issue?.id) return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => this.$swal.showLoading(),
      });
      try {
        const result = await this.$store.dispatch("issue/linkIssueToProduct", {
          issueId:   this.issue.id,
          productId: this.pendingLinkedProductId,
        });
        if (!result.success) throw new Error(result.message || "Failed");
        if (result.data) this.issue = JSON.parse(JSON.stringify(result.data));
        this.pendingLinkedProductId = null;
        this.$emit("success", result.data);
        await this.getProductOptions();
        this.$swal.fire("สำเร็จ", "เชื่อม Product เรียบร้อย", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", error.message, "error");
      }
    },

    async removeLinkedProduct() {
      if (!this.issue?.id) return;
      const confirmResult = await this.$swal.fire({
        title:             "ยืนยันการลบการเชื่อมต่อ?",
        text:              `คุณต้องการลบการเชื่อมต่อกับ Product "${this.linkedProductName}" ใช่หรือไม่?`,
        icon:              "warning",
        showCancelButton:  true,
        confirmButtonText: "ลบการเชื่อมต่อ",
        cancelButtonText:  "ยกเลิก",
      });
      if (!confirmResult.isConfirmed) return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => this.$swal.showLoading(),
      });
      try {
        const result = await this.$store.dispatch(
          "issue/unlinkIssueFromProduct",
          { issueId: this.issue.id }
        );
        if (!result.success) throw new Error(result.message || "Failed");
        if (result.data) this.issue = JSON.parse(JSON.stringify(result.data));
        this.$emit("success", result.data);
        await this.getProductOptions();
        this.$swal.fire("สำเร็จ", "ยกเลิกการเชื่อม Product เรียบร้อย", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", error.message, "error");
      }
    },

    // ── Save / Close ───────────────────────────────────────────────────────────

    _handleIssueUpdated(updatedIssue) {
      if (!updatedIssue) return;
      this.issue = JSON.parse(JSON.stringify(updatedIssue));
      this._initTimeDisplay(this.issue);
      this.originalValues = this._snapshotEntity(this.issue);
      this.dirtyFields    = {};
      this.descEditMode   = false;
      this.editableHtml   = "";
      this.$emit("success", updatedIssue);
    },

    async saveIssue() {
      if (!this.issue?.id || !this.isDirty || this.saving) return;
      this.saving = true;
      try {
        const mergedPayload = Object.assign({}, ...Object.values(this.dirtyFields));
        const result = await this.$store.dispatch("issue/updateIssue", {
          issueId:   this.issue.id,
          issueData: mergedPayload,
        });
        if (!result.success) throw new Error(result.message || "Failed");
        this._handleIssueUpdated(result.data);
        await Promise.all([this.getLabelColors(), this.getMilestones()]);
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
        if (result.isConfirmed) { await this.saveIssue(); return; }
        if (result.isDismissed) return;

        // ไม่บันทึก → revert
        if (this.issue) {
          this.issue.name             = this.originalValues.name             ?? this.issue.name;
          this.issue.description      = this.originalValues.description      ?? this.issue.description;
          this.issue.assigneeUsername = this.originalValues.assigneeUsername ?? this.issue.assigneeUsername;
          this.issue.milestone        = this.originalValues.milestone        ?? this.issue.milestone;
          this.issue.startDate        = this.originalValues.startDate        ?? this.issue.startDate;
          this.issue.dueDate          = this.originalValues.dueDate          ?? this.issue.dueDate;
          this.issue.timeEstimate     = this.originalValues.timeEstimate     ?? this.issue.timeEstimate;
          this.issue.timeSpent        = this.originalValues.timeSpent        ?? this.issue.timeSpent;
          try { this.issue.labels = JSON.parse(this.originalValues.labels || "[]"); } catch { /* ignore */ }
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
.description-content :deep(img:hover)   { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.description-content :deep(strong)      { font-weight: 700; }
.description-content :deep(em)         { font-style: italic; }
.description-content :deep(code) {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 4px;
  padding: 2px 5px;
  font-family: monospace;
  font-size: 13px;
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
.description-content :deep(a)          { color: #1867c5; }
.description-content :deep(p)          { margin: 0 0 8px; }
.description-content :deep(h1),
.description-content :deep(h2),
.description-content :deep(h3)         { margin: 12px 0 6px; font-weight: 700; }
.description-content :deep(ul),
.description-content :deep(ol)         { padding-left: 20px; margin: 6px 0; }
.description-content :deep(li)         { margin-bottom: 2px; }
.description-content :deep(blockquote) {
  border-left: 3px solid #e5e7eb;
  margin: 8px 0;
  padding: 4px 12px;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 0 4px 4px 0;
}

:deep(.ql-container) { min-height: 160px; font-size: 14px; }
:deep(.ql-editor)    { min-height: 160px; line-height: 1.75; }
:deep(.ql-toolbar)   { border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
</style>