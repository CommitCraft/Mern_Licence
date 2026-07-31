-- Rollback Migration: 002_rollback_system_user_and_setup_tables.sql

DROP TABLE IF EXISTS `company_settings`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `schema_migrations`;
