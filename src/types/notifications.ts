export enum NotificationType {
  EMAIL = 'EMAIL',
  WEBHOOK = 'WEBHOOK',
  DISCORD = 'DISCORD'
}

export enum BuildingType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  LAND = 'LAND',
  COMMERCIAL = 'COMMERCIAL',
  OTHER = 'OTHER'
}

export enum TransactionType {
  SALE = 'SALE',
  RENT = 'RENT'
}

export interface FilterRange<T> {
  from?: T;
  to?: T;
}

export interface NotificationFilter {
  buildingType: BuildingType;
  transactionType: TransactionType;
  size?: FilterRange<number>;
  price?: FilterRange<number>;
  subTypes?: string[];
}

export interface Notification {
  id: string;
  name: string;
  userId: string;
  filter: NotificationFilter;
  updatedAt: string;
  createdAt: string;
  enabled: boolean;
  type: NotificationType;
}

export interface EmailNotification extends Notification {
  email: string;
  type: NotificationType.EMAIL;
}

export interface WebhookNotification extends Notification {
  url: string;
  type: NotificationType.WEBHOOK;
}

export interface DiscordWebhookNotification extends Notification {
  webhookId: string;
  token: string;
  type: NotificationType.DISCORD;
}

export interface AddNotificationCommand {
  name: string;
  filter: NotificationFilter;
  type: string;
}

export class EmailNotificationCommand implements AddNotificationCommand {
  type: string = 'email';
  constructor(
    public name: string,
    public filter: NotificationFilter,
    public email: string
  ) {}
}

export class WebhookNotificationCommand implements AddNotificationCommand {
  type: string = 'api';
  constructor(
    public name: string,
    public filter: NotificationFilter,
    public url: string
  ) {}
}

export class DiscordWebhookNotificationCommand implements AddNotificationCommand {
  type: string = 'discord';
  constructor(
    public name: string,
    public filter: NotificationFilter,
    public webhookId: string,
    public token: string
  ) {}
}
