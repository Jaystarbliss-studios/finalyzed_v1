-- Remove the obsolete overloaded onboarding signature.
-- Keeping two complete_onboarding signatures that share the first 14 parameters can
-- cause PostgREST RPC resolution problems for clients that send optional fields.
drop function if exists public.complete_onboarding(text,text,text,text,text,text,text,text,text,text,text,text,text[],text);