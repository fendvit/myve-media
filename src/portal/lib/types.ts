// Hand-written types for the portal tables.
//
// src/integrations/supabase/types.ts is generated from the marketing schema and
// gets overwritten, so the portal keeps its own definitions instead of editing
// that file. Shape matches supabase/migrations/20260826120000_portal_schema.sql.

export type PortalRole = "admin" | "client";
export type SenderRole = "admin" | "client";

// All row shapes are `type` aliases rather than interfaces on purpose:
// supabase-js constrains a table's Row/Insert/Update to `Record<string, unknown>`,
// and only type aliases get TypeScript's implicit index signature. Declared as
// interfaces they fail that constraint and every query silently degrades to
// `never` — which shows up as "not assignable to parameter of type 'never'".

export type PortalClient = {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  /** Public URL in the portal-logos bucket. Null means fall back to the MYVE wordmark. */
  logo_url: string | null;
  access_code: string;
  auth_user_id: string | null;
  archived: boolean;
  created_at: string;
};

export type PortalProject = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  live_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PortalUpdate = {
  id: string;
  project_id: string;
  title: string | null;
  body: string;
  /** True when `body` is sanitized HTML; false means plain text. */
  is_html: boolean;
  created_at: string;
};

export type PortalMessage = {
  id: string;
  client_id: string;
  sender_role: SenderRole;
  sender_user_id: string | null;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  read_at: string | null;
};

export type PortalProfile = {
  user_id: string;
  role: PortalRole;
  client_id: string | null;
};

export type PortalReadState = {
  user_id: string;
  client_id: string;
  messages_seen_at: string;
  updates_seen_at: string;
};

/** Presence of a row means this person closed the welcome notice on that project. */
export type PortalWelcomeDismissal = {
  user_id: string;
  project_id: string;
  dismissed_at: string;
};

/** One row per visible client, returned by the portal_unread_summary() RPC. */
export type PortalUnreadRow = {
  client_id: string;
  unread_messages: number;
  unread_updates: number;
};

/** Where a device is reached: `web` uses Web Push, the rest use FCM. */
export type PortalPushPlatform = "web" | "android" | "ios";

export type PortalPushSubscription = {
  id: string;
  user_id: string;
  /** Push-service URL when platform is `web`, an FCM registration token otherwise. */
  endpoint: string;
  platform: PortalPushPlatform;
  /** Web Push only — FCM has no per-subscription key pair. */
  p256dh: string | null;
  auth: string | null;
  user_agent: string | null;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

// A `type` alias, not an `interface`: supabase-js matches this against
// `GenericSchema` (a Record<string, …>), and only type aliases get TypeScript's
// implicit index signature. As an interface the schema resolves to `never`.
export type PortalDatabase = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      portal_clients: Table<
        PortalClient,
        { name: string } & Partial<Omit<PortalClient, "name">>
      >;
      portal_projects: Table<
        PortalProject,
        { client_id: string; name: string } & Partial<Omit<PortalProject, "client_id" | "name">>
      >;
      portal_updates: Table<
        PortalUpdate,
        { project_id: string; body: string } & Partial<Omit<PortalUpdate, "project_id" | "body">>
      >;
      portal_messages: Table<
        PortalMessage,
        { client_id: string; sender_role: SenderRole } & Partial<
          Omit<PortalMessage, "client_id" | "sender_role">
        >
      >;
      portal_profiles: Table<PortalProfile>;
      portal_read_state: Table<
        PortalReadState,
        { user_id: string; client_id: string } & Partial<
          Omit<PortalReadState, "user_id" | "client_id">
        >
      >;
      portal_welcome_dismissals: Table<
        PortalWelcomeDismissal,
        { user_id: string; project_id: string } & Partial<
          Omit<PortalWelcomeDismissal, "user_id" | "project_id">
        >
      >;
      portal_push_subscriptions: Table<
        PortalPushSubscription,
        // p256dh/auth stay optional here because they're required for web rows
        // and forbidden for native ones; a check constraint enforces the pairing.
        { user_id: string; endpoint: string; platform: PortalPushPlatform } & Partial<
          Omit<PortalPushSubscription, "user_id" | "endpoint" | "platform">
        >
      >;
    };
    // `{ [_ in never]: never }` and not `Record<string, never>`: the latter adds
    // a string index signature, and supabase-js resolves a table as
    // `(Tables & Views)[Name]` — which would collapse every table to `never`.
    Views: { [_ in never]: never };
    Functions: {
      portal_unread_summary: {
        Args: Record<string, never>;
        Returns: PortalUnreadRow[];
      };
      // A plain upsert can't do this: `on conflict do update` needs the
      // conflicting row to be visible through the SELECT policy, and a device
      // registered by a previous account is not. Runs security definer and
      // always writes auth.uid() as the owner.
      portal_claim_push_subscription: {
        Args: {
          p_endpoint: string;
          p_platform: PortalPushPlatform;
          p_p256dh?: string | null;
          p_auth?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
