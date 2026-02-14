import { createMongoAbility } from '@casl/ability';
import type { MongoAbility, RawRuleOf } from '@casl/ability';

// Tipos de acciones y subjects
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subjects = 
  | 'Producto'
  | 'Categoria'
  | 'Proveedor'
  | 'MovimientoInventario'
  | 'Cliente'
  | 'Factura'
  | 'Usuario'
  | 'Empleado'
  | 'Asistencia'
  | 'Camara'
  | 'Reporte'
  | 'Dashboard'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

// Roles disponibles
export type Role = 'ADMIN' | 'VENDEDOR';

// Interface del usuario
export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: Role;
}

// Interface de la respuesta de autenticación
export interface AuthResponse {
  user: User;
  token: string;
  abilities: Array<{ action: string; subject: string; inverted?: boolean }>;
}

// Crear ability vacía por defecto
export function createAbility(rules: Array<{ action: string; subject: string; inverted?: boolean }> = []): AppAbility {
  const caslRules: RawRuleOf<AppAbility>[] = rules.map(rule => ({
    action: rule.action as Actions,
    subject: rule.subject as Subjects,
    inverted: rule.inverted
  }));
  return createMongoAbility<AppAbility>(caslRules);
}

// Ability por defecto (sin permisos)
export const defaultAbility = createAbility([]);
