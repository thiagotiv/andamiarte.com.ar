import { queryOptions } from "@tanstack/react-query";
import {
  getPublicNetwork,
  getMyAccount,
  getMyMessages,
  getMyApplications,
} from "./network.functions";
export const networkOptions = queryOptions({
  queryKey: ["network"],
  queryFn: () => getPublicNetwork(),
});
export const accountOptions = queryOptions({
  queryKey: ["account"],
  queryFn: () => getMyAccount(),
});
export const messageOptions = queryOptions({
  queryKey: ["messages"],
  queryFn: () => getMyMessages(),
  refetchInterval: 10000,
});
export const applicationOptions = queryOptions({
  queryKey: ["applications"],
  queryFn: () => getMyApplications(),
});
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} · Andamiarte` },
      { name: "description", content: description },
      { property: "og:site_name", content: "Andamiarte" },
      { property: "og:locale", content: "es_AR" },
      { property: "og:title", content: `${title} · Andamiarte` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://andamiarte.com.ar/og-image.png" },
      { property: "og:image:secure_url", content: "https://andamiarte.com.ar/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Andamiarte - Red de Inclusión Escolar" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${title} · Andamiarte` },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://andamiarte.com.ar/og-image.png" },
    ],
  };
}
import { getMyApplicationsDetailed, getCandidateBoard } from "./network.functions";
export const myApplicationsOptions = queryOptions({
  queryKey: ["my-applications"],
  queryFn: () => getMyApplicationsDetailed(),
});
export const candidateBoardOptions = queryOptions({
  queryKey: ["candidate-board"],
  queryFn: () => getCandidateBoard(),
});
import { getMySaved, getMyAlerts, getMyNotifications, getInstitutionalProfile, getMyConnections, getMyAnalytics } from "./network.functions";
export const savedOptions = queryOptions({ queryKey: ["saved"], queryFn: () => getMySaved() });
export const alertsOptions = queryOptions({ queryKey: ["alerts"], queryFn: () => getMyAlerts() });
export const notificationsOptions = queryOptions({
  queryKey: ["notifications"],
  queryFn: () => getMyNotifications(),
});
export const myConnectionsOptions = queryOptions({
  queryKey: ["my-connections"],
  queryFn: () => getMyConnections(),
});
export const analyticsOptions = queryOptions({
  queryKey: ["analytics"],
  queryFn: () => getMyAnalytics(),
});
export const institutionalProfileOptions = (id: string) =>
  queryOptions({
    queryKey: ["institutional-profile", id],
    queryFn: () => getInstitutionalProfile({ data: { id } }),
  });

export {
  publishJob,
  applyToJob,
  updateApplicationStage,
  closeJob,
  createPost,
  deletePost,
  togglePostLike,
  addPostComment,
  votePostPoll,
  sharePost,
} from "./network.functions";



