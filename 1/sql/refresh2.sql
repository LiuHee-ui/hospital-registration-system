-- =============================================================================
-- 更新 admin 密码为 123456，新增 user 账号
-- =============================================================================

-- 更新 admin 密码为 123456
UPDATE admin_user SET password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
WHERE account = 'admin';

-- 新增 user 普通用户账号，密码 123456
INSERT IGNORE INTO admin_user (account, password_hash, perm_type) VALUES
('user', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '普通管理员');

-- 验证
SELECT account, perm_type FROM admin_user;
