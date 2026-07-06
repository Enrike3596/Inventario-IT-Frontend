// Generic reactive store over mock data. Each resource exposes list/create/update/remove
// and a `useResource` React hook for reactivity.
import { useEffect, useState } from "react";
import { nextId } from "./mock-data";

type Listener = () => void;

export class Resource<T> {
  private data: T[];
  private listeners = new Set<Listener>();
  constructor(
    private readonly idKey: keyof T,
    initial: T[],
  ) {
    this.data = [...initial];
  }
  list(): T[] {
    return this.data;
  }
  get(id: number): T | undefined {
    return this.data.find((r) => (r[this.idKey] as unknown as number) === id);
  }
  create(item: Partial<T>): T {
    const created = { ...(item as T), [this.idKey]: nextId() } as T;
    this.data = [created, ...this.data];
    this.emit();
    return created;
  }
  update(id: number, patch: Partial<T>): T | undefined {
    let updated: T | undefined;
    this.data = this.data.map((r) => {
      if ((r[this.idKey] as unknown as number) === id) {
        updated = { ...r, ...patch };
        return updated;
      }
      return r;
    });
    this.emit();
    return updated;
  }
  remove(id: number) {
    this.data = this.data.filter((r) => (r[this.idKey] as unknown as number) !== id);
    this.emit();
  }
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export function useResource<T>(resource: Resource<T>): T[] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = resource.subscribe(() => setTick((t) => t + 1));
    return () => {
      unsub();
    };
  }, [resource]);
  return resource.list();
}

import {
  mockActivos,
  mockAsignaciones,
  mockCanales,
  mockCategorias,
  mockMovimientos,
  mockOrdenes,
  mockParqueaderos,
  mockRoles,
  mockSalidas,
  mockSedes,
  mockUsuarios,
} from "./mock-data";
import type {
  Activo,
  AsignacionUsuario,
  Canal,
  CategoriaActivo,
  Movimiento,
  OrdenCompra,
  Parqueadero,
  Role,
  Salida,
  Sede,
  Usuario,
} from "./types";

export const stores = {
  activos: new Resource<Activo>("idActivo", mockActivos),
  categorias: new Resource<CategoriaActivo>("idCategoria", mockCategorias),
  ordenes: new Resource<OrdenCompra>("idOrden", mockOrdenes),
  sedes: new Resource<Sede>("idSede", mockSedes),
  parqueaderos: new Resource<Parqueadero>("idParqueadero", mockParqueaderos),
  usuarios: new Resource<Usuario>("idUsuario", mockUsuarios),
  roles: new Resource<Role>("idRol", mockRoles),
  asignaciones: new Resource<AsignacionUsuario>("idAsignacion", mockAsignaciones),
  salidas: new Resource<Salida>("idSalida", mockSalidas),
  movimientos: new Resource<Movimiento>("idMovimiento", mockMovimientos),
  canales: new Resource<Canal>("idCanal", mockCanales),
};
