export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  permissions: string[];
  isVerified?: boolean;
  isMessenger?: boolean;
  createdAt?: string | Date;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface AdminPermissionsResponse {
  permissions: string[];
}

export interface UpdateUserPermissionsResponse {
  user: AdminUser;
}

export interface AdminPermissionDefinition {
  key: string;
  label: string;
  description?: string;
}
