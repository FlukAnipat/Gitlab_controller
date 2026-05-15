<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    max-width="560"
    persistent
  >
    <v-card rounded="xl" style="overflow: visible">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-6 pb-2">
        <span class="text-h6 font-weight-bold grey--text text--darken-4">
          Create Project
        </span>
        <v-btn icon small @click="closeDialog">
          <v-icon size="20" color="grey">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Body -->
      <v-card-text class="pa-6 pt-4" style="overflow: visible">
        <v-row dense>
          <!-- Type -->
          <v-col cols="12">
            <div
              class="text-caption font-weight-semibold grey--text text--darken-2 mb-1"
            >
              Type
            </div>
            <v-text-field
              value="project"
              outlined
              dense
              readonly
              hide-details
              filled
              background-color="grey lighten-4"
            />
          </v-col>

          <!-- Name -->
          <v-col cols="12">
            <div
              class="text-caption font-weight-semibold grey--text text--darken-2 mb-1"
            >
              Name
            </div>
            <v-text-field
              v-model="form.name"
              outlined
              dense
              hide-details
              clearable
              placeholder="กรุณากรอกชื่อ"
              class="rounded-lg"
            />
          </v-col>

          <!-- Status -->
          <v-col cols="12">
            <div
              class="text-caption font-weight-semibold grey--text text--darken-2 mb-1"
            >
              Select Status
            </div>
            <v-autocomplete
              v-model="form.status"
              :items="statusOptions"
              item-text="name"
              item-value="id"
              outlined
              dense
              hide-details
              clearable
              placeholder="กรุณาเลือกสถานะ"
              :menu-props="{
                offsetY: true,
                maxHeight: 220,
              }"
            >
              <template v-slot:item="{ item, on, attrs }">
                <v-list-item v-on="on" v-bind="attrs" class="py-1">
                  <v-list-item-icon
                    class="mr-2 my-auto"
                    style="min-width: 20px"
                  >
                    <v-icon v-if="form.status === item.id" small color="primary"
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
          </v-col>

          <!-- Color -->
          <v-col cols="12">
            <div
              class="text-caption font-weight-semibold grey--text text--darken-2 mb-1"
            >
              Color
            </div>
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
                placeholder="#009688"
                class="rounded-lg flex-grow-1"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn
          depressed
          color="grey lighten-3"
          class="grey--text text--darken-1 text-none font-weight-bold"
          @click="closeDialog"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          depressed
          dark
          color="teal"
          class="text-none font-weight-bold"
          :loading="loading"
          :disabled="!isFormValid"
          @click="submitCreate"
        >
          เพิ่ม
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import labelChipMixin from "~/mixins/labelChip";

export default {
  name: "AddLabelsTypeDialog",
  mixins: [labelChipMixin],

  props: {
    value: { type: Boolean, default: false },
  },

  data() {
    return {
      loading: false,
      showColorPicker: false,
      form: {
        type: 1,
        name: "",
        status: null,
        color: "#009688",
      },
      statusOptions: [],
    };
  },

  computed: {
    isFormValid() {
      return (
        !!String(this.form.name || "").trim() &&
        !!this.form.status &&
        !!this.form.color
      );
    },
  },

  watch: {
    async value(val) {
      if (val) {
        this.resetForm();
        await this.getStatusOptions();
      }
    },
  },

  methods: {
    // รีเซ็ตฟอร์มกลับไปค่าเริ่มต้น
    resetForm() {
      this.form = {
        type: 1,
        name: "",
        status: null,
        color: "#009688",
      };
      this.showColorPicker = false;
    },

    // โหลดตัวเลือก status เพื่อนำไปผูกกับ project นี้
    async getStatusOptions() {
      try {
        const res = await this.$store.dispatch("labels/getLabelsStatus", {
          filter: "type||$eq||4",
        });
        const labels = res.data || [];
        this.statusOptions = labels
          .filter((label) => label && label.id && label.name)
          .map((label) => ({
            id: label.id,
            name: label.name,
            color: label.color,
          }));
      } catch (err) {
        console.error("โหลด status ไม่ได้", err);
        this.statusOptions = [];
      }
    },
    // แปลงค่าสี hex เป็น rgba
    // สร้าง style pill สำหรับ label

    // ปิด dialog และล้างค่าฟอร์ม
    closeDialog() {
      this.$emit("input", false);
      this.resetForm();
    },

    // เรียก store เพื่อสร้าง label แบบ project
    async createLabel(payload) {
      try {
        const result = await this.$store.dispatch(
          "labels/createLabel",
          payload
        );
        return result;
      } catch (error) {
        return { success: false, message: error.message };
      }
    },

    // ตรวจข้อมูลและส่งคำขอสร้าง project ใหม่
    async submitCreate() {
      if (!this.isFormValid || this.loading) return;
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
          type: this.form.type,
          name: String(this.form.name || "").trim(),
          status: String(this.form.status),
          color: this.form.color,
        };
        const result = await this.createLabel(payload);
        if (!result.success) throw new Error(result.message || "Unknown error");
        this.$emit("success");
        this.closeDialog();
        this.$swal.fire("สำเร็จ", "สร้าง Project เรียบร้อย", "success");
      } catch (error) {
        this.$swal.fire("ผิดพลาด", `สร้างไม่สำเร็จ: ${error.message}`, "error");
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
