-- =============================================================================
-- 为 patient 表新增出生日期、病史、身份证号字段
-- =============================================================================

USE hospital_registration;

ALTER TABLE patient ADD COLUMN birth_date DATE NULL COMMENT '出生日期' AFTER phone;
ALTER TABLE patient ADD COLUMN medical_history TEXT NULL COMMENT '病史描述' AFTER birth_date;
ALTER TABLE patient ADD COLUMN id_card CHAR(18) NULL COMMENT '身份证号' AFTER medical_history;
ALTER TABLE patient ADD CONSTRAINT uk_patient_id_card UNIQUE (id_card);

-- 更新已有患者的身份证号（可选）
UPDATE patient SET id_card = '440103199103152539', birth_date = '1991-03-15', medical_history = '既往体健，无特殊病史' WHERE patient_id = 'P20250001';
UPDATE patient SET id_card = '440105199807220228', birth_date = '1998-07-22', medical_history = '轻度贫血史' WHERE patient_id = 'P20250002';
UPDATE patient SET id_card = '440106201801100116', birth_date = '2018-01-10', medical_history = '无' WHERE patient_id = 'P20250003';
UPDATE patient SET id_card = '440104198411080821', birth_date = '1984-11-08', medical_history = '高血压病史3年' WHERE patient_id = 'P20250004';
