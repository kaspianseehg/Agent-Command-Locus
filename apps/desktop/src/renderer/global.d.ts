import type { AclApi } from "../main/preload";

declare global {
  interface Window {
    acl: AclApi;
  }
}

export {};
