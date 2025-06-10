/**
 * Interfaz para representar un usuario
 */
export interface IUser {
    id: number;
    code?: string;
    hashcode?: string;
    name: string;
    lastname: string;
    typeperson?: string;
    typeid: string;
    numberid?: string;
    address?: string;
    city_id?: number;
    phone: string;
    email: string;
    parentesco?: string;
    notificationid?: string;
    password?: string;
    session_token?: string;
    verificado: boolean;
    created_at: Date;
    updated_at: Date;
    pubname?: string;
    privname?: string;
    imagebs64?: string;
    path?: string;
    roles?: string[];
  }
  
  /**
   * Interfaz para filtros de usuario
   */
  export interface UserFilterOptions {
    id?: number;
    code?: string;
    email?: string;
    name?: string;
    lastname?: string;
    typeid?: string;
    numberid?: string;
    verificado?: boolean;
    city_id?: number;
    role_id?: number;
  }
  
  /**
   * Interfaz para representar un departamento
   */
  export interface IDepartment {
    id: number;
    name: string;
  }
  
  /**
   * Interfaz para representar un municipio/ciudad
   */
  export interface ITownship {
    id: number;
    department_id: number;
    code: string;
    name: string;
  }
  
  /**
   * Interfaz para representar un rol
   */
  export interface IRole {
    id: number;
    name: string;
    status: boolean;
  }
  
  /**
   * Interfaz para representar la relación usuario-rol
   */
  export interface IUserRole {
    id: number;
    user_id: number;
    role_id: number;
    user?: IUser;
    role?: IRole;
  }

