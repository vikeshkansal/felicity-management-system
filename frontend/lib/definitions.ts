export type UserSession = {
  id: string;
  email: string;
  role: "participant" | "organizer" | "admin";
  onboardingCompleted?: boolean;
};

export type Organizer = {
  _id: string;
  name: string;
  category: string;
  description: string;
  email: string;
  mobile?: string;
  isDisabled: boolean;
  discordWebhook?: string;
};

export type Participant = {
  _id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  mobile: string;
  orgName: string;
  participantType: "IIIT-H" | "External";
  interests?: string[];
  following?: string[];
  onboardingCompleted?: boolean;
};

export type CustomFormField = {
  fieldName: string;
  fieldType: 'text' | 'dropdown' | 'checkbox' | 'file';
  required: boolean;
  options: string[];
  order: number;
};

export type ItemDetails = {
  sizes: string[];
  colors: string[];
  variants: string[];
};

export type Event = {
  _id: string;
  name: string;
  description: string;
  type: "normal" | "merchandise";
  status: "draft" | "published" | "closed" | "ongoing" | "completed";
  eligibility: string;
  regDeadline: string;
  regLimit: number;
  regFee: number;
  tags: string[];
  start: string;
  end: string;
  organizer: string;
  itemDetails?: ItemDetails;
  stockQuantity?: number;
  purchaseLimitPerParticipant?: number;
  customForm?: CustomFormField[];
};

export type Registration = {
  _id: string;
  event: Event;
  participant: Participant;
  status: "registered" | "confirmed" | "cancelled";
  registrationDate: string;
  ticketId: string;
  ticketQrCode?: string;
};