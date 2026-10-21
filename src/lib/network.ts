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
      { title: `${title} · ACOMPAÑAME` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ACOMPAÑAME` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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



