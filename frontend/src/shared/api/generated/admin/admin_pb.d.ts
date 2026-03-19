import * as jspb from 'google-protobuf'



export class GetDashboardStatsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDashboardStatsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetDashboardStatsRequest): GetDashboardStatsRequest.AsObject;
  static serializeBinaryToWriter(message: GetDashboardStatsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDashboardStatsRequest;
  static deserializeBinaryFromReader(message: GetDashboardStatsRequest, reader: jspb.BinaryReader): GetDashboardStatsRequest;
}

export namespace GetDashboardStatsRequest {
  export type AsObject = {
  };
}

export class DailyRegistration extends jspb.Message {
  getDate(): string;
  setDate(value: string): DailyRegistration;

  getCount(): number;
  setCount(value: number): DailyRegistration;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DailyRegistration.AsObject;
  static toObject(includeInstance: boolean, msg: DailyRegistration): DailyRegistration.AsObject;
  static serializeBinaryToWriter(message: DailyRegistration, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DailyRegistration;
  static deserializeBinaryFromReader(message: DailyRegistration, reader: jspb.BinaryReader): DailyRegistration;
}

export namespace DailyRegistration {
  export type AsObject = {
    date: string;
    count: number;
  };
}

export class GetDashboardStatsResponse extends jspb.Message {
  getTotalUsers(): number;
  setTotalUsers(value: number): GetDashboardStatsResponse;

  getActiveUsers(): number;
  setActiveUsers(value: number): GetDashboardStatsResponse;

  getNewUsersToday(): number;
  setNewUsersToday(value: number): GetDashboardStatsResponse;

  getNewUsersThisWeek(): number;
  setNewUsersThisWeek(value: number): GetDashboardStatsResponse;

  getNewUsersThisMonth(): number;
  setNewUsersThisMonth(value: number): GetDashboardStatsResponse;

  getDailyRegistrationsList(): Array<DailyRegistration>;
  setDailyRegistrationsList(value: Array<DailyRegistration>): GetDashboardStatsResponse;
  clearDailyRegistrationsList(): GetDashboardStatsResponse;
  addDailyRegistrations(value?: DailyRegistration, index?: number): DailyRegistration;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDashboardStatsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetDashboardStatsResponse): GetDashboardStatsResponse.AsObject;
  static serializeBinaryToWriter(message: GetDashboardStatsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDashboardStatsResponse;
  static deserializeBinaryFromReader(message: GetDashboardStatsResponse, reader: jspb.BinaryReader): GetDashboardStatsResponse;
}

export namespace GetDashboardStatsResponse {
  export type AsObject = {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    dailyRegistrationsList: Array<DailyRegistration.AsObject>;
  };
}

