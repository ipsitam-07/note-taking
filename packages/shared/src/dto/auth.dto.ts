export type AuthTokensDto = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUserDto = {
  id: string;
  email: string;
};

export type AuthResponseDto = {
  user: AuthUserDto;
  tokens: AuthTokensDto;
};