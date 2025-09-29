--
-- PostgreSQL database dump
--

\restrict ofWvLdQb4nnZDKdH05LyWQQGfQ8lWEMepwmAfVjep0NED8BpdoqachA19WvFdEP

-- Dumped from database version 17.5 (84bec44)
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO neondb_owner;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA neon_auth;


ALTER SCHEMA neon_auth OWNER TO neondb_owner;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: neondb_owner
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: neondb_owner
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: neondb_owner
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: users_sync; Type: TABLE; Schema: neon_auth; Owner: neondb_owner
--

CREATE TABLE neon_auth.users_sync (
    raw_json jsonb NOT NULL,
    id text GENERATED ALWAYS AS ((raw_json ->> 'id'::text)) STORED NOT NULL,
    name text GENERATED ALWAYS AS ((raw_json ->> 'display_name'::text)) STORED,
    email text GENERATED ALWAYS AS ((raw_json ->> 'primary_email'::text)) STORED,
    created_at timestamp with time zone GENERATED ALWAYS AS (to_timestamp((trunc((((raw_json ->> 'signed_up_at_millis'::text))::bigint)::double precision) / (1000)::double precision))) STORED,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE neon_auth.users_sync OWNER TO neondb_owner;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agents (
    id text NOT NULL,
    slug character varying(100),
    title character varying(255),
    description character varying(1000),
    tags jsonb DEFAULT '[]'::jsonb,
    avatar text,
    background_color text,
    plugins jsonb DEFAULT '[]'::jsonb,
    user_id text NOT NULL,
    chat_config jsonb,
    few_shots jsonb,
    model text,
    params jsonb DEFAULT '{}'::jsonb,
    provider text,
    system_role text,
    tts jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text,
    opening_message text,
    opening_questions text[] DEFAULT '{}'::text[]
);


ALTER TABLE public.agents OWNER TO neondb_owner;

--
-- Name: agents_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agents_files (
    file_id text NOT NULL,
    agent_id text NOT NULL,
    enabled boolean DEFAULT true,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agents_files OWNER TO neondb_owner;

--
-- Name: agents_knowledge_bases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agents_knowledge_bases (
    agent_id text NOT NULL,
    knowledge_base_id text NOT NULL,
    user_id text NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agents_knowledge_bases OWNER TO neondb_owner;

--
-- Name: agents_to_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agents_to_sessions (
    agent_id text NOT NULL,
    session_id text NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public.agents_to_sessions OWNER TO neondb_owner;

--
-- Name: ai_models; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_models (
    id character varying(150) NOT NULL,
    display_name character varying(200),
    description text,
    organization character varying(100),
    enabled boolean,
    provider_id character varying(64) NOT NULL,
    type character varying(20) DEFAULT 'chat'::character varying NOT NULL,
    sort integer,
    user_id text NOT NULL,
    pricing jsonb,
    parameters jsonb DEFAULT '{}'::jsonb,
    config jsonb,
    abilities jsonb DEFAULT '{}'::jsonb,
    context_window_tokens integer,
    source character varying(20),
    released_at character varying(10),
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_models OWNER TO neondb_owner;

--
-- Name: ai_providers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_providers (
    id character varying(64) NOT NULL,
    name text,
    user_id text NOT NULL,
    sort integer,
    enabled boolean,
    fetch_on_client boolean,
    check_model text,
    logo text,
    description text,
    key_vaults text,
    source character varying(20),
    settings jsonb,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    config jsonb
);


ALTER TABLE public.ai_providers OWNER TO neondb_owner;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    name character varying(256) NOT NULL,
    key character varying(256) NOT NULL,
    enabled boolean DEFAULT true,
    expires_at timestamp with time zone,
    last_used_at timestamp with time zone,
    user_id text NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_keys OWNER TO neondb_owner;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.api_keys ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.api_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: async_tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.async_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text,
    status text,
    error jsonb,
    user_id text NOT NULL,
    duration integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.async_tasks OWNER TO neondb_owner;

--
-- Name: chat_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_groups (
    id text NOT NULL,
    title text,
    description text,
    config jsonb,
    client_id text,
    user_id text NOT NULL,
    pinned boolean DEFAULT false,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_groups OWNER TO neondb_owner;

--
-- Name: chat_groups_agents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_groups_agents (
    chat_group_id text NOT NULL,
    agent_id text NOT NULL,
    user_id text NOT NULL,
    enabled boolean DEFAULT true,
    "order" integer DEFAULT 0,
    role text DEFAULT 'participant'::text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_groups_agents OWNER TO neondb_owner;

--
-- Name: chunks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    text text,
    abstract text,
    metadata jsonb,
    index integer,
    type character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text
)
WITH (autovacuum_vacuum_scale_factor='0.02', autovacuum_vacuum_threshold='1000');


ALTER TABLE public.chunks OWNER TO neondb_owner;

--
-- Name: document_chunks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.document_chunks (
    document_id character varying(30) NOT NULL,
    chunk_id uuid NOT NULL,
    page_index integer,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.document_chunks OWNER TO neondb_owner;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.documents (
    id character varying(30) NOT NULL,
    title text,
    content text,
    file_type character varying(255) NOT NULL,
    filename text,
    total_char_count integer NOT NULL,
    total_line_count integer NOT NULL,
    metadata jsonb,
    pages jsonb,
    source_type text NOT NULL,
    source text NOT NULL,
    file_id text,
    user_id text NOT NULL,
    client_id text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.documents OWNER TO neondb_owner;

--
-- Name: embeddings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.embeddings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chunk_id uuid,
    embeddings public.vector(1024),
    model text,
    user_id text,
    client_id text
)
WITH (autovacuum_vacuum_scale_factor='0.02', autovacuum_vacuum_threshold='1000');


ALTER TABLE public.embeddings OWNER TO neondb_owner;

--
-- Name: file_chunks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.file_chunks (
    file_id character varying NOT NULL,
    chunk_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public.file_chunks OWNER TO neondb_owner;

--
-- Name: files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.files (
    id text NOT NULL,
    user_id text NOT NULL,
    file_type character varying(255) NOT NULL,
    name text NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    file_hash character varying(64),
    chunk_task_id uuid,
    embedding_task_id uuid,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text,
    source text
);


ALTER TABLE public.files OWNER TO neondb_owner;

--
-- Name: files_to_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.files_to_sessions (
    file_id text NOT NULL,
    session_id text NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public.files_to_sessions OWNER TO neondb_owner;

--
-- Name: generation_batches; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.generation_batches (
    id text NOT NULL,
    user_id text NOT NULL,
    generation_topic_id text NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    prompt text NOT NULL,
    width integer,
    height integer,
    ratio character varying(64),
    config jsonb,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.generation_batches OWNER TO neondb_owner;

--
-- Name: generation_topics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.generation_topics (
    id text NOT NULL,
    user_id text NOT NULL,
    title text,
    cover_url text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.generation_topics OWNER TO neondb_owner;

--
-- Name: generations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.generations (
    id text NOT NULL,
    user_id text NOT NULL,
    generation_batch_id character varying(64) NOT NULL,
    async_task_id uuid,
    file_id text,
    seed integer,
    asset jsonb,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.generations OWNER TO neondb_owner;

--
-- Name: global_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.global_files (
    hash_id character varying(64) NOT NULL,
    file_type character varying(255) NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    creator text
);


ALTER TABLE public.global_files OWNER TO neondb_owner;

--
-- Name: knowledge_base_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.knowledge_base_files (
    knowledge_base_id text NOT NULL,
    file_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public.knowledge_base_files OWNER TO neondb_owner;

--
-- Name: knowledge_bases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.knowledge_bases (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    avatar text,
    type text,
    user_id text NOT NULL,
    is_public boolean DEFAULT false,
    settings jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text
);


ALTER TABLE public.knowledge_bases OWNER TO neondb_owner;

--
-- Name: message_chunks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_chunks (
    message_id text NOT NULL,
    chunk_id uuid NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public.message_chunks OWNER TO neondb_owner;

--
-- Name: message_plugins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_plugins (
    id text NOT NULL,
    tool_call_id text,
    type text DEFAULT 'default'::text,
    api_name text,
    arguments text,
    identifier text,
    state jsonb,
    error jsonb,
    user_id text NOT NULL,
    client_id text
);


ALTER TABLE public.message_plugins OWNER TO neondb_owner;

--
-- Name: message_queries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_queries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id text NOT NULL,
    rewrite_query text,
    user_query text,
    embeddings_id uuid,
    user_id text NOT NULL,
    client_id text
);


ALTER TABLE public.message_queries OWNER TO neondb_owner;

--
-- Name: message_query_chunks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_query_chunks (
    id text NOT NULL,
    query_id uuid NOT NULL,
    chunk_id uuid NOT NULL,
    similarity numeric(6,5),
    user_id text NOT NULL
);


ALTER TABLE public.message_query_chunks OWNER TO neondb_owner;

--
-- Name: message_translates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_translates (
    id text NOT NULL,
    content text,
    "from" text,
    "to" text,
    user_id text NOT NULL,
    client_id text
);


ALTER TABLE public.message_translates OWNER TO neondb_owner;

--
-- Name: message_tts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_tts (
    id text NOT NULL,
    content_md5 text,
    file_id text,
    voice text,
    user_id text NOT NULL,
    client_id text
);


ALTER TABLE public.message_tts OWNER TO neondb_owner;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id text NOT NULL,
    role text NOT NULL,
    content text,
    model text,
    provider text,
    favorite boolean DEFAULT false,
    error jsonb,
    tools jsonb,
    trace_id text,
    observation_id text,
    user_id text NOT NULL,
    session_id text,
    topic_id text,
    parent_id text,
    quota_id text,
    agent_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    thread_id text,
    reasoning jsonb,
    search jsonb,
    metadata jsonb,
    group_id text,
    target_id text
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: messages_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages_files (
    file_id text NOT NULL,
    message_id text NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public.messages_files OWNER TO neondb_owner;

--
-- Name: monthly_usage_summary; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.monthly_usage_summary (
    user_id text NOT NULL,
    month character varying(7) NOT NULL,
    total_queries integer DEFAULT 0,
    total_tokens integer DEFAULT 0,
    total_cost_usd real DEFAULT 0,
    total_cost_vnd real DEFAULT 0,
    simple_queries integer DEFAULT 0,
    medium_queries integer DEFAULT 0,
    complex_queries integer DEFAULT 0,
    cheap_model_usage real DEFAULT 0,
    mid_tier_model_usage real DEFAULT 0,
    premium_model_usage real DEFAULT 0,
    subscription_tier character varying(20),
    budget_limit_vnd real,
    budget_used_vnd real DEFAULT 0,
    budget_remaining_vnd real,
    budget_warnings_sent integer DEFAULT 0,
    last_warning_at timestamp without time zone,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.monthly_usage_summary OWNER TO neondb_owner;

--
-- Name: nextauth_accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.nextauth_accounts (
    access_token text,
    expires_at integer,
    id_token text,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    scope text,
    session_state text,
    token_type text,
    type text NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.nextauth_accounts OWNER TO neondb_owner;

--
-- Name: nextauth_authenticators; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.nextauth_authenticators (
    counter integer NOT NULL,
    "credentialBackedUp" boolean NOT NULL,
    "credentialDeviceType" text NOT NULL,
    "credentialID" text NOT NULL,
    "credentialPublicKey" text NOT NULL,
    "providerAccountId" text NOT NULL,
    transports text,
    "userId" text NOT NULL
);


ALTER TABLE public.nextauth_authenticators OWNER TO neondb_owner;

--
-- Name: nextauth_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.nextauth_sessions (
    expires timestamp without time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public.nextauth_sessions OWNER TO neondb_owner;

--
-- Name: nextauth_verificationtokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.nextauth_verificationtokens (
    expires timestamp without time zone NOT NULL,
    identifier text NOT NULL,
    token text NOT NULL
);


ALTER TABLE public.nextauth_verificationtokens OWNER TO neondb_owner;

--
-- Name: oauth_handoffs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oauth_handoffs (
    id text NOT NULL,
    client character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth_handoffs OWNER TO neondb_owner;

--
-- Name: oidc_access_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_access_tokens (
    id character varying(255) NOT NULL,
    data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    user_id text NOT NULL,
    client_id character varying(255) NOT NULL,
    grant_id character varying(255),
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_access_tokens OWNER TO neondb_owner;

--
-- Name: oidc_authorization_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_authorization_codes (
    id character varying(255) NOT NULL,
    data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    user_id text NOT NULL,
    client_id character varying(255) NOT NULL,
    grant_id character varying(255),
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_authorization_codes OWNER TO neondb_owner;

--
-- Name: oidc_clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_clients (
    id character varying(255) NOT NULL,
    name text NOT NULL,
    description text,
    client_secret character varying(255),
    redirect_uris text[] NOT NULL,
    grants text[] NOT NULL,
    response_types text[] NOT NULL,
    scopes text[] NOT NULL,
    token_endpoint_auth_method character varying(20),
    application_type character varying(20),
    client_uri text,
    logo_uri text,
    policy_uri text,
    tos_uri text,
    is_first_party boolean DEFAULT false,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_clients OWNER TO neondb_owner;

--
-- Name: oidc_consents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_consents (
    user_id text NOT NULL,
    client_id character varying(255) NOT NULL,
    scopes text[] NOT NULL,
    expires_at timestamp with time zone,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_consents OWNER TO neondb_owner;

--
-- Name: oidc_device_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_device_codes (
    id character varying(255) NOT NULL,
    data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    user_id text,
    client_id character varying(255) NOT NULL,
    grant_id character varying(255),
    user_code character varying(255),
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_device_codes OWNER TO neondb_owner;

--
-- Name: oidc_grants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_grants (
    id character varying(255) NOT NULL,
    data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    user_id text NOT NULL,
    client_id character varying(255) NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_grants OWNER TO neondb_owner;

--
-- Name: oidc_interactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_interactions (
    id character varying(255) NOT NULL,
    data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_interactions OWNER TO neondb_owner;

--
-- Name: oidc_refresh_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_refresh_tokens (
    id character varying(255) NOT NULL,
    data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    user_id text NOT NULL,
    client_id character varying(255) NOT NULL,
    grant_id character varying(255),
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_refresh_tokens OWNER TO neondb_owner;

--
-- Name: oidc_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oidc_sessions (
    id character varying(255) NOT NULL,
    data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    user_id text NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_sessions OWNER TO neondb_owner;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id character varying(30) NOT NULL,
    order_code character varying(64) NOT NULL,
    description text,
    amount integer NOT NULL,
    currency character varying(8) DEFAULT 'VND'::character varying,
    gateway character varying(32) DEFAULT 'sepay'::character varying,
    status character varying(16) DEFAULT 'pending'::character varying NOT NULL,
    transaction_id character varying(64),
    reference_code character varying(128),
    transaction_date character varying(64),
    gateway_response jsonb,
    paid_at timestamp with time zone,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: playing_with_neon; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.playing_with_neon (
    id integer NOT NULL,
    name text NOT NULL,
    value real
);


ALTER TABLE public.playing_with_neon OWNER TO neondb_owner;

--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.playing_with_neon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playing_with_neon_id_seq OWNER TO neondb_owner;

--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.playing_with_neon_id_seq OWNED BY public.playing_with_neon.id;


--
-- Name: provider_costs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.provider_costs (
    id text NOT NULL,
    provider character varying(50) NOT NULL,
    model character varying(100) NOT NULL,
    input_cost_per_1k real NOT NULL,
    output_cost_per_1k real NOT NULL,
    effective_from timestamp without time zone NOT NULL,
    effective_to timestamp without time zone,
    currency character varying(3) DEFAULT 'USD'::character varying,
    notes text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.provider_costs OWNER TO neondb_owner;

--
-- Name: rag_eval_dataset_records; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rag_eval_dataset_records (
    id integer NOT NULL,
    dataset_id integer NOT NULL,
    ideal text,
    question text,
    reference_files text[],
    metadata jsonb,
    user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rag_eval_dataset_records OWNER TO neondb_owner;

--
-- Name: rag_eval_dataset_records_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.rag_eval_dataset_records ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rag_eval_dataset_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rag_eval_datasets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rag_eval_datasets (
    id integer NOT NULL,
    description text,
    name text NOT NULL,
    knowledge_base_id text,
    user_id text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rag_eval_datasets OWNER TO neondb_owner;

--
-- Name: rag_eval_datasets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.rag_eval_datasets ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rag_eval_datasets_id_seq
    START WITH 30000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rag_eval_evaluation_records; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rag_eval_evaluation_records (
    id integer NOT NULL,
    question text NOT NULL,
    answer text,
    context text[],
    ideal text,
    status text,
    error jsonb,
    language_model text,
    embedding_model text,
    question_embedding_id uuid,
    duration integer,
    dataset_record_id integer NOT NULL,
    evaluation_id integer NOT NULL,
    user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rag_eval_evaluation_records OWNER TO neondb_owner;

--
-- Name: rag_eval_evaluation_records_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.rag_eval_evaluation_records ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rag_eval_evaluation_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rag_eval_evaluations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rag_eval_evaluations (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    eval_records_url text,
    status text,
    error jsonb,
    dataset_id integer NOT NULL,
    knowledge_base_id text,
    language_model text,
    embedding_model text,
    user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rag_eval_evaluations OWNER TO neondb_owner;

--
-- Name: rag_eval_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.rag_eval_evaluations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rag_eval_evaluations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rbac_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rbac_permissions (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rbac_permissions OWNER TO neondb_owner;

--
-- Name: rbac_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.rbac_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.rbac_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rbac_role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rbac_role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rbac_role_permissions OWNER TO neondb_owner;

--
-- Name: rbac_roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rbac_roles (
    id integer NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.rbac_roles OWNER TO neondb_owner;

--
-- Name: rbac_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.rbac_roles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.rbac_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rbac_user_roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rbac_user_roles (
    user_id text NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone
);


ALTER TABLE public.rbac_user_roles OWNER TO neondb_owner;

--
-- Name: session_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session_groups (
    id text NOT NULL,
    name text NOT NULL,
    sort integer,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.session_groups OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    slug character varying(100) NOT NULL,
    title text,
    description text,
    avatar text,
    background_color text,
    type text DEFAULT 'agent'::text,
    user_id text NOT NULL,
    group_id text,
    pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: threads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.threads (
    id text NOT NULL,
    title text,
    type text NOT NULL,
    status text DEFAULT 'active'::text,
    topic_id text NOT NULL,
    source_message_id text NOT NULL,
    parent_thread_id text,
    user_id text NOT NULL,
    last_active_at timestamp with time zone DEFAULT now(),
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text
);


ALTER TABLE public.threads OWNER TO neondb_owner;

--
-- Name: topic_documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.topic_documents (
    document_id text NOT NULL,
    topic_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.topic_documents OWNER TO neondb_owner;

--
-- Name: topics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.topics (
    id text NOT NULL,
    session_id text,
    user_id text NOT NULL,
    favorite boolean DEFAULT false,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    history_summary text,
    metadata jsonb,
    group_id text
);


ALTER TABLE public.topics OWNER TO neondb_owner;

--
-- Name: unstructured_chunks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.unstructured_chunks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    text text,
    metadata jsonb,
    index integer,
    type character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_id character varying,
    composite_id uuid,
    user_id text,
    file_id character varying,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id text
);


ALTER TABLE public.unstructured_chunks OWNER TO neondb_owner;

--
-- Name: usage_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.usage_logs (
    id text NOT NULL,
    user_id text NOT NULL,
    session_id text,
    model character varying(100) NOT NULL,
    provider character varying(50) NOT NULL,
    input_tokens integer NOT NULL,
    output_tokens integer NOT NULL,
    total_tokens integer,
    cost_usd real NOT NULL,
    cost_vnd real NOT NULL,
    query_complexity character varying(20),
    query_category character varying(50),
    response_time_ms integer,
    metadata jsonb,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usage_logs OWNER TO neondb_owner;

--
-- Name: user_cost_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_cost_settings (
    user_id text NOT NULL,
    monthly_budget_vnd real DEFAULT 29000,
    daily_budget_vnd real,
    preferred_models jsonb,
    blocked_models jsonb,
    enable_cost_optimization boolean DEFAULT true,
    max_cost_per_query_vnd real DEFAULT 100,
    enable_budget_alerts boolean DEFAULT true,
    budget_alert_thresholds jsonb DEFAULT '{"warning": 75, "critical": 90, "emergency": 95}'::jsonb,
    email_alerts boolean DEFAULT true,
    in_app_alerts boolean DEFAULT true,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_cost_settings OWNER TO neondb_owner;

--
-- Name: user_installed_plugins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_installed_plugins (
    user_id text NOT NULL,
    identifier text NOT NULL,
    type text NOT NULL,
    manifest jsonb,
    settings jsonb,
    custom_params jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_installed_plugins OWNER TO neondb_owner;

--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_settings (
    id text NOT NULL,
    tts jsonb,
    key_vaults text,
    general jsonb,
    language_model jsonb,
    system_agent jsonb,
    default_agent jsonb,
    tool jsonb,
    hotkey jsonb
);


ALTER TABLE public.user_settings OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text,
    email text,
    avatar text,
    phone text,
    first_name text,
    last_name text,
    is_onboarded boolean DEFAULT false,
    clerk_created_at timestamp with time zone,
    preference jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
    email_verified_at timestamp with time zone,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: playing_with_neon id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.playing_with_neon ALTER COLUMN id SET DEFAULT nextval('public.playing_with_neon_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: neondb_owner
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	549e56b0ba274e55e8d6d40496df4edcc148bc12b44ea415289f491c604a86f2	1716982944425
2	9ea70cb786d78d09f9e5e209a589b6d2ff5be5b74625ab1c83e0a9de91d90ff7	1717153686544
3	3625c7a62b571655d2f5493818370b53cb84b8774da5c8fef8754b2d6423bdae	1717587734458
4	c95c3afdb9d99b84cc91fb93adad21d8f65f0989665bed91353779a99a7f8ae8	1718460779230
5	4e60c80a8712884180615dd6659e6a1b54f5a502a67038d4a1ba144fe9efaa46	1721724512422
6	388346d588b45b08397cff3dce69914dd0d1675a571149e1a724a637c589478c	1722944166657
7	1ca1f899ef511a493be9048c82e5ebb26ee6a6932e8847b74f82920f26e30084	1724089032064
8	5aeb17c5564576cf873564514f3450d529d89bcd9ca2dd4c7f55df6852ddcd0c	1724254147447
9	b1dd0c4bd43efc33b68ff3c5383c435eb62afcd0fdc6cd5994a90d98e25de69a	1725366565650
10	eea3a1d9206e41b108d3b4bda2d8e36927ec025f77eb7199c018b63d64093d6a	1729699958471
11	605305371f634d926b5f7010954c4b8f5157f5b947a02ba52b5440a223727a6a	1730900133049
12	93c4e9258670dc0d900c6c22b3b7dc7f0cedc79d845d122657b514f08e69834a	1731138670427
13	4e95e545e10595a821873340eb2be4ce29a31d4887d6eab5c57e9122af9b18e9	1731858381716
14	47efcf4a847b449b05ab135f7c4a4ebbc75a4eaed26cd6ead73b47a6a2d58a49	1735834653361
15	2cb36ae4fcdd7b7064767e04bfbb36ae34518ff4bb1b39006f2dd394d1893868	1737609172353
16	47ab68be1ccab95d4a4c42c77e9ea48e5c78671c2401363fb37707c820144c40	1739901891891
17	7ed6b64348b01e0eb47b40356ec6bf180795b6fec28add5939db86e5df79b108	1741844738677
18	4b794e5b93941806fae80dabc1d400df5ab762d123a60dceac1905929aca62e2	1742269437903
19	0c9a130076a59f554113eb3190201cb8d34e2b07f3f5cbf81264d9dc89a01427	1742616026643
20	4e776e126dc1918dd3de74c26d1af5360657cb0c29addafa6d3000e5f6aa48ce	1742806552131
21	cd21a4a1778f937d5eecc8d4738f20996f601ec27eb838a68d0e52f32e265ee8	1744458287757
22	8ea53d4daddc8a7040a325f126c70d9223fc73c518f837fff3b1501caf32890c	1744602998656
23	93c4dd1f1ec8e69a0c66a4cf42dd8c81672273a77c940aa8e3534a9335d09bdc	1746724476380
24	0ab6461f834cdf0ccf59d3e0ea7a602495e0d8b4c472904d2fa15b02a3906cb2	1748925630721
25	17e740d5f5260b2e60b3fd289a59de3e02514effd6518d3d84136518b366ea82	1749301573666
26	39cea379f08ee4cb944875c0b67f7791387b508c2d47958bb4cd501ed1ef33eb	1749309388370
27	d33dbf295e10f93339e5abf1200ce81340e0ec9f9c88ddae077105433dca8bde	1752212281564
28	12fa40b26896b066d5fc9fe0fe6fd58f74644b0021264fa8912d37d0fc8dcc58	1752413805765
29	1e74e071045d826a478c69f5cff786c88077b5e0e630b57b4f6c9e5a3275c0a7	1752567402506
30	c563fd4707950289f6ca50891ac3d67d1cad36aeab73fdd93711c7e92759d724	1753201379817
31	9e48f8973ee4ff918072064511589e62969fe2df8b88855af71a0adc603821a9	1756298669289
32	ac99ac80a81f45334e05991333d518389f2344cd8646d5af0da1fcc4ab1b8e63	1757951755250
33	bafc1c74796a4c69342e61d28997b0e3a38f1e7d022ba92d9cbf31e00b5748c8	1757993755131
34	ce04ef4cde2db479d28ff08dced8383052c5052c904bab8343b5493fa10b0679	1758012348218
35	6dafde10225862dae54cf2791a2482cafbe426fac12de06441ce3d45e9302284	1758959395525
\.


--
-- Data for Name: users_sync; Type: TABLE DATA; Schema: neon_auth; Owner: neondb_owner
--

COPY neon_auth.users_sync (raw_json, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agents (id, slug, title, description, tags, avatar, background_color, plugins, user_id, chat_config, few_shots, model, params, provider, system_role, tts, created_at, updated_at, accessed_at, client_id, opening_message, opening_questions) FROM stdin;
agt_MgaAUi3rhRAS	price-nose-basis-happened	\N	\N	[]	\N	\N	[]	user_2g7np7Hrk0SN6kj5EDMLDaKNL0S	{"searchMode": "off", "displayMode": "chat", "historyCount": 20, "searchFCModel": {"model": "gpt-5-mini", "provider": "openai"}, "enableReasoning": false, "enableStreaming": true, "enableHistoryCount": true, "reasoningBudgetToken": 1024, "enableAutoCreateTopic": true, "enableCompressHistory": true, "autoCreateTopicThreshold": 2}	\N	gpt-5-mini	{"top_p": 1, "temperature": 1, "presence_penalty": 0, "frequency_penalty": 0}	openai		{"voice": {"openai": "alloy"}, "sttLocale": "auto", "ttsService": "openai", "showAllLocaleVoice": false}	2025-09-20 06:51:22.815+00	2025-09-20 06:51:22.815+00	2025-09-20 06:51:22.484513+00	\N	\N	{}
agt_jUN35RhVX4FA	stop-become-current-ruler	\N	\N	[]	\N	\N	[]	user_32x9CEJT5wKD1i1IGLjwM7sMd1v	{"searchMode": "off", "displayMode": "chat", "historyCount": 20, "searchFCModel": {"model": "gpt-5-mini", "provider": "openai"}, "enableReasoning": false, "enableStreaming": true, "enableHistoryCount": true, "reasoningBudgetToken": 1024, "enableAutoCreateTopic": true, "enableCompressHistory": true, "autoCreateTopicThreshold": 2}	\N	gpt-5-mini	{"top_p": 1, "temperature": 1, "presence_penalty": 0, "frequency_penalty": 0}	openai		{"voice": {"openai": "alloy"}, "sttLocale": "auto", "ttsService": "openai", "showAllLocaleVoice": false}	2025-09-20 06:53:50.123+00	2025-09-20 06:53:50.123+00	2025-09-20 06:53:49.80275+00	\N	\N	{}
agt_OHiPxoXVovT6	should-newspaper-today-distant	\N	\N	[]	\N	\N	[]	user_33HKLL8pPaIpyawymwQRlz7xBE7	{"searchMode": "off", "displayMode": "chat", "historyCount": 20, "searchFCModel": {"model": "gpt-5-mini", "provider": "openai"}, "enableReasoning": false, "enableStreaming": true, "enableHistoryCount": true, "reasoningBudgetToken": 1024, "enableAutoCreateTopic": true, "enableCompressHistory": true, "autoCreateTopicThreshold": 2}	\N	gpt-5-mini	{"top_p": 1, "temperature": 1, "presence_penalty": 0, "frequency_penalty": 0}	openai		{"voice": {"openai": "alloy"}, "sttLocale": "auto", "ttsService": "openai", "showAllLocaleVoice": false}	2025-09-27 13:33:19.534+00	2025-09-27 13:33:19.534+00	2025-09-27 13:33:19.418319+00	\N	\N	{}
agt_Je0ImhAiHazI	castle-member-satisfied-late	\N	\N	[]	\N	\N	[]	user_32V7733qArI3DRSOxw6dJ6l1Idp	{"searchMode": "off", "displayMode": "chat", "historyCount": 20, "searchFCModel": {"model": "gpt-5-mini", "provider": "openai"}, "enableReasoning": false, "enableStreaming": true, "enableHistoryCount": true, "reasoningBudgetToken": 1024, "enableAutoCreateTopic": true, "enableCompressHistory": true, "autoCreateTopicThreshold": 2}	\N	gpt-5-mini	{"top_p": 1, "temperature": 1, "presence_penalty": 0, "frequency_penalty": 0}	openai		{"voice": {"openai": "alloy"}, "sttLocale": "auto", "ttsService": "openai", "showAllLocaleVoice": false}	2025-09-26 13:46:01.903+00	2025-09-26 13:46:01.903+00	2025-09-26 13:46:01.784834+00	\N	\N	{}
agt_7SHwDJURfC7U	apart-automobile-tired-straw	Phân tích Ý tưởng Thiết kế	Giúp bạn nhận diện và phân tích ý tưởng thiết kế kiến trúc	["arch"]	🤯	\N	[]	user_32V7733qArI3DRSOxw6dJ6l1Idp	{"searchMode": "off", "displayMode": "chat", "historyCount": 20, "searchFCModel": {"model": "gpt-5-mini", "provider": "openai"}, "enableReasoning": false, "enableStreaming": true, "enableHistoryCount": true, "reasoningBudgetToken": 1024, "enableAutoCreateTopic": true, "enableCompressHistory": true, "autoCreateTopicThreshold": 2}	\N	gpt-5-mini	{"top_p": 1, "temperature": 1, "presence_penalty": 0, "frequency_penalty": 0}	openai	Xin bạn hãy đóng vai một kiến trúc sư chuyên nghiệp, viết phân tích ý tưởng thiết kế kiến trúc chuyên sâu cho tôi.\nTôi sẽ cung cấp cho bạn một hình ảnh phối cảnh kiến trúc.\nSau đó cung cấp cho bạn một số thông tin nền về dự án.\nCuối cùng cung cấp cho bạn một số từ khóa.\nBạn sẽ sử dụng các phần này để tổng hợp tạo ra một bản phân tích ý tưởng thiết kế kiến trúc hoàn chỉnh, mang tính nghệ thuật và chuyên nghiệp.\nPhân tích ý tưởng thiết kế cần được thực hiện từ các góc độ sau: “Ý tưởng thiết kế và nguồn cảm hứng: Phân tích ý tưởng cốt lõi và nguồn cảm hứng của thiết kế kiến trúc, hiểu được ý định ban đầu của nhà thiết kế và điểm khởi đầu sáng tạo. Bao gồm việc khám phá câu chuyện đằng sau thiết kế, ảnh hưởng của văn hóa, lịch sử hoặc yếu tố thiên nhiên.\nChức năng và bố cục không gian: Phân tích từ góc độ chức năng cách kiến trúc đáp ứng nhu cầu sử dụng, bao gồm tính hợp lý của bố cục không gian, hiệu quả sử dụng không gian, và cách giải quyết các yêu cầu chức năng đặc thù.\nHình thức và thẩm mỹ: Xem xét thiết kế hình thái kiến trúc, biểu đạt thẩm mỹ và tác động thị giác, bao gồm tỷ lệ, đường nét, vật liệu, màu sắc và mối quan hệ với môi trường xung quanh.\nTính bền vững và thích ứng môi trường: Phân tích hiệu quả bảo vệ môi trường, sử dụng năng lượng, lựa chọn vật liệu, khám phá cách đạt được mục tiêu phát triển bền vững, bao gồm chiến lược thân thiện sinh thái, biện pháp tiết kiệm năng lượng và giảm phát thải.\nKỹ thuật và đổi mới: Khám phá các công nghệ mới, vật liệu mới và phương pháp cấu trúc sáng tạo trong thiết kế kiến trúc, phân tích cách các kỹ thuật và đổi mới này hiện thực hóa ý tưởng thiết kế, nâng cao hiệu suất công trình.\nHiệu quả kinh tế và kiểm soát chi phí: Phân tích hiệu quả kinh tế của dự án kiến trúc, bao gồm kiểm soát chi phí, tỷ suất hoàn vốn và chi phí vận hành bảo trì.”\n	{"voice": {"openai": "alloy"}, "sttLocale": "auto", "ttsService": "openai", "showAllLocaleVoice": false}	2025-09-27 08:45:09.103+00	2025-09-27 08:45:09.103+00	2025-09-27 08:45:08.99907+00	\N	Xin chào! Tôi là chuyên gia phân tích ý tưởng thiết kế kiến trúc của bạn. Bạn có thể tải lên hình ảnh phối cảnh kiến trúc và cung cấp cho tôi thông tin nền dự án cùng các từ khóa, tôi sẽ cung cấp cho bạn phân tích ý tưởng thiết kế chi tiết và chuyên nghiệp, bao gồm cảm hứng thiết kế, bố cục chức năng, biểu đạt thẩm mỹ, tính bền vững, đổi mới kỹ thuật và hiệu quả kinh tế, giúp bạn hiểu sâu và thể hiện giá trị cốt lõi của thiết kế kiến trúc.	{"Bạn muốn phân tích loại thiết kế kiến trúc nào?","Xin cho tôi biết thông tin nền dự án và các từ khóa chính.","Bạn muốn tìm hiểu những khía cạnh nào của ý tưởng thiết kế?","Bạn có thể cung cấp hình ảnh phối cảnh kiến trúc không?"}
agt_hh7jJ2c9cDhN	die-breath-recall-heat	\N	\N	[]	\N	\N	["lobe-artifacts"]	user_32V7733qArI3DRSOxw6dJ6l1Idp	{"searchMode": "auto", "displayMode": "chat", "historyCount": 20, "searchFCModel": {"model": "gpt-5-mini", "provider": "openai"}, "enableReasoning": false, "enableStreaming": true, "enableHistoryCount": true, "reasoningBudgetToken": 1024, "enableAutoCreateTopic": true, "enableCompressHistory": true, "autoCreateTopicThreshold": 2}	\N	gpt-5	{"top_p": 1, "temperature": 1, "presence_penalty": 0, "frequency_penalty": 0}	openai		{"voice": {"openai": "alloy"}, "sttLocale": "auto", "ttsService": "openai", "showAllLocaleVoice": false}	2025-09-26 13:32:55.469+00	2025-09-26 13:32:55.469+00	2025-09-26 13:32:55.121+00	\N	\N	{}
agt_VJHacXW1hD0R	degree-progress-introduced-look	\N	\N	[]	\N	\N	[]	user_33HKLL8pPaIpyawymwQRlz7xBE7	{"searchMode": "off", "displayMode": "chat", "historyCount": 20, "searchFCModel": {"model": "gpt-5-mini", "provider": "openai"}, "enableReasoning": false, "enableStreaming": true, "enableHistoryCount": true, "reasoningBudgetToken": 1024, "enableAutoCreateTopic": true, "enableCompressHistory": true, "autoCreateTopicThreshold": 2}	\N	gpt-5-mini	{"top_p": 1, "temperature": 1, "presence_penalty": 0, "frequency_penalty": 0}	openai		{"voice": {"openai": "alloy"}, "sttLocale": "auto", "ttsService": "openai", "showAllLocaleVoice": false}	2025-09-27 10:21:43.603+00	2025-09-27 10:21:43.603+00	2025-09-27 10:21:43.272328+00	\N	\N	{}
\.


--
-- Data for Name: agents_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agents_files (file_id, agent_id, enabled, user_id, created_at, updated_at, accessed_at) FROM stdin;
\.


--
-- Data for Name: agents_knowledge_bases; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agents_knowledge_bases (agent_id, knowledge_base_id, user_id, enabled, created_at, updated_at, accessed_at) FROM stdin;
\.


--
-- Data for Name: agents_to_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agents_to_sessions (agent_id, session_id, user_id) FROM stdin;
agt_MgaAUi3rhRAS	ssn_qfnqvahIIuw2	user_2g7np7Hrk0SN6kj5EDMLDaKNL0S
agt_jUN35RhVX4FA	ssn_0x9J3cUtVplf	user_32x9CEJT5wKD1i1IGLjwM7sMd1v
agt_hh7jJ2c9cDhN	ssn_x6vpUaCqJUT0	user_32V7733qArI3DRSOxw6dJ6l1Idp
agt_Je0ImhAiHazI	ssn_AJRIatyri1tz	user_32V7733qArI3DRSOxw6dJ6l1Idp
agt_7SHwDJURfC7U	ssn_D3KpHu2ZqEuR	user_32V7733qArI3DRSOxw6dJ6l1Idp
agt_VJHacXW1hD0R	ssn_LS7MnezVpAUf	user_33HKLL8pPaIpyawymwQRlz7xBE7
agt_OHiPxoXVovT6	ssn_rxUwdOnVE798	user_33HKLL8pPaIpyawymwQRlz7xBE7
\.


--
-- Data for Name: ai_models; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_models (id, display_name, description, organization, enabled, provider_id, type, sort, user_id, pricing, parameters, config, abilities, context_window_tokens, source, released_at, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_providers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_providers (id, name, user_id, sort, enabled, fetch_on_client, check_model, logo, description, key_vaults, source, settings, accessed_at, created_at, updated_at, config) FROM stdin;
openai	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	\N	\N	\N	\N	\N	576c2af41360aa37f8ddc4be:42c1baf6b6e82a8ed69e91beba6c75f6:896b	builtin	{}	2025-09-26 13:35:19.44344+00	2025-09-26 13:35:19.44344+00	2025-09-27 06:37:53.142+00	{}
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_keys (id, name, key, enabled, expires_at, last_used_at, user_id, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: async_tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.async_tasks (id, type, status, error, user_id, duration, created_at, updated_at, accessed_at) FROM stdin;
af2abd59-f14a-4b9b-a284-80d81e9ab01a	image_generation	error	{"body": {"detail": "Invalid provider API key, please check your API key"}, "name": "InvalidProviderAPIKey"}	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	2025-09-26 13:47:27.884169+00	2025-09-26 13:47:31.325+00	2025-09-26 13:47:27.884169+00
10b17d33-44eb-42cf-884f-be60cec4eb11	image_generation	error	{"body": {"detail": "Invalid provider API key, please check your API key"}, "name": "InvalidProviderAPIKey"}	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	2025-09-26 13:47:27.884169+00	2025-09-26 13:47:32.691+00	2025-09-26 13:47:27.884169+00
729fe378-7592-43aa-86a3-3a3ad234ad0d	image_generation	error	{"body": {"detail": "Invalid provider API key, please check your API key"}, "name": "InvalidProviderAPIKey"}	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	2025-09-26 13:47:27.884169+00	2025-09-26 13:47:33.518+00	2025-09-26 13:47:27.884169+00
c39231cb-c911-4f8b-914a-25cdc92c8f3c	image_generation	error	{"body": {"detail": "Invalid provider API key, please check your API key"}, "name": "InvalidProviderAPIKey"}	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	2025-09-26 13:47:27.884169+00	2025-09-26 13:47:34.412+00	2025-09-26 13:47:27.884169+00
\.


--
-- Data for Name: chat_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_groups (id, title, description, config, client_id, user_id, pinned, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_groups_agents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_groups_agents (chat_group_id, agent_id, user_id, enabled, "order", role, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chunks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chunks (id, text, abstract, metadata, index, type, created_at, updated_at, user_id, accessed_at, client_id) FROM stdin;
\.


--
-- Data for Name: document_chunks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.document_chunks (document_id, chunk_id, page_index, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.documents (id, title, content, file_type, filename, total_char_count, total_line_count, metadata, pages, source_type, source, file_id, user_id, client_id, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: embeddings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.embeddings (id, chunk_id, embeddings, model, user_id, client_id) FROM stdin;
\.


--
-- Data for Name: file_chunks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.file_chunks (file_id, chunk_id, created_at, user_id) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.files (id, user_id, file_type, name, size, url, metadata, created_at, updated_at, file_hash, chunk_task_id, embedding_task_id, accessed_at, client_id, source) FROM stdin;
\.


--
-- Data for Name: files_to_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.files_to_sessions (file_id, session_id, user_id) FROM stdin;
\.


--
-- Data for Name: generation_batches; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.generation_batches (id, user_id, generation_topic_id, provider, model, prompt, width, height, ratio, config, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: generation_topics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.generation_topics (id, user_id, title, cover_url, accessed_at, created_at, updated_at) FROM stdin;
gt_YVx3Q3fvGHoq	user_32V7733qArI3DRSOxw6dJ6l1Idp	fasdfas	\N	2025-09-26 13:47:26.750114+00	2025-09-26 13:47:26.750114+00	2025-09-26 13:47:28.452+00
\.


--
-- Data for Name: generations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.generations (id, user_id, generation_batch_id, async_task_id, file_id, seed, asset, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: global_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.global_files (hash_id, file_type, size, url, metadata, created_at, accessed_at, creator) FROM stdin;
\.


--
-- Data for Name: knowledge_base_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.knowledge_base_files (knowledge_base_id, file_id, created_at, user_id) FROM stdin;
\.


--
-- Data for Name: knowledge_bases; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.knowledge_bases (id, name, description, avatar, type, user_id, is_public, settings, created_at, updated_at, accessed_at, client_id) FROM stdin;
\.


--
-- Data for Name: message_chunks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_chunks (message_id, chunk_id, user_id) FROM stdin;
\.


--
-- Data for Name: message_plugins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_plugins (id, tool_call_id, type, api_name, arguments, identifier, state, error, user_id, client_id) FROM stdin;
\.


--
-- Data for Name: message_queries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_queries (id, message_id, rewrite_query, user_query, embeddings_id, user_id, client_id) FROM stdin;
\.


--
-- Data for Name: message_query_chunks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_query_chunks (id, query_id, chunk_id, similarity, user_id) FROM stdin;
\.


--
-- Data for Name: message_translates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_translates (id, content, "from", "to", user_id, client_id) FROM stdin;
\.


--
-- Data for Name: message_tts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_tts (id, content_md5, file_id, voice, user_id, client_id) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, role, content, model, provider, favorite, error, tools, trace_id, observation_id, user_id, session_id, topic_id, parent_id, quota_id, agent_id, created_at, updated_at, client_id, accessed_at, thread_id, reasoning, search, metadata, group_id, target_id) FROM stdin;
msg_yR8KdUOiCQmJAV	user	tạo cho tôi kế hoạch kiếm 100tr/tháng	\N	\N	f	\N	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	tpc_5XprXgL0Ujgv	\N	\N	\N	2025-09-26 13:34:33.036694+00	2025-09-26 13:34:33.036694+00	\N	2025-09-26 13:34:33.036694+00	\N	\N	\N	\N	\N	\N
msg_VOlGQJvARgNSJw	assistant	...	gpt-5	openai	f	{"body": {"error": {"errorType": "InvalidProviderAPIKey"}, "provider": "openai"}, "type": "InvalidProviderAPIKey", "message": "{{provider}} API Key is incorrect or empty, please check your {{provider}} API Key and try again"}	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	tpc_5XprXgL0Ujgv	msg_yR8KdUOiCQmJAV	\N	\N	2025-09-26 13:34:33.712431+00	2025-09-26 13:34:38.853+00	\N	2025-09-26 13:34:33.712431+00	\N	\N	\N	\N	\N	\N
msg_gW0xOeFYTDVhts	user	phân tích lão hacj	\N	\N	f	\N	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	tpc_MZPdoiyG6Jw0	\N	\N	\N	2025-09-27 06:36:59.874906+00	2025-09-27 06:36:59.874906+00	\N	2025-09-27 06:36:59.874906+00	\N	\N	\N	\N	\N	\N
msg_TsInqjMUBPVyqC	assistant	...	gpt-5	openai	f	{"body": {"error": {"errorType": "InvalidProviderAPIKey"}, "provider": "openai"}, "type": "InvalidProviderAPIKey", "message": "{{provider}} API Key không hợp lệ hoặc trống, vui lòng kiểm tra và thử lại"}	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	tpc_MZPdoiyG6Jw0	msg_gW0xOeFYTDVhts	\N	\N	2025-09-27 06:37:00.529931+00	2025-09-27 06:37:05.052+00	\N	2025-09-27 06:37:00.529931+00	\N	\N	\N	\N	\N	\N
msg_BWn3MHMgVkPD55	user	sdsadasd	\N	\N	f	\N	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	tpc_6UKVyCParyml	\N	\N	\N	2025-09-27 06:42:05.501747+00	2025-09-27 06:42:05.501747+00	\N	2025-09-27 06:42:05.501747+00	\N	\N	\N	\N	\N	\N
msg_1vJcPdyqX9yZzD	assistant	...	deepseek-r1	ollama	f	{"body": {"error": {"message": "please check whether your ollama service is available"}, "provider": "ollama"}, "type": "OllamaServiceUnavailable", "message": "Dịch vụ Ollama không khả dụng, vui lòng kiểm tra xem Ollama có hoạt động bình thường không, hoặc xem xét cấu hình chéo đúng của Ollama"}	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	tpc_6UKVyCParyml	msg_BWn3MHMgVkPD55	\N	\N	2025-09-27 06:42:06.163275+00	2025-09-27 06:42:10.516+00	\N	2025-09-27 06:42:06.163275+00	\N	\N	\N	\N	\N	\N
msg_aaNmwxOKAi1lR9	user	cafdi ddawjt openai	\N	\N	f	\N	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	tpc_6UKVyCParyml	\N	\N	\N	2025-09-27 06:42:29.785939+00	2025-09-27 06:42:29.785939+00	\N	2025-09-27 06:42:29.785939+00	\N	\N	\N	\N	\N	\N
msg_qO0HDfDZqjnalR	assistant	...	gpt-5	openai	f	{"body": {"error": {"errorType": "InvalidProviderAPIKey"}, "provider": "openai"}, "type": "InvalidProviderAPIKey", "message": "{{provider}} API Key không hợp lệ hoặc trống, vui lòng kiểm tra và thử lại"}	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	tpc_6UKVyCParyml	msg_aaNmwxOKAi1lR9	\N	\N	2025-09-27 06:42:30.484229+00	2025-09-27 06:42:33.209+00	\N	2025-09-27 06:42:30.484229+00	\N	\N	\N	\N	\N	\N
msg_g0TQydZjRwWcVU	user	Bạn có thể cung cấp hình ảnh phối cảnh kiến trúc không?	\N	\N	f	\N	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	ssn_D3KpHu2ZqEuR	tpc_OUJYb630HlyR	\N	\N	\N	2025-09-27 08:45:43.430338+00	2025-09-27 08:45:43.430338+00	\N	2025-09-27 08:45:43.430338+00	\N	\N	\N	\N	\N	\N
msg_OtzBNd2FDCit1U	assistant	...	gpt-5-mini	openai	f	{"body": {"error": {"errorType": "InvalidProviderAPIKey"}, "provider": "openai"}, "type": "InvalidProviderAPIKey", "message": "{{provider}} API Key không hợp lệ hoặc trống, vui lòng kiểm tra và thử lại"}	\N	\N	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	ssn_D3KpHu2ZqEuR	tpc_OUJYb630HlyR	msg_g0TQydZjRwWcVU	\N	\N	2025-09-27 08:45:44.126767+00	2025-09-27 08:45:49.341+00	\N	2025-09-27 08:45:44.126767+00	\N	\N	\N	\N	\N	\N
msg_eS5L4WbKgVke2t	user	yo8ahoha	\N	\N	f	\N	\N	\N	\N	user_33HKLL8pPaIpyawymwQRlz7xBE7	\N	tpc_TtMgugPwLwaZ	\N	\N	\N	2025-09-27 10:24:48.203493+00	2025-09-27 10:24:48.203493+00	\N	2025-09-27 10:24:48.203493+00	\N	\N	\N	\N	\N	\N
msg_Apib8gTr4JR4Ww	assistant	...	gpt-5-mini	openai	f	{"body": {"error": {"errorType": "InvalidProviderAPIKey"}, "provider": "openai"}, "type": "InvalidProviderAPIKey", "message": "{{provider}} API Key không hợp lệ hoặc trống, vui lòng kiểm tra và thử lại"}	\N	\N	\N	user_33HKLL8pPaIpyawymwQRlz7xBE7	\N	tpc_TtMgugPwLwaZ	msg_eS5L4WbKgVke2t	\N	\N	2025-09-27 10:24:48.880176+00	2025-09-27 10:24:53.172+00	\N	2025-09-27 10:24:48.880176+00	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: messages_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages_files (file_id, message_id, user_id) FROM stdin;
\.


--
-- Data for Name: monthly_usage_summary; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.monthly_usage_summary (user_id, month, total_queries, total_tokens, total_cost_usd, total_cost_vnd, simple_queries, medium_queries, complex_queries, cheap_model_usage, mid_tier_model_usage, premium_model_usage, subscription_tier, budget_limit_vnd, budget_used_vnd, budget_remaining_vnd, budget_warnings_sent, last_warning_at, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nextauth_accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.nextauth_accounts (access_token, expires_at, id_token, provider, "providerAccountId", refresh_token, scope, session_state, token_type, type, "userId") FROM stdin;
\.


--
-- Data for Name: nextauth_authenticators; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.nextauth_authenticators (counter, "credentialBackedUp", "credentialDeviceType", "credentialID", "credentialPublicKey", "providerAccountId", transports, "userId") FROM stdin;
\.


--
-- Data for Name: nextauth_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.nextauth_sessions (expires, "sessionToken", "userId") FROM stdin;
\.


--
-- Data for Name: nextauth_verificationtokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.nextauth_verificationtokens (expires, identifier, token) FROM stdin;
\.


--
-- Data for Name: oauth_handoffs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oauth_handoffs (id, client, payload, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_access_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_access_tokens (id, data, expires_at, consumed_at, user_id, client_id, grant_id, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_authorization_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_authorization_codes (id, data, expires_at, consumed_at, user_id, client_id, grant_id, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_clients (id, name, description, client_secret, redirect_uris, grants, response_types, scopes, token_endpoint_auth_method, application_type, client_uri, logo_uri, policy_uri, tos_uri, is_first_party, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_consents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_consents (user_id, client_id, scopes, expires_at, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_device_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_device_codes (id, data, expires_at, consumed_at, user_id, client_id, grant_id, user_code, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_grants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_grants (id, data, expires_at, consumed_at, user_id, client_id, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_interactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_interactions (id, data, expires_at, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_refresh_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_refresh_tokens (id, data, expires_at, consumed_at, user_id, client_id, grant_id, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oidc_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oidc_sessions (id, data, expires_at, user_id, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (id, order_code, description, amount, currency, gateway, status, transaction_id, reference_code, transaction_date, gateway_response, paid_at, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: playing_with_neon; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.playing_with_neon (id, name, value) FROM stdin;
1	c4ca4238a0	0.06776021
2	c81e728d9d	0.6212495
3	eccbc87e4b	0.6231093
4	a87ff679a2	0.4582896
5	e4da3b7fbb	0.34895653
6	1679091c5a	0.6360281
7	8f14e45fce	0.6130209
8	c9f0f895fb	0.83822507
9	45c48cce2e	0.33038923
10	d3d9446802	0.10630727
\.


--
-- Data for Name: provider_costs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.provider_costs (id, provider, model, input_cost_per_1k, output_cost_per_1k, effective_from, effective_to, currency, notes, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rag_eval_dataset_records; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rag_eval_dataset_records (id, dataset_id, ideal, question, reference_files, metadata, user_id, created_at, accessed_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rag_eval_datasets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rag_eval_datasets (id, description, name, knowledge_base_id, user_id, updated_at, created_at, accessed_at) FROM stdin;
\.


--
-- Data for Name: rag_eval_evaluation_records; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rag_eval_evaluation_records (id, question, answer, context, ideal, status, error, language_model, embedding_model, question_embedding_id, duration, dataset_record_id, evaluation_id, user_id, created_at, accessed_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rag_eval_evaluations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rag_eval_evaluations (id, name, description, eval_records_url, status, error, dataset_id, knowledge_base_id, language_model, embedding_model, user_id, created_at, updated_at, accessed_at) FROM stdin;
\.


--
-- Data for Name: rbac_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rbac_permissions (id, code, name, description, category, is_active, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rbac_role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rbac_role_permissions (role_id, permission_id, created_at) FROM stdin;
\.


--
-- Data for Name: rbac_roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rbac_roles (id, name, display_name, description, is_system, is_active, accessed_at, created_at, updated_at, metadata) FROM stdin;
\.


--
-- Data for Name: rbac_user_roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rbac_user_roles (user_id, role_id, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: session_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session_groups (id, name, sort, user_id, created_at, updated_at, client_id, accessed_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (id, slug, title, description, avatar, background_color, type, user_id, group_id, pinned, created_at, updated_at, client_id, accessed_at) FROM stdin;
ssn_qfnqvahIIuw2	inbox	\N	\N	\N	\N	agent	user_2g7np7Hrk0SN6kj5EDMLDaKNL0S	\N	f	2025-09-20 06:51:23.062+00	2025-09-20 06:51:23.062+00	\N	2025-09-20 06:51:22.484513+00
ssn_0x9J3cUtVplf	inbox	\N	\N	\N	\N	agent	user_32x9CEJT5wKD1i1IGLjwM7sMd1v	\N	f	2025-09-20 06:53:50.338+00	2025-09-20 06:53:50.338+00	\N	2025-09-20 06:53:49.80275+00
ssn_x6vpUaCqJUT0	inbox	\N	\N	\N	\N	agent	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	f	2025-09-26 13:32:55.708+00	2025-09-26 13:32:55.708+00	\N	2025-09-26 13:32:55.121811+00
ssn_AJRIatyri1tz	entire-frequently	\N	\N	\N	\N	agent	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	f	2025-09-26 13:46:02.146+00	2025-09-26 13:46:02.146+00	\N	2025-09-26 13:46:01.784834+00
ssn_D3KpHu2ZqEuR	clearly-no	\N	\N	\N	\N	agent	user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	f	2025-09-27 08:45:09.336+00	2025-09-27 08:45:46.74+00	\N	2025-09-27 08:45:08.99907+00
ssn_LS7MnezVpAUf	inbox	\N	\N	\N	\N	agent	user_33HKLL8pPaIpyawymwQRlz7xBE7	\N	f	2025-09-27 10:21:43.828+00	2025-09-27 10:21:43.828+00	\N	2025-09-27 10:21:43.272328+00
ssn_rxUwdOnVE798	silly-school	\N	\N	\N	\N	agent	user_33HKLL8pPaIpyawymwQRlz7xBE7	\N	f	2025-09-27 13:33:19.779+00	2025-09-27 13:33:19.779+00	\N	2025-09-27 13:33:19.418319+00
\.


--
-- Data for Name: threads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.threads (id, title, type, status, topic_id, source_message_id, parent_thread_id, user_id, last_active_at, accessed_at, created_at, updated_at, client_id) FROM stdin;
\.


--
-- Data for Name: topic_documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.topic_documents (document_id, topic_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.topics (id, session_id, user_id, favorite, title, created_at, updated_at, client_id, accessed_at, history_summary, metadata, group_id) FROM stdin;
tpc_5XprXgL0Ujgv	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	f	Default Topic	2025-09-26 13:34:32.36361+00	2025-09-26 13:34:32.36361+00	\N	2025-09-26 13:34:32.36361+00	\N	\N	\N
tpc_MZPdoiyG6Jw0	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	f	Chủ đề mặc định	2025-09-27 06:36:59.216235+00	2025-09-27 06:36:59.216235+00	\N	2025-09-27 06:36:59.216235+00	\N	\N	\N
tpc_6UKVyCParyml	\N	user_32V7733qArI3DRSOxw6dJ6l1Idp	f	Chủ đề mặc định	2025-09-27 06:42:04.839877+00	2025-09-27 06:42:04.839877+00	\N	2025-09-27 06:42:04.839877+00	\N	\N	\N
tpc_OUJYb630HlyR	ssn_D3KpHu2ZqEuR	user_32V7733qArI3DRSOxw6dJ6l1Idp	f	Chủ đề mặc định	2025-09-27 08:45:42.740332+00	2025-09-27 08:45:42.740332+00	\N	2025-09-27 08:45:42.740332+00	\N	\N	\N
tpc_TtMgugPwLwaZ	\N	user_33HKLL8pPaIpyawymwQRlz7xBE7	f	Chủ đề mặc định	2025-09-27 10:24:47.529623+00	2025-09-27 10:24:47.529623+00	\N	2025-09-27 10:24:47.529623+00	\N	\N	\N
\.


--
-- Data for Name: unstructured_chunks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.unstructured_chunks (id, text, metadata, index, type, created_at, updated_at, parent_id, composite_id, user_id, file_id, accessed_at, client_id) FROM stdin;
\.


--
-- Data for Name: usage_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.usage_logs (id, user_id, session_id, model, provider, input_tokens, output_tokens, total_tokens, cost_usd, cost_vnd, query_complexity, query_category, response_time_ms, metadata, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_cost_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_cost_settings (user_id, monthly_budget_vnd, daily_budget_vnd, preferred_models, blocked_models, enable_cost_optimization, max_cost_per_query_vnd, enable_budget_alerts, budget_alert_thresholds, email_alerts, in_app_alerts, accessed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_installed_plugins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_installed_plugins (user_id, identifier, type, manifest, settings, custom_params, created_at, updated_at, accessed_at) FROM stdin;
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_settings (id, tts, key_vaults, general, language_model, system_agent, default_agent, tool, hotkey) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, email, avatar, phone, first_name, last_name, is_onboarded, clerk_created_at, preference, created_at, updated_at, full_name, email_verified_at, accessed_at) FROM stdin;
user_2g7np7Hrk0SN6kj5EDMLDaKNL0S	\N	\N	https://img.clerk.com/xxxxxx	\N	John	Doe	f	2024-05-28 08:00:00+00	{"guide": {"topic": true, "moveSettingsToAvatar": true}, "telemetry": null, "topicDisplayMode": "byTime", "useCmdEnterToSend": false}	2025-09-20 06:51:22.003496+00	2025-09-20 06:51:22.003496+00	\N	\N	2025-09-20 06:51:22.003496+00
user_32x9CEJT5wKD1i1IGLjwM7sMd1v	\N	aichacha6789@gmail.com	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zMng5Q0tabHRNWEJXcVp2bU05NVlRcHo2UE4ifQ	\N	Ai	Chacha	f	2025-09-20 06:53:46.974+00	{"guide": {"topic": true, "moveSettingsToAvatar": true}, "telemetry": null, "topicDisplayMode": "byTime", "useCmdEnterToSend": false}	2025-09-20 06:53:49.372694+00	2025-09-20 06:53:49.372694+00	\N	\N	2025-09-20 06:53:49.372694+00
user_32V7733qArI3DRSOxw6dJ6l1Idp	\N	thaohienhomes@gmail.com	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMlNMVlJPYmwxbFNsR09lbzFpVEhjYUVYWVgiLCJyaWQiOiJ1c2VyXzMyVjc3MzNxQXJJM0RSU094dzZkSjZsMUlkcCIsImluaXRpYWxzIjoiVCJ9	\N	Thảo Hiền Homes	\N	f	2025-09-10 08:41:54.352+00	{"guide": {"topic": true, "moveSettingsToAvatar": true}, "telemetry": false, "topicDisplayMode": "byTime", "useCmdEnterToSend": false}	2025-09-26 13:32:54.654384+00	2025-09-27 08:45:28.617+00	\N	\N	2025-09-26 13:32:54.654384+00
user_33HKLL8pPaIpyawymwQRlz7xBE7	\N	pho.chat89@gmail.com	https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMlNMVlJPYmwxbFNsR09lbzFpVEhjYUVYWVgiLCJyaWQiOiJ1c2VyXzMzSEtMTDhwUGFJcHlhd3ltd1FSbHo3eEJFNyJ9	\N	\N	\N	f	2025-09-27 10:21:40.123+00	{"guide": {"topic": true, "moveSettingsToAvatar": true}, "telemetry": null, "topicDisplayMode": "byTime", "useCmdEnterToSend": false}	2025-09-27 10:21:42.814006+00	2025-09-27 10:21:42.814006+00	\N	\N	2025-09-27 10:21:42.814006+00
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: neondb_owner
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 35, true);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, false);


--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.playing_with_neon_id_seq', 10, true);


--
-- Name: rag_eval_dataset_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rag_eval_dataset_records_id_seq', 1, false);


--
-- Name: rag_eval_datasets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rag_eval_datasets_id_seq', 30000, false);


--
-- Name: rag_eval_evaluation_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rag_eval_evaluation_records_id_seq', 1, false);


--
-- Name: rag_eval_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rag_eval_evaluations_id_seq', 1, false);


--
-- Name: rbac_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rbac_permissions_id_seq', 1, false);


--
-- Name: rbac_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rbac_roles_id_seq', 1, false);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: users_sync users_sync_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neondb_owner
--

ALTER TABLE ONLY neon_auth.users_sync
    ADD CONSTRAINT users_sync_pkey PRIMARY KEY (id);


--
-- Name: agents_files agents_files_file_id_agent_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_files
    ADD CONSTRAINT agents_files_file_id_agent_id_user_id_pk PRIMARY KEY (file_id, agent_id, user_id);


--
-- Name: agents_knowledge_bases agents_knowledge_bases_agent_id_knowledge_base_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_knowledge_bases
    ADD CONSTRAINT agents_knowledge_bases_agent_id_knowledge_base_id_pk PRIMARY KEY (agent_id, knowledge_base_id);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: agents agents_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_slug_unique UNIQUE (slug);


--
-- Name: agents_to_sessions agents_to_sessions_agent_id_session_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_to_sessions
    ADD CONSTRAINT agents_to_sessions_agent_id_session_id_pk PRIMARY KEY (agent_id, session_id);


--
-- Name: ai_models ai_models_id_provider_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_id_provider_id_user_id_pk PRIMARY KEY (id, provider_id, user_id);


--
-- Name: ai_providers ai_providers_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_providers
    ADD CONSTRAINT ai_providers_id_user_id_pk PRIMARY KEY (id, user_id);


--
-- Name: api_keys api_keys_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_unique UNIQUE (key);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: async_tasks async_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.async_tasks
    ADD CONSTRAINT async_tasks_pkey PRIMARY KEY (id);


--
-- Name: chat_groups_agents chat_groups_agents_chat_group_id_agent_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_groups_agents
    ADD CONSTRAINT chat_groups_agents_chat_group_id_agent_id_pk PRIMARY KEY (chat_group_id, agent_id);


--
-- Name: chat_groups chat_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_pkey PRIMARY KEY (id);


--
-- Name: chunks chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chunks
    ADD CONSTRAINT chunks_pkey PRIMARY KEY (id);


--
-- Name: document_chunks document_chunks_document_id_chunk_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_document_id_chunk_id_pk PRIMARY KEY (document_id, chunk_id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: embeddings embeddings_chunk_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.embeddings
    ADD CONSTRAINT embeddings_chunk_id_unique UNIQUE (chunk_id);


--
-- Name: embeddings embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.embeddings
    ADD CONSTRAINT embeddings_pkey PRIMARY KEY (id);


--
-- Name: file_chunks file_chunks_file_id_chunk_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.file_chunks
    ADD CONSTRAINT file_chunks_file_id_chunk_id_pk PRIMARY KEY (file_id, chunk_id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: messages_files files_to_messages_file_id_message_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages_files
    ADD CONSTRAINT files_to_messages_file_id_message_id_pk PRIMARY KEY (file_id, message_id);


--
-- Name: files_to_sessions files_to_sessions_file_id_session_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files_to_sessions
    ADD CONSTRAINT files_to_sessions_file_id_session_id_pk PRIMARY KEY (file_id, session_id);


--
-- Name: generation_batches generation_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generation_batches
    ADD CONSTRAINT generation_batches_pkey PRIMARY KEY (id);


--
-- Name: generation_topics generation_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generation_topics
    ADD CONSTRAINT generation_topics_pkey PRIMARY KEY (id);


--
-- Name: generations generations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_pkey PRIMARY KEY (id);


--
-- Name: global_files global_files_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.global_files
    ADD CONSTRAINT global_files_pkey PRIMARY KEY (hash_id);


--
-- Name: knowledge_base_files knowledge_base_files_knowledge_base_id_file_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_base_files
    ADD CONSTRAINT knowledge_base_files_knowledge_base_id_file_id_pk PRIMARY KEY (knowledge_base_id, file_id);


--
-- Name: knowledge_bases knowledge_bases_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_bases
    ADD CONSTRAINT knowledge_bases_pkey PRIMARY KEY (id);


--
-- Name: message_chunks message_chunks_chunk_id_message_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_chunks
    ADD CONSTRAINT message_chunks_chunk_id_message_id_pk PRIMARY KEY (chunk_id, message_id);


--
-- Name: message_plugins message_plugins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_plugins
    ADD CONSTRAINT message_plugins_pkey PRIMARY KEY (id);


--
-- Name: message_queries message_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_queries
    ADD CONSTRAINT message_queries_pkey PRIMARY KEY (id);


--
-- Name: message_query_chunks message_query_chunks_chunk_id_id_query_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_query_chunks
    ADD CONSTRAINT message_query_chunks_chunk_id_id_query_id_pk PRIMARY KEY (chunk_id, id, query_id);


--
-- Name: message_translates message_translates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_translates
    ADD CONSTRAINT message_translates_pkey PRIMARY KEY (id);


--
-- Name: message_tts message_tts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_tts
    ADD CONSTRAINT message_tts_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: monthly_usage_summary monthly_usage_summary_user_id_month_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.monthly_usage_summary
    ADD CONSTRAINT monthly_usage_summary_user_id_month_pk PRIMARY KEY (user_id, month);


--
-- Name: nextauth_accounts nextauth_accounts_provider_providerAccountId_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nextauth_accounts
    ADD CONSTRAINT "nextauth_accounts_provider_providerAccountId_pk" PRIMARY KEY (provider, "providerAccountId");


--
-- Name: nextauth_authenticators nextauth_authenticators_credentialID_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nextauth_authenticators
    ADD CONSTRAINT "nextauth_authenticators_credentialID_unique" UNIQUE ("credentialID");


--
-- Name: nextauth_authenticators nextauth_authenticators_userId_credentialID_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nextauth_authenticators
    ADD CONSTRAINT "nextauth_authenticators_userId_credentialID_pk" PRIMARY KEY ("userId", "credentialID");


--
-- Name: nextauth_sessions nextauth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nextauth_sessions
    ADD CONSTRAINT nextauth_sessions_pkey PRIMARY KEY ("sessionToken");


--
-- Name: nextauth_verificationtokens nextauth_verificationtokens_identifier_token_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nextauth_verificationtokens
    ADD CONSTRAINT nextauth_verificationtokens_identifier_token_pk PRIMARY KEY (identifier, token);


--
-- Name: oauth_handoffs oauth_handoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth_handoffs
    ADD CONSTRAINT oauth_handoffs_pkey PRIMARY KEY (id);


--
-- Name: oidc_access_tokens oidc_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_access_tokens
    ADD CONSTRAINT oidc_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: oidc_authorization_codes oidc_authorization_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_authorization_codes
    ADD CONSTRAINT oidc_authorization_codes_pkey PRIMARY KEY (id);


--
-- Name: oidc_clients oidc_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_clients
    ADD CONSTRAINT oidc_clients_pkey PRIMARY KEY (id);


--
-- Name: oidc_consents oidc_consents_user_id_client_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_consents
    ADD CONSTRAINT oidc_consents_user_id_client_id_pk PRIMARY KEY (user_id, client_id);


--
-- Name: oidc_device_codes oidc_device_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_device_codes
    ADD CONSTRAINT oidc_device_codes_pkey PRIMARY KEY (id);


--
-- Name: oidc_grants oidc_grants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_grants
    ADD CONSTRAINT oidc_grants_pkey PRIMARY KEY (id);


--
-- Name: oidc_interactions oidc_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_interactions
    ADD CONSTRAINT oidc_interactions_pkey PRIMARY KEY (id);


--
-- Name: oidc_refresh_tokens oidc_refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_refresh_tokens
    ADD CONSTRAINT oidc_refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: oidc_sessions oidc_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_sessions
    ADD CONSTRAINT oidc_sessions_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: playing_with_neon playing_with_neon_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.playing_with_neon
    ADD CONSTRAINT playing_with_neon_pkey PRIMARY KEY (id);


--
-- Name: provider_costs provider_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.provider_costs
    ADD CONSTRAINT provider_costs_pkey PRIMARY KEY (id);


--
-- Name: rag_eval_dataset_records rag_eval_dataset_records_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_dataset_records
    ADD CONSTRAINT rag_eval_dataset_records_pkey PRIMARY KEY (id);


--
-- Name: rag_eval_datasets rag_eval_datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_datasets
    ADD CONSTRAINT rag_eval_datasets_pkey PRIMARY KEY (id);


--
-- Name: rag_eval_evaluation_records rag_eval_evaluation_records_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluation_records
    ADD CONSTRAINT rag_eval_evaluation_records_pkey PRIMARY KEY (id);


--
-- Name: rag_eval_evaluations rag_eval_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluations
    ADD CONSTRAINT rag_eval_evaluations_pkey PRIMARY KEY (id);


--
-- Name: rbac_permissions rbac_permissions_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_permissions
    ADD CONSTRAINT rbac_permissions_code_unique UNIQUE (code);


--
-- Name: rbac_permissions rbac_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_permissions
    ADD CONSTRAINT rbac_permissions_pkey PRIMARY KEY (id);


--
-- Name: rbac_role_permissions rbac_role_permissions_role_id_permission_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_permission_id_pk PRIMARY KEY (role_id, permission_id);


--
-- Name: rbac_roles rbac_roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_name_unique UNIQUE (name);


--
-- Name: rbac_roles rbac_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_roles
    ADD CONSTRAINT rbac_roles_pkey PRIMARY KEY (id);


--
-- Name: rbac_user_roles rbac_user_roles_user_id_role_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_user_id_role_id_pk PRIMARY KEY (user_id, role_id);


--
-- Name: session_groups session_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_groups
    ADD CONSTRAINT session_groups_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: threads threads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);


--
-- Name: topic_documents topic_documents_document_id_topic_id_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topic_documents
    ADD CONSTRAINT topic_documents_document_id_topic_id_pk PRIMARY KEY (document_id, topic_id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: unstructured_chunks unstructured_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unstructured_chunks
    ADD CONSTRAINT unstructured_chunks_pkey PRIMARY KEY (id);


--
-- Name: usage_logs usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_pkey PRIMARY KEY (id);


--
-- Name: user_cost_settings user_cost_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_cost_settings
    ADD CONSTRAINT user_cost_settings_pkey PRIMARY KEY (user_id);


--
-- Name: user_installed_plugins user_installed_plugins_user_id_identifier_pk; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_installed_plugins
    ADD CONSTRAINT user_installed_plugins_user_id_identifier_pk PRIMARY KEY (user_id, identifier);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: users_sync_deleted_at_idx; Type: INDEX; Schema: neon_auth; Owner: neondb_owner
--

CREATE INDEX users_sync_deleted_at_idx ON neon_auth.users_sync USING btree (deleted_at);


--
-- Name: chat_groups_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX chat_groups_client_id_user_id_unique ON public.chat_groups USING btree (client_id, user_id);


--
-- Name: chunks_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX chunks_client_id_user_id_unique ON public.chunks USING btree (client_id, user_id);


--
-- Name: chunks_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX chunks_user_id_idx ON public.chunks USING btree (user_id);


--
-- Name: client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX client_id_user_id_unique ON public.agents USING btree (client_id, user_id);


--
-- Name: documents_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX documents_client_id_user_id_unique ON public.documents USING btree (client_id, user_id);


--
-- Name: documents_file_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX documents_file_id_idx ON public.documents USING btree (file_id);


--
-- Name: documents_file_type_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX documents_file_type_idx ON public.documents USING btree (file_type);


--
-- Name: documents_source_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX documents_source_idx ON public.documents USING btree (source);


--
-- Name: embeddings_chunk_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX embeddings_chunk_id_idx ON public.embeddings USING btree (chunk_id);


--
-- Name: embeddings_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX embeddings_client_id_user_id_unique ON public.embeddings USING btree (client_id, user_id);


--
-- Name: file_hash_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX file_hash_idx ON public.files USING btree (file_hash);


--
-- Name: files_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX files_client_id_user_id_unique ON public.files USING btree (client_id, user_id);


--
-- Name: knowledge_bases_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX knowledge_bases_client_id_user_id_unique ON public.knowledge_bases USING btree (client_id, user_id);


--
-- Name: message_client_id_user_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX message_client_id_user_unique ON public.messages USING btree (client_id, user_id);


--
-- Name: message_plugins_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX message_plugins_client_id_user_id_unique ON public.message_plugins USING btree (client_id, user_id);


--
-- Name: message_queries_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX message_queries_client_id_user_id_unique ON public.message_queries USING btree (client_id, user_id);


--
-- Name: message_translates_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX message_translates_client_id_user_id_unique ON public.message_translates USING btree (client_id, user_id);


--
-- Name: message_tts_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX message_tts_client_id_user_id_unique ON public.message_tts USING btree (client_id, user_id);


--
-- Name: messages_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at);


--
-- Name: messages_parent_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX messages_parent_id_idx ON public.messages USING btree (parent_id);


--
-- Name: messages_quota_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX messages_quota_id_idx ON public.messages USING btree (quota_id);


--
-- Name: messages_session_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX messages_session_id_idx ON public.messages USING btree (session_id);


--
-- Name: messages_thread_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX messages_thread_id_idx ON public.messages USING btree (thread_id);


--
-- Name: messages_topic_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX messages_topic_id_idx ON public.messages USING btree (topic_id);


--
-- Name: messages_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX messages_user_id_idx ON public.messages USING btree (user_id);


--
-- Name: payments_order_code_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX payments_order_code_unique ON public.payments USING btree (order_code);


--
-- Name: rbac_role_permissions_permission_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX rbac_role_permissions_permission_id_idx ON public.rbac_role_permissions USING btree (permission_id);


--
-- Name: rbac_role_permissions_role_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX rbac_role_permissions_role_id_idx ON public.rbac_role_permissions USING btree (role_id);


--
-- Name: rbac_user_roles_role_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX rbac_user_roles_role_id_idx ON public.rbac_user_roles USING btree (role_id);


--
-- Name: rbac_user_roles_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX rbac_user_roles_user_id_idx ON public.rbac_user_roles USING btree (user_id);


--
-- Name: session_groups_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX session_groups_client_id_user_id_unique ON public.session_groups USING btree (client_id, user_id);


--
-- Name: sessions_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX sessions_client_id_user_id_unique ON public.sessions USING btree (client_id, user_id);


--
-- Name: sessions_id_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX sessions_id_user_id_idx ON public.sessions USING btree (id, user_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: slug_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX slug_user_id_unique ON public.sessions USING btree (slug, user_id);


--
-- Name: threads_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX threads_client_id_user_id_unique ON public.threads USING btree (client_id, user_id);


--
-- Name: topics_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX topics_client_id_user_id_unique ON public.topics USING btree (client_id, user_id);


--
-- Name: topics_id_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX topics_id_user_id_idx ON public.topics USING btree (id, user_id);


--
-- Name: topics_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX topics_user_id_idx ON public.topics USING btree (user_id);


--
-- Name: unstructured_chunks_client_id_user_id_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX unstructured_chunks_client_id_user_id_unique ON public.unstructured_chunks USING btree (client_id, user_id);


--
-- Name: agents_files agents_files_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_files
    ADD CONSTRAINT agents_files_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agents_files agents_files_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_files
    ADD CONSTRAINT agents_files_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: agents_files agents_files_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_files
    ADD CONSTRAINT agents_files_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: agents_knowledge_bases agents_knowledge_bases_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_knowledge_bases
    ADD CONSTRAINT agents_knowledge_bases_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agents_knowledge_bases agents_knowledge_bases_knowledge_base_id_knowledge_bases_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_knowledge_bases
    ADD CONSTRAINT agents_knowledge_bases_knowledge_base_id_knowledge_bases_id_fk FOREIGN KEY (knowledge_base_id) REFERENCES public.knowledge_bases(id) ON DELETE CASCADE;


--
-- Name: agents_knowledge_bases agents_knowledge_bases_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_knowledge_bases
    ADD CONSTRAINT agents_knowledge_bases_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: agents_to_sessions agents_to_sessions_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_to_sessions
    ADD CONSTRAINT agents_to_sessions_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agents_to_sessions agents_to_sessions_session_id_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_to_sessions
    ADD CONSTRAINT agents_to_sessions_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: agents_to_sessions agents_to_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents_to_sessions
    ADD CONSTRAINT agents_to_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: agents agents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_models ai_models_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_providers ai_providers_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_providers
    ADD CONSTRAINT ai_providers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: async_tasks async_tasks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.async_tasks
    ADD CONSTRAINT async_tasks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_groups_agents chat_groups_agents_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_groups_agents
    ADD CONSTRAINT chat_groups_agents_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: chat_groups_agents chat_groups_agents_chat_group_id_chat_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_groups_agents
    ADD CONSTRAINT chat_groups_agents_chat_group_id_chat_groups_id_fk FOREIGN KEY (chat_group_id) REFERENCES public.chat_groups(id) ON DELETE CASCADE;


--
-- Name: chat_groups_agents chat_groups_agents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_groups_agents
    ADD CONSTRAINT chat_groups_agents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_groups chat_groups_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_groups
    ADD CONSTRAINT chat_groups_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chunks chunks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chunks
    ADD CONSTRAINT chunks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: document_chunks document_chunks_chunk_id_chunks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_chunk_id_chunks_id_fk FOREIGN KEY (chunk_id) REFERENCES public.chunks(id) ON DELETE CASCADE;


--
-- Name: document_chunks document_chunks_document_id_documents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_document_id_documents_id_fk FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_chunks document_chunks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE SET NULL;


--
-- Name: documents documents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: embeddings embeddings_chunk_id_chunks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.embeddings
    ADD CONSTRAINT embeddings_chunk_id_chunks_id_fk FOREIGN KEY (chunk_id) REFERENCES public.chunks(id) ON DELETE CASCADE;


--
-- Name: embeddings embeddings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.embeddings
    ADD CONSTRAINT embeddings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: file_chunks file_chunks_chunk_id_chunks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.file_chunks
    ADD CONSTRAINT file_chunks_chunk_id_chunks_id_fk FOREIGN KEY (chunk_id) REFERENCES public.chunks(id) ON DELETE CASCADE;


--
-- Name: file_chunks file_chunks_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.file_chunks
    ADD CONSTRAINT file_chunks_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: file_chunks file_chunks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.file_chunks
    ADD CONSTRAINT file_chunks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: files files_chunk_task_id_async_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_chunk_task_id_async_tasks_id_fk FOREIGN KEY (chunk_task_id) REFERENCES public.async_tasks(id) ON DELETE SET NULL;


--
-- Name: files files_embedding_task_id_async_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_embedding_task_id_async_tasks_id_fk FOREIGN KEY (embedding_task_id) REFERENCES public.async_tasks(id) ON DELETE SET NULL;


--
-- Name: files files_file_hash_global_files_hash_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_file_hash_global_files_hash_id_fk FOREIGN KEY (file_hash) REFERENCES public.global_files(hash_id);


--
-- Name: messages_files files_to_messages_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages_files
    ADD CONSTRAINT files_to_messages_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: messages_files files_to_messages_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages_files
    ADD CONSTRAINT files_to_messages_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: files_to_sessions files_to_sessions_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files_to_sessions
    ADD CONSTRAINT files_to_sessions_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: files_to_sessions files_to_sessions_session_id_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files_to_sessions
    ADD CONSTRAINT files_to_sessions_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: files_to_sessions files_to_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files_to_sessions
    ADD CONSTRAINT files_to_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: files files_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: generation_batches generation_batches_generation_topic_id_generation_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generation_batches
    ADD CONSTRAINT generation_batches_generation_topic_id_generation_topics_id_fk FOREIGN KEY (generation_topic_id) REFERENCES public.generation_topics(id) ON DELETE CASCADE;


--
-- Name: generation_batches generation_batches_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generation_batches
    ADD CONSTRAINT generation_batches_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: generation_topics generation_topics_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generation_topics
    ADD CONSTRAINT generation_topics_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: generations generations_async_task_id_async_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_async_task_id_async_tasks_id_fk FOREIGN KEY (async_task_id) REFERENCES public.async_tasks(id) ON DELETE SET NULL;


--
-- Name: generations generations_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: generations generations_generation_batch_id_generation_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_generation_batch_id_generation_batches_id_fk FOREIGN KEY (generation_batch_id) REFERENCES public.generation_batches(id) ON DELETE CASCADE;


--
-- Name: generations generations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.generations
    ADD CONSTRAINT generations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: global_files global_files_creator_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.global_files
    ADD CONSTRAINT global_files_creator_users_id_fk FOREIGN KEY (creator) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: knowledge_base_files knowledge_base_files_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_base_files
    ADD CONSTRAINT knowledge_base_files_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: knowledge_base_files knowledge_base_files_knowledge_base_id_knowledge_bases_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_base_files
    ADD CONSTRAINT knowledge_base_files_knowledge_base_id_knowledge_bases_id_fk FOREIGN KEY (knowledge_base_id) REFERENCES public.knowledge_bases(id) ON DELETE CASCADE;


--
-- Name: knowledge_base_files knowledge_base_files_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_base_files
    ADD CONSTRAINT knowledge_base_files_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: knowledge_bases knowledge_bases_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_bases
    ADD CONSTRAINT knowledge_bases_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_chunks message_chunks_chunk_id_chunks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_chunks
    ADD CONSTRAINT message_chunks_chunk_id_chunks_id_fk FOREIGN KEY (chunk_id) REFERENCES public.chunks(id) ON DELETE CASCADE;


--
-- Name: message_chunks message_chunks_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_chunks
    ADD CONSTRAINT message_chunks_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_chunks message_chunks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_chunks
    ADD CONSTRAINT message_chunks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_plugins message_plugins_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_plugins
    ADD CONSTRAINT message_plugins_id_messages_id_fk FOREIGN KEY (id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_plugins message_plugins_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_plugins
    ADD CONSTRAINT message_plugins_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_queries message_queries_embeddings_id_embeddings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_queries
    ADD CONSTRAINT message_queries_embeddings_id_embeddings_id_fk FOREIGN KEY (embeddings_id) REFERENCES public.embeddings(id) ON DELETE SET NULL;


--
-- Name: message_queries message_queries_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_queries
    ADD CONSTRAINT message_queries_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_queries message_queries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_queries
    ADD CONSTRAINT message_queries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_query_chunks message_query_chunks_chunk_id_chunks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_query_chunks
    ADD CONSTRAINT message_query_chunks_chunk_id_chunks_id_fk FOREIGN KEY (chunk_id) REFERENCES public.chunks(id) ON DELETE CASCADE;


--
-- Name: message_query_chunks message_query_chunks_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_query_chunks
    ADD CONSTRAINT message_query_chunks_id_messages_id_fk FOREIGN KEY (id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_query_chunks message_query_chunks_query_id_message_queries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_query_chunks
    ADD CONSTRAINT message_query_chunks_query_id_message_queries_id_fk FOREIGN KEY (query_id) REFERENCES public.message_queries(id) ON DELETE CASCADE;


--
-- Name: message_query_chunks message_query_chunks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_query_chunks
    ADD CONSTRAINT message_query_chunks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_translates message_translates_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_translates
    ADD CONSTRAINT message_translates_id_messages_id_fk FOREIGN KEY (id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_translates message_translates_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_translates
    ADD CONSTRAINT message_translates_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_tts message_tts_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_tts
    ADD CONSTRAINT message_tts_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: message_tts message_tts_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_tts
    ADD CONSTRAINT message_tts_id_messages_id_fk FOREIGN KEY (id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_tts message_tts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_tts
    ADD CONSTRAINT message_tts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: messages_files messages_files_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages_files
    ADD CONSTRAINT messages_files_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: messages_files messages_files_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages_files
    ADD CONSTRAINT messages_files_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: messages_files messages_files_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages_files
    ADD CONSTRAINT messages_files_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_group_id_chat_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_group_id_chat_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.chat_groups(id) ON DELETE SET NULL;


--
-- Name: messages messages_parent_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_parent_id_messages_id_fk FOREIGN KEY (parent_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_quota_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_quota_id_messages_id_fk FOREIGN KEY (quota_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_session_id_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: messages messages_thread_id_threads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_thread_id_threads_id_fk FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;


--
-- Name: messages messages_topic_id_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_topic_id_topics_id_fk FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: messages messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: monthly_usage_summary monthly_usage_summary_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.monthly_usage_summary
    ADD CONSTRAINT monthly_usage_summary_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: nextauth_accounts nextauth_accounts_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nextauth_accounts
    ADD CONSTRAINT "nextauth_accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: nextauth_authenticators nextauth_authenticators_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nextauth_authenticators
    ADD CONSTRAINT "nextauth_authenticators_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: nextauth_sessions nextauth_sessions_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nextauth_sessions
    ADD CONSTRAINT "nextauth_sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oidc_access_tokens oidc_access_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_access_tokens
    ADD CONSTRAINT oidc_access_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oidc_authorization_codes oidc_authorization_codes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_authorization_codes
    ADD CONSTRAINT oidc_authorization_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oidc_consents oidc_consents_client_id_oidc_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_consents
    ADD CONSTRAINT oidc_consents_client_id_oidc_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.oidc_clients(id) ON DELETE CASCADE;


--
-- Name: oidc_consents oidc_consents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_consents
    ADD CONSTRAINT oidc_consents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oidc_device_codes oidc_device_codes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_device_codes
    ADD CONSTRAINT oidc_device_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oidc_grants oidc_grants_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_grants
    ADD CONSTRAINT oidc_grants_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oidc_refresh_tokens oidc_refresh_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_refresh_tokens
    ADD CONSTRAINT oidc_refresh_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oidc_sessions oidc_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oidc_sessions
    ADD CONSTRAINT oidc_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rag_eval_dataset_records rag_eval_dataset_records_dataset_id_rag_eval_datasets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_dataset_records
    ADD CONSTRAINT rag_eval_dataset_records_dataset_id_rag_eval_datasets_id_fk FOREIGN KEY (dataset_id) REFERENCES public.rag_eval_datasets(id) ON DELETE CASCADE;


--
-- Name: rag_eval_dataset_records rag_eval_dataset_records_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_dataset_records
    ADD CONSTRAINT rag_eval_dataset_records_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rag_eval_datasets rag_eval_datasets_knowledge_base_id_knowledge_bases_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_datasets
    ADD CONSTRAINT rag_eval_datasets_knowledge_base_id_knowledge_bases_id_fk FOREIGN KEY (knowledge_base_id) REFERENCES public.knowledge_bases(id) ON DELETE CASCADE;


--
-- Name: rag_eval_datasets rag_eval_datasets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_datasets
    ADD CONSTRAINT rag_eval_datasets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rag_eval_evaluation_records rag_eval_evaluation_records_dataset_record_id_rag_eval_dataset_; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluation_records
    ADD CONSTRAINT rag_eval_evaluation_records_dataset_record_id_rag_eval_dataset_ FOREIGN KEY (dataset_record_id) REFERENCES public.rag_eval_dataset_records(id) ON DELETE CASCADE;


--
-- Name: rag_eval_evaluation_records rag_eval_evaluation_records_evaluation_id_rag_eval_evaluations_; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluation_records
    ADD CONSTRAINT rag_eval_evaluation_records_evaluation_id_rag_eval_evaluations_ FOREIGN KEY (evaluation_id) REFERENCES public.rag_eval_evaluations(id) ON DELETE CASCADE;


--
-- Name: rag_eval_evaluation_records rag_eval_evaluation_records_question_embedding_id_embeddings_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluation_records
    ADD CONSTRAINT rag_eval_evaluation_records_question_embedding_id_embeddings_id FOREIGN KEY (question_embedding_id) REFERENCES public.embeddings(id) ON DELETE SET NULL;


--
-- Name: rag_eval_evaluation_records rag_eval_evaluation_records_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluation_records
    ADD CONSTRAINT rag_eval_evaluation_records_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rag_eval_evaluations rag_eval_evaluations_dataset_id_rag_eval_datasets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluations
    ADD CONSTRAINT rag_eval_evaluations_dataset_id_rag_eval_datasets_id_fk FOREIGN KEY (dataset_id) REFERENCES public.rag_eval_datasets(id) ON DELETE CASCADE;


--
-- Name: rag_eval_evaluations rag_eval_evaluations_knowledge_base_id_knowledge_bases_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluations
    ADD CONSTRAINT rag_eval_evaluations_knowledge_base_id_knowledge_bases_id_fk FOREIGN KEY (knowledge_base_id) REFERENCES public.knowledge_bases(id) ON DELETE CASCADE;


--
-- Name: rag_eval_evaluations rag_eval_evaluations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rag_eval_evaluations
    ADD CONSTRAINT rag_eval_evaluations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rbac_role_permissions rbac_role_permissions_permission_id_rbac_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_permission_id_rbac_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.rbac_permissions(id) ON DELETE CASCADE;


--
-- Name: rbac_role_permissions rbac_role_permissions_role_id_rbac_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_rbac_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: rbac_user_roles rbac_user_roles_role_id_rbac_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_role_id_rbac_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: rbac_user_roles rbac_user_roles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_groups session_groups_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_groups
    ADD CONSTRAINT session_groups_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_group_id_session_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_group_id_session_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.session_groups(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: threads threads_parent_thread_id_threads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_parent_thread_id_threads_id_fk FOREIGN KEY (parent_thread_id) REFERENCES public.threads(id) ON DELETE SET NULL;


--
-- Name: threads threads_topic_id_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_topic_id_topics_id_fk FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: threads threads_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: topic_documents topic_documents_document_id_documents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topic_documents
    ADD CONSTRAINT topic_documents_document_id_documents_id_fk FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: topic_documents topic_documents_topic_id_topics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topic_documents
    ADD CONSTRAINT topic_documents_topic_id_topics_id_fk FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: topic_documents topic_documents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topic_documents
    ADD CONSTRAINT topic_documents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: topics topics_group_id_chat_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_group_id_chat_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.chat_groups(id) ON DELETE CASCADE;


--
-- Name: topics topics_session_id_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_session_id_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: topics topics_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: unstructured_chunks unstructured_chunks_composite_id_chunks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unstructured_chunks
    ADD CONSTRAINT unstructured_chunks_composite_id_chunks_id_fk FOREIGN KEY (composite_id) REFERENCES public.chunks(id) ON DELETE CASCADE;


--
-- Name: unstructured_chunks unstructured_chunks_file_id_files_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unstructured_chunks
    ADD CONSTRAINT unstructured_chunks_file_id_files_id_fk FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: unstructured_chunks unstructured_chunks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unstructured_chunks
    ADD CONSTRAINT unstructured_chunks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: usage_logs usage_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_cost_settings user_cost_settings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_cost_settings
    ADD CONSTRAINT user_cost_settings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_installed_plugins user_installed_plugins_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_installed_plugins
    ADD CONSTRAINT user_installed_plugins_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_id_users_id_fk FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict ofWvLdQb4nnZDKdH05LyWQQGfQ8lWEMepwmAfVjep0NED8BpdoqachA19WvFdEP

