import {
  ConceptPlugin,
  ConceptEventType,
  ConceptListener,
} from '../../dist/types/plugin';

interface DateTimeConfig {
  timezone: string;
  format: string;
  locale: string;
}

class DateTimePlugin implements ConceptPlugin {
  public readonly name = 'datetime';
  public readonly version = '1.0.0';
  public readonly description = 'Simple date/time plugin for concept language';
  public readonly config = {
    name: 'datetime',
    version: '1.0.0',
    description: 'Simple date/time plugin for concept language',
    main: 'index.js',
  };

  private dtConfig: DateTimeConfig = {
    timezone: 'UTC',
    format: 'ISO',
    locale: 'en-US',
  };

  constructor() {
    console.log('🕐 Initializing datetime plugin');
  }

  getHooks(): Record<string, (params: any[], block?: any[]) => void | any[]> {
    return {
      datetime: (params: any[], block?: any[]) =>
        this.handleDateTimeCommand(params, block),
    };
  }

  registerListeners(): Map<ConceptEventType, ConceptListener> {
    return new Map();
  }

  async initialize(): Promise<void> {
    console.log('🕐 DateTime API ready for concept files to use');
  }

  async cleanup(): Promise<void> {
    console.log('🧹 DateTime plugin cleaned up');
  }

  private handleDateTimeCommand(params: any[], block?: any[]): void {
    const action = params[1]?.name || params[0]?.name;
    const remainingParams = params.slice(2);

    switch (action) {
      case 'now':
        this.getCurrentDateTime(remainingParams);
        break;
      case 'format':
        this.formatDateTime(remainingParams);
        break;
      case 'parse':
        this.parseDateTime(remainingParams);
        break;
      case 'add':
        this.addTime(remainingParams);
        break;
      case 'subtract':
        this.subtractTime(remainingParams);
        break;
      case 'diff':
        this.getTimeDifference(remainingParams);
        break;
      case 'config':
        this.updateConfig(remainingParams[0]?.name, remainingParams[1]?.name);
        break;
      case 'help':
        this.showHelp();
        break;
      default:
        this.showHelp();
    }
  }

  private getCurrentDateTime(params: any[]): void {
    const now = new Date();
    const format = params[0]?.name || this.dtConfig.format;

    let result: string;
    switch (format.toLowerCase()) {
      case 'iso':
        result = now.toISOString();
        break;
      case 'unix':
        result = Math.floor(now.getTime() / 1000).toString();
        break;
      case 'rfc2822':
        result = now.toUTCString();
        break;
      case 'local':
        result = now.toLocaleString(this.dtConfig.locale);
        break;
      case 'date':
        result = now.toLocaleDateString(this.dtConfig.locale);
        break;
      case 'time':
        result = now.toLocaleTimeString(this.dtConfig.locale);
        break;
      default:
        result = now.toISOString();
    }

    console.log(`🕐 Current ${format} time: ${result}`);
  }

  private formatDateTime(params: any[]): void {
    const dateStr = params[0]?.name;
    const format = params[1]?.name || this.dtConfig.format;

    if (!dateStr) {
      console.log('❌ Format requires a date string');
      return;
    }

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.log('❌ Invalid date string');
        return;
      }

      let result: string;
      switch (format.toLowerCase()) {
        case 'iso':
          result = date.toISOString();
          break;
        case 'unix':
          result = Math.floor(date.getTime() / 1000).toString();
          break;
        case 'rfc2822':
          result = date.toUTCString();
          break;
        case 'local':
          result = date.toLocaleString(this.dtConfig.locale);
          break;
        case 'date':
          result = date.toLocaleDateString(this.dtConfig.locale);
          break;
        case 'time':
          result = date.toLocaleTimeString(this.dtConfig.locale);
          break;
        default:
          result = date.toISOString();
      }

      console.log(`🕐 Formatted ${format} time: ${result}`);
    } catch (error) {
      console.log('❌ Error formatting date:', error);
    }
  }

  private parseDateTime(params: any[]): void {
    const dateStr = params[0]?.name;

    if (!dateStr) {
      console.log('❌ Parse requires a date string');
      return;
    }

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.log('❌ Invalid date string');
        return;
      }

      console.log(`🕐 Parsed date: ${date.toISOString()}`);
      console.log(`   Unix timestamp: ${Math.floor(date.getTime() / 1000)}`);
      console.log(
        `   Local time: ${date.toLocaleString(this.dtConfig.locale)}`
      );
    } catch (error) {
      console.log('❌ Error parsing date:', error);
    }
  }

  private addTime(params: any[]): void {
    const amount = parseInt(params[0]?.name || '0');
    const unit = params[1]?.name || 'seconds';
    const baseDate = params[2]?.name ? new Date(params[2].name) : new Date();

    if (isNaN(baseDate.getTime())) {
      console.log('❌ Invalid base date');
      return;
    }

    const result = new Date(baseDate);

    switch (unit.toLowerCase()) {
      case 'milliseconds':
      case 'ms':
        result.setMilliseconds(result.getMilliseconds() + amount);
        break;
      case 'seconds':
      case 's':
        result.setSeconds(result.getSeconds() + amount);
        break;
      case 'minutes':
      case 'm':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'hours':
      case 'h':
        result.setHours(result.getHours() + amount);
        break;
      case 'days':
      case 'd':
        result.setDate(result.getDate() + amount);
        break;
      case 'weeks':
      case 'w':
        result.setDate(result.getDate() + amount * 7);
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
      default:
        console.log('❌ Unknown time unit:', unit);
        return;
    }

    console.log(`🕐 Added ${amount} ${unit}: ${result.toISOString()}`);
  }

  private subtractTime(params: any[]): void {
    const amount = parseInt(params[0]?.name || '0');
    const unit = params[1]?.name || 'seconds';
    const baseDate = params[2]?.name ? new Date(params[2].name) : new Date();

    if (isNaN(baseDate.getTime())) {
      console.log('❌ Invalid base date');
      return;
    }

    const result = new Date(baseDate);

    switch (unit.toLowerCase()) {
      case 'milliseconds':
      case 'ms':
        result.setMilliseconds(result.getMilliseconds() - amount);
        break;
      case 'seconds':
      case 's':
        result.setSeconds(result.getSeconds() - amount);
        break;
      case 'minutes':
      case 'm':
        result.setMinutes(result.getMinutes() - amount);
        break;
      case 'hours':
      case 'h':
        result.setHours(result.getHours() - amount);
        break;
      case 'days':
      case 'd':
        result.setDate(result.getDate() - amount);
        break;
      case 'weeks':
      case 'w':
        result.setDate(result.getDate() - amount * 7);
        break;
      case 'months':
        result.setMonth(result.getMonth() - amount);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() - amount);
        break;
      default:
        console.log('❌ Unknown time unit:', unit);
        return;
    }

    console.log(`🕐 Subtracted ${amount} ${unit}: ${result.toISOString()}`);
  }

  private getTimeDifference(params: any[]): void {
    const date1 = params[0]?.name ? new Date(params[0].name) : new Date();
    const date2 = params[1]?.name ? new Date(params[1].name) : new Date();
    const unit = params[2]?.name || 'milliseconds';

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      console.log('❌ Invalid date(s)');
      return;
    }

    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    let result: number;

    switch (unit.toLowerCase()) {
      case 'milliseconds':
      case 'ms':
        result = diffMs;
        break;
      case 'seconds':
      case 's':
        result = Math.floor(diffMs / 1000);
        break;
      case 'minutes':
      case 'm':
        result = Math.floor(diffMs / (1000 * 60));
        break;
      case 'hours':
      case 'h':
        result = Math.floor(diffMs / (1000 * 60 * 60));
        break;
      case 'days':
      case 'd':
        result = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        break;
      case 'weeks':
      case 'w':
        result = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
        break;
      default:
        console.log('❌ Unknown time unit:', unit);
        return;
    }

    console.log(`🕐 Time difference: ${result} ${unit}`);
  }

  private updateConfig(key: string, value: string): void {
    if (!key || !value) {
      console.log('❌ Config requires key and value');
      return;
    }

    switch (key.toLowerCase()) {
      case 'timezone':
        this.dtConfig.timezone = value;
        console.log(`🕐 Timezone set to: ${value}`);
        break;
      case 'format':
        this.dtConfig.format = value;
        console.log(`🕐 Default format set to: ${value}`);
        break;
      case 'locale':
        this.dtConfig.locale = value;
        console.log(`🕐 Locale set to: ${value}`);
        break;
      default:
        console.log(`❌ Unknown config key: ${key}`);
    }
  }

  private showHelp(): void {
    console.log(`
🕐 DateTime Plugin - Available Commands:

Time Operations:
  datetime now [format]                - Get current date/time
  datetime format <date> [format]      - Format a date string
  datetime parse <date>                - Parse and display date info
  datetime add <amount> <unit> [date]  - Add time to date
  datetime subtract <amount> <unit> [date] - Subtract time from date
  datetime diff <date1> <date2> [unit] - Get time difference

Configuration:
  datetime config <key> <value>        - Set configuration
  datetime help                        - Show this help

Formats: iso, unix, rfc2822, local, date, time
Units: milliseconds, seconds, minutes, hours, days, weeks, months, years
    `);
  }
}

export default DateTimePlugin;
