import { env } from "@/lib/env";

export const disableEmailPasswordAuthentication =
  env.disableEmailPasswordAuthentication;

export const googleWorkplaceDomain: string | undefined =
  env.googleWorkplaceDomain;
