import { SWRConfiguration } from "swr";

export const useSwrDefaultConfig: SWRConfiguration = {
  keepPreviousData: true,
  revalidateOnFocus: false, // only one user, won't have concurrent updates
  errorRetryCount: 1,
  errorRetryInterval: 3000,
};
