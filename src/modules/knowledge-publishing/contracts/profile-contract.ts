import { OutputFormat } from "./renderer-contract";

export interface PublicationProfile {
  id: string;
  name: string;
  publisherIds: string[]; // e.g. ["executive-publisher", "engineering-publisher", "action-register-publisher"]
  targetFormats: OutputFormat[]; // e.g. ["markdown", "json", "html", "text"]
}

export const PRESET_PUBLICATION_PROFILES: Record<string, PublicationProfile> = {
  EXECUTIVE: {
    id: "profile-executive",
    name: "Executive Publication Profile",
    publisherIds: ["executive-publisher", "action-register-publisher"],
    targetFormats: ["markdown", "html"],
  },
  ENGINEERING: {
    id: "profile-engineering",
    name: "Engineering Publication Profile",
    publisherIds: ["engineering-publisher", "decision-register-publisher", "risk-register-publisher"],
    targetFormats: ["markdown", "json"],
  },
  MACHINE: {
    id: "profile-machine",
    name: "Machine Publication Profile",
    publisherIds: ["machine-publisher"],
    targetFormats: ["json"],
  },
  FULL: {
    id: "profile-full",
    name: "Full Publication Profile",
    publisherIds: [
      "executive-publisher",
      "engineering-publisher",
      "action-register-publisher",
      "decision-register-publisher",
      "risk-register-publisher",
      "stakeholder-brief-publisher",
      "machine-publisher",
    ],
    targetFormats: ["markdown", "json", "html", "text"],
  },
};
