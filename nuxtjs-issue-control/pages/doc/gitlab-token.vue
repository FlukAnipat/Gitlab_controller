<template>
  <v-container max-width="800" class="py-8">
    <v-btn text exact class="mb-4" @click="closeWindow">
      <v-icon left>mdi-close</v-icon> ปิดหน้านี้
    </v-btn>

    <v-card class="pa-6" elevation="2">
      <v-card-title class="text-h5 font-weight-bold px-0 pt-0 d-flex align-center">
        <v-avatar size="32" class="mr-3">
          <v-img src="https://about.gitlab.com/images/press/logo/svg/gitlab-icon-rgb.svg" contain />
        </v-avatar>
        วิธีสร้าง GitLab OAuth Application
      </v-card-title>

      <v-card-text class="px-0 text-body-1 black--text mt-4">
        <p>เพื่อเชื่อมต่อระบบเข้ากับ GitLab คุณจำเป็นต้องสร้าง <b>OAuth Application</b> บน GitLab ก่อน โดยมีขั้นตอนดังนี้:</p>

        <v-list class="pa-0" flat>
          <v-list-item class="px-0 mb-6 align-start" :ripple="false">
            <v-list-item-avatar color="#fc6d26" size="32" class="white--text font-weight-bold mt-1">1</v-list-item-avatar>
            <v-list-item-content class="pt-1">
              <v-list-item-title class="text-h6 font-weight-bold mb-2">ไปที่หน้า Applications ของ GitLab</v-list-item-title>
              <div class="body-1 text--primary">
                ล็อกอินเข้าสู่ GitLab ของคุณ คลิกที่รูปโปรไฟล์ แล้วเลือก <b>Preferences</b> > <b>Access</b> > <b>Applications</b><br/>
                หรือคลิกที่ลิงก์นี้: <a href="https://gitlab.com/-/profile/applications" target="_blank" class="blue--text">https://gitlab.com/-/profile/applications</a>
              </div>
              <div class="mt-3">
                <v-img :src="require('./img/1.png')" max-width="300" class="elevation-1 mb-2" />
                <div class="d-flex flex-wrap">
                  <v-img :src="require('./img/2.png')" max-width="300" class="elevation-1 mr-2 mb-2" />
                  <v-img :src="require('./img/3.png')" max-width="300" class="elevation-1 mb-2" />
                </div>
              </div>
            </v-list-item-content>
          </v-list-item>

          <v-list-item class="px-0 mb-6 align-start" :ripple="false">
            <v-list-item-avatar color="#fc6d26" size="32" class="white--text font-weight-bold mt-1">2</v-list-item-avatar>
            <v-list-item-content class="pt-1">
              <v-list-item-title class="text-h6 font-weight-bold mb-2">เพิ่ม Application ใหม่ (Add new application)</v-list-item-title>
              <div class="body-1 text--primary">
                คลิกปุ่ม <b>Add new application</b> แล้วกรอกข้อมูลดังต่อไปนี้:
                <v-img :src="require('./img/4.png')" max-width="800" class="elevation-1 mt-2 mb-3" />
                <ul class="mt-3 pl-4">
                  <li class="mb-2"><b>Name:</b> ตั้งชื่อแอปพลิเคชันตามต้องการ เช่น <code>My Issue Tracker</code></li>
                  <li class="mb-2">
                    <b>Redirect URI:</b> ใส่ URL ของระบบที่จะให้รับ Token กลับมา (ใช้ URL หน้าแรกของระบบ)<br/>
                    <div class="grey lighten-4 pa-2 mt-1 rounded d-inline-block font-weight-medium">
                      http://localhost:3000/auth/gitlab/callback
                    </div>
                    <div class="caption grey--text mt-1">* หากใช้งานบนเซิร์ฟเวอร์จริง ให้เปลี่ยน localhost:3000 เป็นโดเมนของคุณ</div>
                  </li>
                  <li class="mb-2"><b>Confidential:</b> ปล่อยให้ติ๊กเลือกไว้ตามค่าเริ่มต้น</li>
                  <li class="mb-2">
                    <b>Scopes:</b> ติ๊กเลือกรายการต่อไปนี้ เพื่อให้ระบบสามารถจัดการ Issue และข้อมูลผู้ใช้ได้:
                    <ul class="mt-1 pl-4 mb-2">
                      <li><code>api</code></li>
                      <li><code>read_api</code></li>
                      <li><code>read_user</code></li>
                      <li><code>read_repository</code></li>
                    </ul>
                  </li>
                </ul>
                <v-img :src="require('./img/6.png')" max-width="800" class="elevation-1 mb-2" />
                <v-img :src="require('./img/5.png')" max-width="800" class="elevation-1 mb-2" />
              </div>
            </v-list-item-content>
          </v-list-item>

          <v-list-item class="px-0 mb-4 align-start" :ripple="false">
            <v-list-item-avatar color="#fc6d26" size="32" class="white--text font-weight-bold mt-1">3</v-list-item-avatar>
            <v-list-item-content class="pt-1">
              <v-list-item-title class="text-h6 font-weight-bold mb-2">บันทึกและนำข้อมูลมาใช้งาน</v-list-item-title>
              <div class="body-1 text--primary">
                กดปุ่ม <b>Save application</b> ระบบของ GitLab จะแสดง <b>Application ID</b> และ <b>Secret</b><br/>
                <v-img :src="require('./img/7.png')" max-width="800" class="elevation-1 mt-3 mb-3" />
                ให้นำ <b>Application ID (Client ID)</b> และ <b>Secret (Client Secret)</b> มากรอกในหน้าระบบของเรา
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-alert type="info" text border="left" class="mt-4">
          <b>ข้อสำคัญ:</b> Username ที่คุณกรอกในหน้าระบบของเรา จะต้องเป็น Username เดียวกันกับบัญชีของ GitLab ที่คุณใช้สร้าง OAuth Application
        </v-alert>

        <v-divider class="my-8" />
        <div class="text-h5 font-weight-bold mb-4">
          คู่มือการค้นหา Project ID และเพิ่มข้อมูล Project ลงฐานข้อมูล
        </div>

        <!-- STEP 1 -->
        <v-alert
          type="info"
          border="left"
          colored-border
          elevation="1"
          class="mb-4"
        >
          <div class="font-weight-bold mb-2">
            1. เรียก API เพื่อดูรายการ Project ใน GitLab
          </div>
          <div>
            หลังจากล็อกอินเข้าสู่ระบบแล้ว ให้เรียก API นี้เพื่อดึงรายการ Repository
            ทั้งหมดจากบัญชี GitLab ของคุณ
          </div>
        </v-alert>

        <v-sheet
          color="grey lighten-5"
          class="pa-4 mb-4 rounded-xl elevation-1"
          outlined
        >
          <pre class="ma-0" style="overflow-x: auto;"><code>
        GET http://10.0.0.138:5201/users/repositories
          </code></pre>
        </v-sheet>

        <!-- API RESPONSE -->
        <div class="body-1 text--primary font-weight-medium mb-3">
          ตัวอย่างผลลัพธ์จาก API
        </div>

        <v-sheet
          color="grey lighten-5"
          class="pa-4 mb-6 rounded-xl elevation-1"
          outlined
        >
          <pre class="ma-0" style="overflow-x: auto;"><code>
        [
          {
            "id": 81507040,
            "name": "product_list",
            "path_with_namespace": "FlukAnipat/product_list"
          },
          {
            "id": 81507067,
            "name": "issue_controller",
            "path_with_namespace": "FlukAnipat/issue_controller"
          }
        ]
          </code></pre>
        </v-sheet>

        <!-- STEP 2 -->
        <v-alert
          type="warning"
          border="left"
          colored-border
          elevation="1"
          class="mb-4"
        >
          <div class="font-weight-bold mb-2">
            2. เปรียบเทียบค่าตัวอย่างกับค่าจริงที่ต้องแก้ไข
          </div>
          <div>
            คัดลอก SQL ตัวอย่างด้านซ้าย แล้วแก้ไขค่าตามตัวอย่างด้านขวาได้ทันที
          </div>
        </v-alert>

        <v-row dense>
          <!-- ซ้าย: SQL Template -->
          <v-col cols="12" md="6">
            <v-card outlined class="rounded-xl fill-height">
              <v-card-title
                class="grey lighten-4 font-weight-bold"
              >
                SQL Template (ค่าตัวอย่าง)
              </v-card-title>

              <v-card-text class="pa-0">
                <pre
                  class="ma-0 pa-4"
                  style="
                    overflow-x: auto;
                    font-family: Consolas, 'Courier New', monospace;
                    font-size: 13px;
                    line-height: 1.7;
                    background: #fafafa;
                  "
                ><code><span class="blue--text text--darken-3 font-weight-bold">INSERT INTO</span> project (
          gitlab_project_id,
          path_with_namespace,
          name,
          user_id,
          created_by,
          updated_by,
          created_at,
          updated_at,
          project_type,
          status
        )
        <span class="blue--text text--darken-3 font-weight-bold">VALUES</span> (
          <span class="blue--text font-weight-bold">GitLab ID</span>,
          <span class="green--text text--darken-2">GitLab Path</span>,
          <span class="green--text text--darken-2">GitLab Project Name</span>,
          <span class="red--text font-weight-bold">User ID</span>,
          <span class="red--text font-weight-bold">User ID</span>,
          <span class="red--text font-weight-bold">User ID</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="green--text text--darken-2">'product' หรือ 'issue'</span>,
          <span class="green--text text--darken-2">1 หรือ 99</span>
        );</code></pre>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- ขวา: SQL จริง -->
          <v-col cols="12" md="6">
            <v-card outlined class="rounded-xl fill-height">
              <v-card-title
                class="green lighten-5 green--text text--darken-2 font-weight-bold"
              >
                SQL หลังแก้ไขแล้ว
              </v-card-title>

              <v-card-text class="pa-0">
                <pre
                  class="ma-0 pa-4"
                  style="
                    overflow-x: auto;
                    font-family: Consolas, 'Courier New', monospace;
                    font-size: 13px;
                    line-height: 1.7;
                    background: #fafafa;
                  "
                ><code><span class="blue--text text--darken-3 font-weight-bold">INSERT INTO</span> project (
                    gitlab_project_id,
                    path_with_namespace,
                    name,
                    user_id,
                    created_by,
                    updated_by,
                    created_at,
                    updated_at,
                    project_type,
                    status
                  )
                  <span class="blue--text text--darken-3 font-weight-bold">VALUES</span> (
                    <span class="blue--text font-weight-bold">82078588</span>,
                    <span class="green--text text--darken-2">'ERP_API / NESTJS / nestjs-api-issue-controll'</span>,
                    <span class="green--text text--darken-2">'nestjs-api-issue-control'</span>,
                    <span class="red--text font-weight-bold">1</span>,
                    <span class="red--text font-weight-bold">1</span>,
                    <span class="red--text font-weight-bold">1</span>,
                    <span class="deep-purple--text font-weight-bold">NOW()</span>,
                    <span class="deep-purple--text font-weight-bold">NOW()</span>,
                    <span class="green--text text--darken-2">'issue'</span>,
                    <span class="grey--text">1</span>
                  );</code></pre>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-alert
          type="warning"
          border="left"
          colored-border
          elevation="1"
          class="mt-4"
        >
          <div class="font-weight-bold mb-2">การใช้งาน project_type และ status</div>
          <div><code>project_type = 'product'</code> ใช้สำหรับตาราง product</div>
          <div><code>project_type = 'issue'</code> ใช้สำหรับตาราง issue</div>
          <div><code>status = 1</code> คือ project ที่ active อยู่ในระบบ</div>
          <div><code>status = 99</code> คือ project ที่ไม่ active แล้ว</div>
          <div class="mt-2">
            ระบบจะเลือก project จาก <code>project_type</code> และ <code>status = 1</code>
            เป็นหลักอัตโนมัติ
          </div>
        </v-alert>

        <v-divider class="my-8" />

        <div class="text-h5 font-weight-bold mb-4">
          เพิ่ม Labels ที่จำเป็นลงฐานข้อมูลก่อน 
        </div>

        <v-alert
          type="info"
          border="left"
          colored-border
          elevation="1"
          class="mb-4"
        >
          <div class="font-weight-bold mb-2">
            ขั้นตอนเพิ่มเติม: เพิ่มข้อมูล Labels สำหรับใช้งานในระบบ
          </div>
          <div>
            หลังจากเพิ่มข้อมูล Project แล้ว ให้รันคำสั่ง SQL ด้านล่างเพื่อเพิ่ม
            Labels เริ่มต้นที่ระบบใช้สำหรับจัดการสถานะงาน
          </div>
        </v-alert>

        <v-sheet
          color="grey lighten-5"
          class="pa-4 rounded-xl elevation-1"
          outlined
        >
          <pre
            class="ma-0"
            style="
              overflow-x: auto;
              font-family: Consolas, 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.7;
            "
          ><code><span class="blue--text text--darken-3 font-weight-bold">INSERT INTO</span> labels (
          name,
          color,
          type,
          status,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
        <span class="blue--text text--darken-3 font-weight-bold">VALUES</span>
        (
          <span class="green--text text--darken-2">'กำลังทำ'</span>,
          <span class="orange--text text--darken-2">'#FDCB6E'</span>,
          <span class="blue--text font-weight-bold">4</span>,
          <span class="grey--text">NULL</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="red--text font-weight-bold">1</span>,
          <span class="red--text font-weight-bold">1</span>
        ),
        (
          <span class="green--text text--darken-2">'ติดตั้ง'</span>,
          <span class="cyan--text text--darken-2">'#00CEC9'</span>,
          <span class="blue--text font-weight-bold">4</span>,
          <span class="grey--text">NULL</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="red--text font-weight-bold">1</span>,
          <span class="red--text font-weight-bold">1</span>
        ),
        (
          <span class="green--text text--darken-2">'รอเก็บเงิน'</span>,
          <span class="deep-orange--text text--darken-2">'#E17055'</span>,
          <span class="blue--text font-weight-bold">4</span>,
          <span class="grey--text">NULL</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="red--text font-weight-bold">1</span>,
          <span class="red--text font-weight-bold">1</span>
        ),
        (
          <span class="green--text text--darken-2">'เก็บเงินแล้ว'</span>,
          <span class="teal--text text--darken-2">'#00B894'</span>,
          <span class="blue--text font-weight-bold">4</span>,
          <span class="grey--text">NULL</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="deep-purple--text font-weight-bold">NOW()</span>,
          <span class="red--text font-weight-bold">1</span>,
          <span class="red--text font-weight-bold">1</span>
        );
        </code></pre>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'DocGitlabToken',
  layout: 'blank',
  head() {
    return { title: 'วิธีสร้าง GitLab OAuth Application' }
  },
  methods: {
    closeWindow() {
      // ถ้าเปิดจาก target="_blank" สามารถกดปิด tab ได้
      window.close();
      // fallback ในกรณีที่ไม่ได้เปิดเป็น tab ใหม่
      this.$router.push('/login');
    }
  }
}
</script>
