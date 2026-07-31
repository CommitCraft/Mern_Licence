import { ApplicationSetting } from '../models';
import { LoggerService } from './LoggerService';
import { Request } from 'express';

export class SettingsService {
  public static async getAllSettings() {
    const settings = await ApplicationSetting.findAll({ order: [['category', 'ASC'], ['setting_key', 'ASC']] });
    const formatted: Record<string, string | null> = {};
    for (const item of settings) {
      formatted[item.setting_key] = item.setting_value;
    }
    return {
      raw: settings,
      keyValue: formatted,
    };
  }

  public static async updateSettings(settingsMap: Record<string, string>, actorId?: number, req?: Request) {
    const updatedKeys: string[] = [];

    for (const [key, value] of Object.entries(settingsMap)) {
      await ApplicationSetting.upsert({
        setting_key: key,
        setting_value: String(value),
      });
      updatedKeys.push(key);
    }

    await LoggerService.logActivity({
      userId: actorId,
      action: 'MANAGE_SETTINGS',
      module: 'Settings',
      description: `Updated application settings (${updatedKeys.join(', ')})`,
      req,
    });

    return SettingsService.getAllSettings();
  }
}
