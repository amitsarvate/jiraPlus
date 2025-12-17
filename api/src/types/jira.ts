export type AccessibleResource = {
  id: string;
  name: string;
  url: string;
  scopes: string[];
};

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
};
