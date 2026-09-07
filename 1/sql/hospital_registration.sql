-- 医院门诊挂号管理系统数据库

/* ---------------------------- 一、删除旧表 ---------------------------- */
DROP TABLE IF EXISTS daily_schedule;
DROP TABLE IF EXISTS registration;
DROP TABLE IF EXISTS admin_user;
DROP TABLE IF EXISTS patient;
DROP TABLE IF EXISTS doctor;
DROP TABLE IF EXISTS department;

/* ---------------------------- 二、建表 ---------------------------- */

/* 2.1 科室表 */
CREATE TABLE department (
  dept_id      CHAR(6)    NOT NULL COMMENT '科室编号，主键',
  dept_name    VARCHAR(32) NOT NULL COMMENT '科室名称',
  dept_intro   TEXT        NULL     COMMENT '科室介绍',
  CONSTRAINT pk_department PRIMARY KEY (dept_id),
  CONSTRAINT uk_dept_name UNIQUE (dept_name)
) COMMENT '科室信息表';

/* 2.2 医生表 */
CREATE TABLE doctor (
  doctor_id    CHAR(8)    NOT NULL COMMENT '医生编号，主键',
  doctor_name  VARCHAR(32) NOT NULL COMMENT '医生姓名',
  gender       ENUM('男','女') NOT NULL COMMENT '性别',
  title        VARCHAR(16) NOT NULL COMMENT '职称：主任医师/副主任医师/主治医师/住院医师',
  dept_id      CHAR(6)     NOT NULL COMMENT '所属科室，外键',
  specialty    VARCHAR(64) NULL     COMMENT '专长',
  CONSTRAINT pk_doctor PRIMARY KEY (doctor_id),
  CONSTRAINT fk_doctor_dept FOREIGN KEY (dept_id)
    REFERENCES department (dept_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) COMMENT '医生信息表';

/* 2.3 患者信息表 */
CREATE TABLE patient (
  patient_id   CHAR(10)    NOT NULL COMMENT '患者编号，主键',
  patient_name VARCHAR(32) NOT NULL COMMENT '患者姓名',
  gender       ENUM('男','女') NOT NULL COMMENT '性别',
  age          SMALLINT UNSIGNED NOT NULL COMMENT '年龄',
  phone        CHAR(11)    NOT NULL COMMENT '手机号',
  address      VARCHAR(128) NULL     COMMENT '联系地址',
  medical_history TEXT      NULL     COMMENT '病史描述',
  id_card      CHAR(18)    NULL     COMMENT '身份证号',
  CONSTRAINT pk_patient PRIMARY KEY (patient_id),
  CONSTRAINT uk_patient_phone UNIQUE (phone),
  CONSTRAINT uk_patient_id_card UNIQUE (id_card)
) COMMENT '患者信息表';

/* 2.4 挂号记录表 */
CREATE TABLE registration (
  reg_id        CHAR(12)     NOT NULL COMMENT '挂号编号，主键',
  patient_id    CHAR(10)     NOT NULL COMMENT '患者编号，外键',
  doctor_id     CHAR(8)      NOT NULL COMMENT '医生编号，外键',
  reg_time      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '挂号时间',
  visit_status  ENUM('未就诊','已就诊','已取消') NOT NULL COMMENT '就诊状态',
  is_urgent     TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否加急：0普通 1加急',
  CONSTRAINT pk_registration PRIMARY KEY (reg_id),
  CONSTRAINT fk_reg_patient FOREIGN KEY (patient_id)
    REFERENCES patient (patient_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reg_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctor (doctor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) COMMENT '挂号记录表';

/* 2.5 管理员表 */
CREATE TABLE admin_user (
  account       VARCHAR(32) NOT NULL COMMENT '登录账号，主键',
  password_hash VARCHAR(64) NOT NULL COMMENT '密码（SHA-256 哈希）',
  perm_type     VARCHAR(20) NOT NULL COMMENT '权限类型',
  CONSTRAINT pk_admin PRIMARY KEY (account)
) COMMENT '系统管理员表';

/* 2.6 每日号源表 */
CREATE TABLE daily_schedule (
  sched_id      INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '排班编号，主键',
  doctor_id     CHAR(8)      NOT NULL COMMENT '医生编号，外键',
  sched_date    DATE         NOT NULL COMMENT '排班日期',
  total_quota   SMALLINT UNSIGNED NOT NULL DEFAULT 20 COMMENT '当日号源总数',
  used_quota    SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已使用号源数',
  CONSTRAINT pk_daily_schedule PRIMARY KEY (sched_id),
  CONSTRAINT uk_sched_doctor_date UNIQUE (doctor_id, sched_date),
  CONSTRAINT fk_sched_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctor (doctor_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) COMMENT '每日号源排班表';

/* ---------------------------- 三、示例数据 ---------------------------- */

INSERT INTO department (dept_id, dept_name, dept_intro) VALUES
('D001', '内科', '诊治心血管、消化、呼吸等内科常见病与慢性病。'),
('D002', '外科', '开展普外、创伤及围手术期综合管理。'),
('D003', '儿科', '0-14岁儿童常见病、生长发育咨询。'),
('D004', '妇科', '女性生殖系统疾病及孕产期保健相关门诊。');

INSERT INTO doctor (doctor_id, doctor_name, gender, title, dept_id, specialty) VALUES
('DOC001', '张伟', '男', '主任医师', 'D001', '心血管疾病'),
('DOC002', '李娜', '女', '副主任医师', 'D001', '消化系统'),
('DOC003', '王强', '男', '主治医师', 'D002', '普外手术'),
('DOC004', '刘芳', '女', '主任医师', 'D003', '儿童呼吸道'),
('DOC005', '陈静', '女', '副主任医师', 'D004', '妇科肿瘤');

INSERT INTO patient (patient_id, patient_name, gender, age, phone, address, id_card) VALUES
('PAT0000001', '赵磊', '男', 45, '13800138001', '北京市朝阳区', '110101197901011234'),
('PAT0000002', '钱琳', '女', 32, '13800138002', '上海市浦东区', '310101199201011234'),
('PAT0000003', '孙浩', '男', 28, '13800138003', '广州市天河区', '440101199501011234');

-- admin password: 123456 (sha256)
INSERT INTO admin_user (account, password_hash, perm_type) VALUES
('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '超级管理员'),
('user', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '普通管理员');

INSERT INTO daily_schedule (doctor_id, sched_date, total_quota, used_quota) VALUES
('DOC001', CURDATE(), 20, 0),
('DOC002', CURDATE(), 15, 0),
('DOC003', CURDATE(), 10, 0);
