<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    max-width="550"
    persistent
  >
    <v-card class="rounded-xl">
      <v-card-title
        class="d-flex justify-space-between align-center pt-4 px-6 pb-0"
      >
        <h2 class="text-h5 font-weight-bold">Edit Label</h2>
        <v-btn icon @click="closeDialog" class="mt-n4 mr-n4">
          <v-icon size="24" color="grey darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-6 pt-6 pb-2">
        <!-- Type (readonly) -->
        <div class="mb-4">
          <label class="font-weight-bold text-subtitle-2 mb-1 d-block"
            >Type</label
          >
          <v-text-field
            :value="typeName"
            outlined
            dense
            hide-details
            class="rounded-lg"
            disabled
          />
        </div>

        <!-- Label Name -->
        <div class="mb-4">
          <label class="font-weight-bold text-subtitle-2 mb-1 d-block"
            >Label Name</label
          >
          <v-text-field
            v-model="form.name"
            outlined
            dense
            hide-details
            placeholder="e.g. bug, feature, enhancement"
            class="rounded-lg"
          />
        </div>

        <!-- Color -->
        <div class="mb-4">
          <label class="font-weight-bold text-subtitle-2 mb-1 d-block"
            >Color</label
          >
          <div class="d-flex align-center">
            <v-menu
              v-model="showColorPicker"
              :close-on-content-click="false"
              offset-y
            >
              <template v-slot:activator="{ on, attrs }">
                <div
                  v-bind="attrs"
                  v-on="on"
                  class="color-preview rounded-lg mr-3"
                  :style="{ backgroundColor: form.color }"
                />
              </template>
              <v-card class="pa-2">
                <v-color-picker v-model="form.color" flat />
              </v-card>
            </v-menu>
            <v-text-field
              v-model="form.color"
              outlined
              dense
              hide-details
              placeholder="#FF0000"
              class="rounded-lg flex-grow-1"
            />
          </div>
        </div>

        <!-- Status — แสดงเฉพาะ type=1 (Project) -->
        <!-- status column ใน DB เก็บเป็น id (number) ของ label type=4 -->
        <template v-if="form.type === 1">
          <v-divider class="my-3" />
          <v-sheet
            rounded="lg"
            class="pa-3 mb-1"
            style="background: #f9fafb; border: 1px solid #e5e7eb"
          >
            <div class="d-flex align-center mb-2">
              <v-icon size="15" color="grey darken-2" class="mr-1"
                >mdi-flag-outline</v-icon
              >
              <span
                class="text-caption font-weight-bold grey--text text--darken-2"
                >Status โครงการ</span
              >
              <v-spacer />
              <v-btn
                v-if="form.statusId"
                x-small
                text
                color="grey"
                class="text-none"
                @click="form.statusId = null"
                >ล้าง</v-btn
              >
            </div>

            <!-- chip preview ของ status ที่เลือกอยู่ -->

            <v-autocomplete
              v-model="form.statusId"
              :items="statusOptions"
              :loading="statusLoading"
              item-text="name"
              item-value="id"
              outlined
              dense
              hide-details
              clearable
              placeholder="เลือก Status โครงการ..."
              no-data-text="ไม่พบ Status (labels type=4)"
              background-color="white"
              class="rounded-lg"
              :menu-props="{ offsetY: true, maxHeight: 240 }"
            >
              <template v-slot:item="{ item, on, attrs }">
                <v-list-item v-on="on" v-bind="attrs" class="py-1">
                  <v-list-item-icon
                    class="mr-2 my-auto"
                    style="min-width: 20px"
                  >
                    <v-icon
                      v-if="form.statusId === item.id"
                      small
                      color="primary"
                      >mdi-check</v-icon
                    >
                  </v-list-item-icon>
                  <v-list-item-content class="py-0">
                    <div class="d-flex align-center">
                      <div
                        :style="{
                          backgroundColor: item.color || '#9E9E9E',
                          width: '16px',
                          height: '8px',
                          borderRadius: '10px',
                        }"
                        class="mr-3"
                      ></div>
                      <span
                        class="text-body-2 grey--text text--darken-3 font-weight-medium"
                      >
                        {{ item.name }}
                      </span>
                    </div>
                  </v-list-item-content>
                </v-list-item>
              </template>
              <template v-slot:selection="{ item }">
                <v-chip
                  small
                  class="font-weight-bold"
                  pill
                  :color="getLabelChipColor(item)"
                  :text-color="getLabelChipTextColor(item)"
                >
                  {{ item.name }}
                </v-chip>
              </template>
            </v-autocomplete>
          </v-sheet>
        </template>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 d-flex justify-end">
        <v-btn
          outlined
          color="grey"
          class="rounded-lg text-none px-6 font-weight-bold"
          @click="closeDialog"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="#009688"
          dark
          depressed
          class="rounded-lg text-none px-8 font-weight-bold"
          :disabled="!form.name || !form.color || loading"
          @click="submitUpdate"
        >
          บันทึก
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import labelChipMixin from "~/mixins/labelChip";

export default {
  name: "UpdateLabelDialog",
  mixins: [labelChipMixin],
  props: {
    value: { type: Boolean, default: false },
    label: { type: Object, default: null },
  },

  data() {
    return {
      form: {
        id: null,
        name: "",
        color: "#009688",
        type: null,
        statusId: null, // ← เก็บ id ของ label type=4 ตรง column `status` ใน DB
      },
      loading: false,
      statusLoading: false,
      showColorPicker: false,
      statusOptions: [], // [{ id, name, color, type }] — labels type=4
      typeOptions: [
        { value: 0, name: "ประเภทงาน" },
        { value: 1, name: "Project" },
        { value: 2, name: "Status" },
        { value: 3, name: "Role" },
        { value: 4, name: "Status (โครงการ)" },
      ],
    };
  },

  computed: {
    typeName() {
      return (
        this.typeOptions.find((t) => t.value === this.form.type)?.name || ""
      );
    },
    // หา label object ของ status ที่เลือก เพื่อเอา name/color ไปแสดง
    selectedStatusLabel() {
      if (!this.form.statusId || !this.statusOptions.length) return null;
      return (
        this.statusOptions.find((s) => s.id === Number(this.form.statusId)) ||
        null
      );
    },
  },

  watch: {
    value(val) {
      if (val && this.label) {
        this.form = {
          id: this.label.id,
          name: this.label.name || "",
          color: this.label.color || "#009688",
          type: this.label.type !== undefined ? this.label.type : null,
          // status ใน DB เก็บเป็น id (number) เช่น 48 = "กำลังทำ"
          statusId: this.label.status ? Number(this.label.status) : null,
        };
        if (this.form.type === 1) {
          this.loadStatusOptions();
        }
      }
    },
  },

  methods: {
    // แปลงค่าสี hex เป็น rgba เพื่อใช้ทำพื้นหลังแบบโปร่งแสง
    // สร้าง style chip สำหรับ label status

    // ดึง labels type=4 จาก DB → ใช้เป็น status options
    // DB: id=48 กำลังทำ, 49 ติดตั้ง, 50 รอเก็บเงิน, 51 เก็บเงินแล้ว
    // โหลดรายการ status labels เพื่อใช้ใน project ประเภท Project
    async loadStatusOptions() {
      try {
        this.statusLoading = true;
        const result = await this.$store.dispatch("labels/getLabelsName", {
          type: 4,
        });
        this.statusOptions = result.success ? result.data || [] : [];
      } catch (error) {
        console.error("Failed to load status options:", error);
        this.statusOptions = [];
      } finally {
        this.statusLoading = false;
      }
    },

    // ปิด dialog และคืนค่าเริ่มต้นของฟอร์ม
    closeDialog() {
      this.$emit("input", false);
      this.form = {
        id: null,
        name: "",
        color: "#009688",
        type: null,
        statusId: null,
      };
      this.statusOptions = [];
    },

    // ตรวจข้อมูลและส่งคำขออัปเดต label
    async submitUpdate() {
      if (
        !String(this.form.name || "").trim() ||
        !this.form.color ||
        this.form.type === null
      )
        return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });
      try {
        this.loading = true;
        const payload = {
          name: String(this.form.name || "").trim(),
          color: this.form.color,
          type: this.form.type,
          // ส่ง status เป็น id (number) ตรงๆ ตาม column `status` ใน DB
          // เฉพาะ type=1 เท่านั้น
          ...(this.form.type === 1 && {
            status: this.form.statusId ? Number(this.form.statusId) : null,
          }),
        };

        const result = await this.$store.dispatch("labels/updateLabel", {
          id: this.form.id,
          labelData: payload,
        });

        if (result.success) {
          this.$emit("success", result.data);
          this.closeDialog();
          this.$swal.fire("สำเร็จ", "อัปเดต Label เรียบร้อย", "success");
        } else {
          this.$swal.fire(
            "ผิดพลาด",
            "อัปเดต Label ไม่สำเร็จ: " + (result.message || "Unknown error"),
            "error"
          );
        }
      } catch (error) {
        this.$swal.fire(
          "ผิดพลาด",
          "อัปเดต Label ไม่สำเร็จ: " + (error.message || "Unknown error"),
          "error"
        );
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.color-preview {
  width: 40px;
  height: 40px;
  border: 2px solid #e0e0e0;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
