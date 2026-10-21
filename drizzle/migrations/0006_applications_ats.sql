ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'nuevo' CHECK (stage IN ('nuevo','preseleccionado','descartado')),
  ADD COLUMN IF NOT EXISTS seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
GRANT UPDATE (stage, seen_at, updated_at) ON public.applications TO authenticated;
CREATE POLICY owner_manages_applications ON public.applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = applications.job_id AND j.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = applications.job_id AND j.owner_id = auth.uid()));
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;