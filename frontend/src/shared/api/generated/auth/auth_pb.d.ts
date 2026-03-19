import * as jspb from 'google-protobuf'



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
  };
}

export class LoginRequest extends jspb.Message {
  getEmail(): string;
  setEmail(value: string): LoginRequest;

  getPassword(): string;
  setPassword(value: string): LoginRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LoginRequest): LoginRequest.AsObject;
  static serializeBinaryToWriter(message: LoginRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginRequest;
  static deserializeBinaryFromReader(message: LoginRequest, reader: jspb.BinaryReader): LoginRequest;
}

export namespace LoginRequest {
  export type AsObject = {
    email: string;
    password: string;
  };
}

export class LoginResponse extends jspb.Message {
  getAccessToken(): string;
  setAccessToken(value: string): LoginResponse;

  getRefreshToken(): string;
  setRefreshToken(value: string): LoginResponse;

  getExpiresAt(): number;
  setExpiresAt(value: number): LoginResponse;

  getUser(): User | undefined;
  setUser(value?: User): LoginResponse;
  hasUser(): boolean;
  clearUser(): LoginResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginResponse.AsObject;
  static toObject(includeInstance: boolean, msg: LoginResponse): LoginResponse.AsObject;
  static serializeBinaryToWriter(message: LoginResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginResponse;
  static deserializeBinaryFromReader(message: LoginResponse, reader: jspb.BinaryReader): LoginResponse;
}

export namespace LoginResponse {
  export type AsObject = {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user?: User.AsObject;
  };
}

export class RegisterRequest extends jspb.Message {
  getFirstName(): string;
  setFirstName(value: string): RegisterRequest;

  getLastName(): string;
  setLastName(value: string): RegisterRequest;

  getPhone(): string;
  setPhone(value: string): RegisterRequest;

  getEmail(): string;
  setEmail(value: string): RegisterRequest;

  getPassword(): string;
  setPassword(value: string): RegisterRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterRequest): RegisterRequest.AsObject;
  static serializeBinaryToWriter(message: RegisterRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterRequest;
  static deserializeBinaryFromReader(message: RegisterRequest, reader: jspb.BinaryReader): RegisterRequest;
}

export namespace RegisterRequest {
  export type AsObject = {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
  };
}

export class RegisterResponse extends jspb.Message {
  getAccessToken(): string;
  setAccessToken(value: string): RegisterResponse;

  getRefreshToken(): string;
  setRefreshToken(value: string): RegisterResponse;

  getExpiresAt(): number;
  setExpiresAt(value: number): RegisterResponse;

  getUser(): User | undefined;
  setUser(value?: User): RegisterResponse;
  hasUser(): boolean;
  clearUser(): RegisterResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterResponse): RegisterResponse.AsObject;
  static serializeBinaryToWriter(message: RegisterResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterResponse;
  static deserializeBinaryFromReader(message: RegisterResponse, reader: jspb.BinaryReader): RegisterResponse;
}

export namespace RegisterResponse {
  export type AsObject = {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user?: User.AsObject;
  };
}

export class RefreshTokenRequest extends jspb.Message {
  getRefreshToken(): string;
  setRefreshToken(value: string): RefreshTokenRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RefreshTokenRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RefreshTokenRequest): RefreshTokenRequest.AsObject;
  static serializeBinaryToWriter(message: RefreshTokenRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RefreshTokenRequest;
  static deserializeBinaryFromReader(message: RefreshTokenRequest, reader: jspb.BinaryReader): RefreshTokenRequest;
}

export namespace RefreshTokenRequest {
  export type AsObject = {
    refreshToken: string;
  };
}

export class RefreshTokenResponse extends jspb.Message {
  getAccessToken(): string;
  setAccessToken(value: string): RefreshTokenResponse;

  getRefreshToken(): string;
  setRefreshToken(value: string): RefreshTokenResponse;

  getExpiresAt(): number;
  setExpiresAt(value: number): RefreshTokenResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RefreshTokenResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RefreshTokenResponse): RefreshTokenResponse.AsObject;
  static serializeBinaryToWriter(message: RefreshTokenResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RefreshTokenResponse;
  static deserializeBinaryFromReader(message: RefreshTokenResponse, reader: jspb.BinaryReader): RefreshTokenResponse;
}

export namespace RefreshTokenResponse {
  export type AsObject = {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export class LogoutRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LogoutRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LogoutRequest): LogoutRequest.AsObject;
  static serializeBinaryToWriter(message: LogoutRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LogoutRequest;
  static deserializeBinaryFromReader(message: LogoutRequest, reader: jspb.BinaryReader): LogoutRequest;
}

export namespace LogoutRequest {
  export type AsObject = {
  };
}

export class LogoutResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): LogoutResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LogoutResponse.AsObject;
  static toObject(includeInstance: boolean, msg: LogoutResponse): LogoutResponse.AsObject;
  static serializeBinaryToWriter(message: LogoutResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LogoutResponse;
  static deserializeBinaryFromReader(message: LogoutResponse, reader: jspb.BinaryReader): LogoutResponse;
}

export namespace LogoutResponse {
  export type AsObject = {
    success: boolean;
  };
}

export class SaveProgressRequest extends jspb.Message {
  getPhone(): string;
  setPhone(value: string): SaveProgressRequest;

  getStep(): number;
  setStep(value: number): SaveProgressRequest;

  getFirstName(): string;
  setFirstName(value: string): SaveProgressRequest;

  getLastName(): string;
  setLastName(value: string): SaveProgressRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SaveProgressRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SaveProgressRequest): SaveProgressRequest.AsObject;
  static serializeBinaryToWriter(message: SaveProgressRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SaveProgressRequest;
  static deserializeBinaryFromReader(message: SaveProgressRequest, reader: jspb.BinaryReader): SaveProgressRequest;
}

export namespace SaveProgressRequest {
  export type AsObject = {
    phone: string;
    step: number;
    firstName: string;
    lastName: string;
  };
}

export class SaveProgressResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): SaveProgressResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SaveProgressResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SaveProgressResponse): SaveProgressResponse.AsObject;
  static serializeBinaryToWriter(message: SaveProgressResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SaveProgressResponse;
  static deserializeBinaryFromReader(message: SaveProgressResponse, reader: jspb.BinaryReader): SaveProgressResponse;
}

export namespace SaveProgressResponse {
  export type AsObject = {
    success: boolean;
  };
}

export class GetProgressRequest extends jspb.Message {
  getPhone(): string;
  setPhone(value: string): GetProgressRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetProgressRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetProgressRequest): GetProgressRequest.AsObject;
  static serializeBinaryToWriter(message: GetProgressRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetProgressRequest;
  static deserializeBinaryFromReader(message: GetProgressRequest, reader: jspb.BinaryReader): GetProgressRequest;
}

export namespace GetProgressRequest {
  export type AsObject = {
    phone: string;
  };
}

export class GetProgressResponse extends jspb.Message {
  getStep(): number;
  setStep(value: number): GetProgressResponse;

  getFirstName(): string;
  setFirstName(value: string): GetProgressResponse;

  getLastName(): string;
  setLastName(value: string): GetProgressResponse;

  getPhone(): string;
  setPhone(value: string): GetProgressResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetProgressResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetProgressResponse): GetProgressResponse.AsObject;
  static serializeBinaryToWriter(message: GetProgressResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetProgressResponse;
  static deserializeBinaryFromReader(message: GetProgressResponse, reader: jspb.BinaryReader): GetProgressResponse;
}

export namespace GetProgressResponse {
  export type AsObject = {
    step: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

