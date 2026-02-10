export type OrgStatus = "active" | "suspended";

export type OrgRecord = {
  id: string;
  name: string;
  status: OrgStatus;
  createdAt: string;
  updatedAt: string;
};
