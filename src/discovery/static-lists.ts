export interface StaticListEntry {
  id: number;
  name: string;
}

export interface DocumentedStaticLists {
  source: string;
  capturedAt: string;
  customerVendorStatus: readonly StaticListEntry[];
  customerAssetStatus: readonly StaticListEntry[];
  orderStatus: readonly StaticListEntry[];
  taskStatus: readonly StaticListEntry[];
}

export const DOCUMENTED_STATIC_LISTS: DocumentedStaticLists = {
  source: "https://api.striven.com/Help/StaticLists",
  capturedAt: "2026-09-21",
  customerVendorStatus: [
    { id: 1, name: "Prospect" },
    { id: 2, name: "Active" },
    { id: 3, name: "Deleted" },
    { id: 4, name: "Lost" },
  ],
  customerAssetStatus: [
    { id: 15, name: "Out of Service" },
    { id: 16, name: "In Service" },
    { id: 17, name: "Retired" },
    { id: 148, name: "Unsupported" },
    { id: 191, name: "Inactive" },
  ],
  orderStatus: [
    { id: 18, name: "Incomplete" },
    { id: 19, name: "Quoted" },
    { id: 20, name: "Pending Approval" },
    { id: 21, name: "Declined" },
    { id: 22, name: "Approved" },
    { id: 23, name: "Canceled" },
    { id: 24, name: "Lost" },
    { id: 25, name: "In Progress" },
    { id: 27, name: "Completed" },
  ],
  taskStatus: [
    { id: 48, name: "Open" },
    { id: 50, name: "Done" },
    { id: 51, name: "Canceled" },
    { id: 68, name: "On Hold" },
  ],
};
