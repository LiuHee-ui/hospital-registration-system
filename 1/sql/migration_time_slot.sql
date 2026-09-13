-- 时段号源表：将每日号源细化至具体时间段
CREATE TABLE IF NOT EXISTS time_slot (
  slot_id      INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '时段编号，主键',
  sched_id     INT UNSIGNED NOT NULL COMMENT '排班编号，外键',
  slot_label   VARCHAR(32) NOT NULL COMMENT '时段标签，如"上午 09:00-09:30"',
  slot_time    TIME        NOT NULL COMMENT '时段开始时间',
  total_quota  SMALLINT UNSIGNED NOT NULL DEFAULT 5 COMMENT '该时段总号源',
  used_quota   SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已使用号源数',
  CONSTRAINT pk_time_slot PRIMARY KEY (slot_id),
  CONSTRAINT fk_slot_sched FOREIGN KEY (sched_id)
    REFERENCES daily_schedule (sched_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) COMMENT '分时段号源表';

-- 挂号记录增加时段外键
ALTER TABLE registration
  ADD COLUMN slot_id INT UNSIGNED NULL COMMENT '就诊时段，外键',
  ADD CONSTRAINT fk_reg_slot FOREIGN KEY (slot_id)
    REFERENCES time_slot (slot_id) ON UPDATE SET NULL ON DELETE SET NULL;

-- 为现有排班生成默认时段（上午 4 个、下午 4 个）
-- 需要先确保 daily_schedule 有数据，然后执行插入
