import * as jspb from 'google-protobuf'



export class UserProfile extends jspb.Message {
  getAvatarUrl(): string;
  setAvatarUrl(value: string): UserProfile;

  getBio(): string;
  setBio(value: string): UserProfile;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserProfile.AsObject;
  static toObject(includeInstance: boolean, msg: UserProfile): UserProfile.AsObject;
  static serializeBinaryToWriter(message: UserProfile, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserProfile;
  static deserializeBinaryFromReader(message: UserProfile, reader: jspb.BinaryReader): UserProfile;
}

export namespace UserProfile {
  export type AsObject = {
    avatarUrl: string;
    bio: string;
  };
}

export class User extends jspb.Message {
  getId(): string;
  setId(value: string): User;

  getEmail(): string;
  setEmail(value: string): User;

  getPhone(): string;
  setPhone(value: string): User;

  getFirstName(): string;
  setFirstName(value: string): User;

  getLastName(): string;
  setLastName(value: string): User;

  getRole(): string;
  setRole(value: string): User;

  getStatus(): string;
  setStatus(value: string): User;

  getCreatedAt(): number;
  setCreatedAt(value: number): User;

  getProfile(): UserProfile | undefined;
  setProfile(value?: UserProfile): User;
  hasProfile(): boolean;
  clearProfile(): User;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): User.AsObject;
  static toObject(includeInstance: boolean, msg: User): User.AsObject;
  static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): User;
  static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
  export type AsObject = {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    createdAt: number;
    profile?: UserProfile.AsObject;
  };
}

export class GetProfileRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetProfileRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetProfileRequest): GetProfileRequest.AsObject;
  static serializeBinaryToWriter(message: GetProfileRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetProfileRequest;
  static deserializeBinaryFromReader(message: GetProfileRequest, reader: jspb.BinaryReader): GetProfileRequest;
}

export namespace GetProfileRequest {
  export type AsObject = {
  };
}

export class GetProfileResponse extends jspb.Message {
  getUser(): User | undefined;
  setUser(value?: User): GetProfileResponse;
  hasUser(): boolean;
  clearUser(): GetProfileResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetProfileResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetProfileResponse): GetProfileResponse.AsObject;
  static serializeBinaryToWriter(message: GetProfileResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetProfileResponse;
  static deserializeBinaryFromReader(message: GetProfileResponse, reader: jspb.BinaryReader): GetProfileResponse;
}

export namespace GetProfileResponse {
  export type AsObject = {
    user?: User.AsObject;
  };
}

export class UpdateProfileRequest extends jspb.Message {
  getFirstName(): string;
  setFirstName(value: string): UpdateProfileRequest;
  hasFirstName(): boolean;
  clearFirstName(): UpdateProfileRequest;

  getLastName(): string;
  setLastName(value: string): UpdateProfileRequest;
  hasLastName(): boolean;
  clearLastName(): UpdateProfileRequest;

  getAvatarUrl(): string;
  setAvatarUrl(value: string): UpdateProfileRequest;
  hasAvatarUrl(): boolean;
  clearAvatarUrl(): UpdateProfileRequest;

  getBio(): string;
  setBio(value: string): UpdateProfileRequest;
  hasBio(): boolean;
  clearBio(): UpdateProfileRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateProfileRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateProfileRequest): UpdateProfileRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateProfileRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateProfileRequest;
  static deserializeBinaryFromReader(message: UpdateProfileRequest, reader: jspb.BinaryReader): UpdateProfileRequest;
}

export namespace UpdateProfileRequest {
  export type AsObject = {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    bio?: string;
  };

  export enum FirstNameCase {
    _FIRST_NAME_NOT_SET = 0,
    FIRST_NAME = 1,
  }

  export enum LastNameCase {
    _LAST_NAME_NOT_SET = 0,
    LAST_NAME = 2,
  }

  export enum AvatarUrlCase {
    _AVATAR_URL_NOT_SET = 0,
    AVATAR_URL = 3,
  }

  export enum BioCase {
    _BIO_NOT_SET = 0,
    BIO = 4,
  }
}

export class UpdateProfileResponse extends jspb.Message {
  getUser(): User | undefined;
  setUser(value?: User): UpdateProfileResponse;
  hasUser(): boolean;
  clearUser(): UpdateProfileResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateProfileResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateProfileResponse): UpdateProfileResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateProfileResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateProfileResponse;
  static deserializeBinaryFromReader(message: UpdateProfileResponse, reader: jspb.BinaryReader): UpdateProfileResponse;
}

export namespace UpdateProfileResponse {
  export type AsObject = {
    user?: User.AsObject;
  };
}

export class DeleteAccountRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAccountRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAccountRequest): DeleteAccountRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteAccountRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAccountRequest;
  static deserializeBinaryFromReader(message: DeleteAccountRequest, reader: jspb.BinaryReader): DeleteAccountRequest;
}

export namespace DeleteAccountRequest {
  export type AsObject = {
  };
}

export class DeleteAccountResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): DeleteAccountResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteAccountResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteAccountResponse): DeleteAccountResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteAccountResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteAccountResponse;
  static deserializeBinaryFromReader(message: DeleteAccountResponse, reader: jspb.BinaryReader): DeleteAccountResponse;
}

export namespace DeleteAccountResponse {
  export type AsObject = {
    success: boolean;
  };
}

export class ListUsersRequest extends jspb.Message {
  getLimit(): number;
  setLimit(value: number): ListUsersRequest;

  getOffset(): number;
  setOffset(value: number): ListUsersRequest;

  getSearch(): string;
  setSearch(value: string): ListUsersRequest;
  hasSearch(): boolean;
  clearSearch(): ListUsersRequest;

  getRole(): string;
  setRole(value: string): ListUsersRequest;
  hasRole(): boolean;
  clearRole(): ListUsersRequest;

  getStatus(): string;
  setStatus(value: string): ListUsersRequest;
  hasStatus(): boolean;
  clearStatus(): ListUsersRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUsersRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListUsersRequest): ListUsersRequest.AsObject;
  static serializeBinaryToWriter(message: ListUsersRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUsersRequest;
  static deserializeBinaryFromReader(message: ListUsersRequest, reader: jspb.BinaryReader): ListUsersRequest;
}

export namespace ListUsersRequest {
  export type AsObject = {
    limit: number;
    offset: number;
    search?: string;
    role?: string;
    status?: string;
  };

  export enum SearchCase {
    _SEARCH_NOT_SET = 0,
    SEARCH = 3,
  }

  export enum RoleCase {
    _ROLE_NOT_SET = 0,
    ROLE = 4,
  }

  export enum StatusCase {
    _STATUS_NOT_SET = 0,
    STATUS = 5,
  }
}

export class ListUsersResponse extends jspb.Message {
  getUsersList(): Array<User>;
  setUsersList(value: Array<User>): ListUsersResponse;
  clearUsersList(): ListUsersResponse;
  addUsers(value?: User, index?: number): User;

  getTotal(): number;
  setTotal(value: number): ListUsersResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListUsersResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListUsersResponse): ListUsersResponse.AsObject;
  static serializeBinaryToWriter(message: ListUsersResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListUsersResponse;
  static deserializeBinaryFromReader(message: ListUsersResponse, reader: jspb.BinaryReader): ListUsersResponse;
}

export namespace ListUsersResponse {
  export type AsObject = {
    usersList: Array<User.AsObject>;
    total: number;
  };
}

